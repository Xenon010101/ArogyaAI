const https = require('https');

const OPENFDA_API = 'https://api.fda.gov/drug';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function getDrugLabel(rxcui) {
  console.log('[OpenFDA] Getting label for RxCUI:', rxcui);
  
  try {
    const url = `${OPENFDA_API}/label.json?search=openfda.rxcui:${rxcui}&limit=1`;
    const data = await fetchJson(url);
    
    if (!data || !data.results || data.results.length === 0) {
      return null;
    }

    const label = data.results[0];
    return {
      indications: label.indications_and_usage || [],
      dosage: label.dosage_and_administration || [],
      contraindications: label.contraindications || [],
      warnings: label.warnings || [],
      adverseReactions: label.adverse_reactions || [],
      pregnancyCategory: label.pregnancy || [],
      breastfeeing: label.breastfeeding || [],
    };
  } catch (error) {
    console.error('[OpenFDA] Label error:', error.message);
    return null;
  }
}

async function getAdverseEvents(rxcui, limit = 10) {
  console.log('[OpenFDA] Getting adverse events for RxCUI:', rxcui);
  
  try {
    const url = `${OPENFDA_API}/event.json?search=patient.drug.openfda.rxcui:${rxcui}&limit=${limit}`;
    const data = await fetchJson(url);
    
    if (!data || !data.results) {
      return [];
    }

    const events = [];
    for (const event of data.results) {
      events.push({
        seriousness: event.serious || [],
        reaction: event.reaction || [],
        outcome: event.outcome || [],
      });
    }
    
    console.log('[OpenFDA] Found', events.length, 'adverse events');
    return events;
  } catch (error) {
    console.error('[OpenFDA] Adverse events error:', error.message);
    return [];
  }
}

async function checkRecalls(rxcui) {
  console.log('[OpenFDA] Checking recalls for RxCUI:', rxcui);
  
  try {
    const url = `${OPENFDA_API}/enforcement.json?search=openfda.rxcui:${rxcui}&limit=5`;
    const data = await fetchJson(url);
    
    if (!data || !data.results || data.results.length === 0) {
      return { hasRecall: false, recalls: [] };
    }

    const recalls = [];
    for (const recall of data.results) {
      recalls.push({
        status: recall.status,
        reason: recall.reason_for_recall,
        date: recall.recall_initiation_date,
        firm: recall.recalling_firm,
      });
    }
    
    console.log('[OpenFDA] Found', recalls.length, 'recalls');
    return { hasRecall: true, recalls };
  } catch (error) {
    console.error('[OpenFDA] Recalls error:', error.message);
    return { hasRecall: false, recalls: [] };
  }
}

async function searchByDrugName(drugName) {
  console.log('[OpenFDA] Searching by drug name:', drugName);
  
  try {
    const url = `${OPENFDA_API}/label.json?search=openfda.substance_name:${encodeURIComponent(drugName)}&limit=1`;
    const data = await fetchJson(url);
    
    if (!data || !data.results || data.results.length === 0) {
      return null;
    }

    return data.results[0];
  } catch (error) {
    console.error('[OpenFDA] Search error:', error.message);
    return null;
  }
}

async function getBoxWarnings(rxcui) {
  console.log('[OpenFDA] Getting box warnings for RxCUI:', rxcui);
  
  try {
    const url = `${OPENFDA_API}/label.json?search=openfda.rxcui:${rxcui}&limit=1`;
    const data = await fetchJson(url);
    
    if (!data || !data.results || data.results.length === 0) {
      return [];
    }

    const label = data.results[0];
    return label.boxed_warning || [];
  } catch (error) {
    console.error('[OpenFDA] Box warnings error:', error.message);
    return [];
  }
}

module.exports = {
  getDrugLabel,
  getAdverseEvents,
  checkRecalls,
  searchByDrugName,
  getBoxWarnings,
};
