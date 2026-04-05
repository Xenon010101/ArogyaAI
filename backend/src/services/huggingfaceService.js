const https = require('https');

const HF_API_URL = 'https://router.huggingface.co/v1';

const OCR_MODELS = [
  'Qwen/Qwen2.5-VL-72B-Instruct',
  'Qwen/Qwen2-VL-72B-Instruct',
  'google/gemma-3-27b-it'
];

function queryHuggingFaceChat(model, messages) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
      reject(new Error('Hugging Face API key not configured'));
      return;
    }

    const data = JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1024,
      stream: false
    });

    const options = {
      hostname: 'router.huggingface.co',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            const content = response.choices?.[0]?.message?.content;
            resolve(content);
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else if (res.statusCode === 503) {
          reject(new Error('Model is loading. Please try again later.'));
        } else {
          reject(new Error(`HF API Error ${res.statusCode}: ${body.substring(0, 300)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function extractTextFromImage(imagePath) {
  console.log('[HF OCR] Starting OCR for:', imagePath);
  
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    console.warn('[HF OCR] API key not configured');
    return null;
  }

  try {
    const fs = require('fs');
    
    if (!fs.existsSync(imagePath)) {
      console.error('[HF OCR] File not found:', imagePath);
      return null;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const ext = imagePath.toLowerCase().split('.').pop();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    if (ext === 'webp') mimeType = 'image/webp';

    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    for (const model of OCR_MODELS) {
      try {
        console.log('[HF OCR] Trying vision model:', model);
        
        const prompt = `You are an OCR system. Extract ALL text from this medical prescription or document. Include:
1. Patient name (if visible)
2. Doctor name (if visible)
3. Date (if visible)
4. All medication names and dosages
5. Any instructions or notes
6. Any other visible text

Format the output clearly. If you cannot read something clearly, indicate it with [unclear].
Be thorough and extract every piece of text you can see.`;

        const messages = [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ];

        const result = await queryHuggingFaceChat(model, messages);

        if (result && result.trim().length > 10) {
          console.log('[HF OCR] Success! Extracted', result.length, 'characters using', model);
          return {
            success: true,
            text: result.trim(),
            model: model
          };
        }
        
        console.log('[HF OCR] Model returned empty result');
        
      } catch (modelError) {
        console.warn('[HF OCR] Model', model, 'failed:', modelError.message.substring(0, 100));
        continue;
      }
    }

    console.warn('[HF OCR] All models failed');
    return null;

  } catch (error) {
    console.error('[HF OCR] Error:', error.message);
    return null;
  }
}

async function extractTextFromPDF(pdfPath) {
  console.log('[HF OCR] Processing PDF:', pdfPath);
  
  let pdfParse = null;
  try {
    pdfParse = require('pdf-parse');
  } catch (e) {
    console.warn('[HF OCR] pdf-parse not available');
  }

  if (!pdfParse) {
    return null;
  }

  try {
    const fs = require('fs');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    
    if (data && data.text && data.text.trim().length > 50) {
      console.log('[HF OCR] PDF has text content:', data.text.trim().length, 'chars');
      return {
        success: true,
        text: data.text.trim(),
        model: 'pdf-parse'
      };
    }

    console.log('[HF OCR] PDF appears to be scanned/image-based');
    return {
      success: false,
      text: data.text?.trim() || '',
      model: 'pdf-parse',
      isScanned: true
    };

  } catch (error) {
    console.error('[HF OCR] PDF processing error:', error.message);
    return null;
  }
}

async function processPrescriptionFile(filePath) {
  console.log('[HF OCR] Processing prescription file:', filePath);
  
  const ext = filePath.toLowerCase().split('.').pop();
  
  if (ext === 'pdf') {
    const pdfResult = await extractTextFromPDF(filePath);
    
    if (pdfResult && !pdfResult.success && pdfResult.isScanned) {
      console.log('[HF OCR] PDF is scanned, trying image-based OCR...');
      return await extractTextFromImage(filePath);
    }
    
    return pdfResult;
  }
  
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
    return await extractTextFromImage(filePath);
  }
  
  console.warn('[HF OCR] Unsupported file type:', ext);
  return null;
}

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  processPrescriptionFile,
  queryHuggingFaceChat,
  OCR_MODELS
};
