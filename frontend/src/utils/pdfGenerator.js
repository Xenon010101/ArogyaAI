import { jsPDF } from 'jspdf'

export function generateAnalysisPDF(analysis) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A'
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  const newPage = () => {
    doc.addPage()
    y = margin
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('ArogyaAI Medical Report - Page ' + doc.getCurrentPageInfo().pageNumber, pageWidth / 2, pageHeight - 8, { align: 'center' })
    y += 8
  }

  const checkPage = (h = 15) => {
    if (y + h > pageHeight - 25) newPage()
  }

  const space = (h = 5) => { y += h }

  const title = (text) => {
    checkPage(18)
    space(3)
    doc.setFillColor(0, 51, 102)
    doc.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(text.toUpperCase(), margin + 3, y + 2)
    doc.setTextColor(0, 0, 0)
    y += 12
  }

  const label = (text) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text(text + ':', margin, y)
  }

  const value = (text) => {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(text || '-', margin + 40, y)
  }

  const paragraph = (text, size = 9) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - 8)
    lines.forEach(line => {
      checkPage(5)
      doc.text(line, margin + 3, y)
      y += size * 0.45
    })
  }

  const bullet = (text, size = 9) => {
    checkPage(6)
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text('•  ' + text, margin + 3, y)
    y += size * 0.5
  }

  const checkbox = (text, size = 9) => {
    checkPage(7)
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    const cleanText = cleanTestName(text)
    doc.text('[_] ' + cleanText, margin + 3, y)
    y += 7
  }

  const displayDate = formatDate(analysis.analyzedAt || analysis.createdAt)
  const riskLevel = (analysis.combinedRiskLevel || 'moderate').toUpperCase()

  const riskColors = { CRITICAL: [180, 0, 0], HIGH: [200, 80, 0], MODERATE: [150, 120, 0], LOW: [0, 120, 0] }
  const riskColor = riskColors[riskLevel] || [0, 0, 0]

  // ===== HEADER =====
  doc.setFillColor(0, 51, 102)
  doc.rect(0, 0, pageWidth, 38, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('AROGYAAI', margin, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('AI-Powered Medical Analysis System', margin, 24)
  doc.setFontSize(9)
  doc.text('Report Generated: ' + displayDate, margin, 32)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('MEDICAL ANALYSIS REPORT', pageWidth - margin, 16, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('CONFIDENTIAL MEDICAL DOCUMENT', pageWidth - margin, 24, { align: 'right' })
  doc.setTextColor(200, 200, 200)
  doc.text('For Professional Medical Use', pageWidth - margin, 32, { align: 'right' })

  y = 45
  space(5)

  // ===== PATIENT DETAILS BOX =====
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(248, 248, 248)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 2, 2, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102)
  doc.text('PATIENT INFORMATION', margin + 4, y + 7)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)

  const col1 = margin + 5
  const col2 = pageWidth / 2 - 5

  doc.text('Name:', col1, y + 16)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(analysis.user?.name || 'Not provided', col1 + 20, y + 16)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text('Age:', col2, y + 16)
  doc.setTextColor(0, 0, 0)
  doc.text(String(analysis.userContext?.age || 'N/A') + ' years', col2 + 15, y + 16)

  doc.setTextColor(60, 60, 60)
  doc.text('Gender:', col1, y + 24)
  doc.setTextColor(0, 0, 0)
  const gender = analysis.userContext?.gender
  doc.text(gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'N/A', col1 + 22, y + 24)

  doc.setTextColor(60, 60, 60)
  doc.text('Date:', col2, y + 24)
  doc.setTextColor(0, 0, 0)
  doc.text(displayDate, col2 + 18, y + 24)

  y += 35
  space(5)

  // ===== RISK ASSESSMENT BOX =====
  doc.setFillColor(...riskColor)
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('CLINICAL RISK ASSESSMENT', margin + 5, y + 8)
  doc.setFontSize(10)
  doc.text('RISK LEVEL: ' + riskLevel, margin + 5, y + 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(getRiskReason(analysis), pageWidth - margin - 3, y + 12, { align: 'right' })

  y += 25
  space(5)

  // ===== CHIEF COMPLAINT =====
  title('Chief Complaint')
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(220, 220, 220)
  doc.roundedRect(margin, y - 2, pageWidth - margin * 2, 20, 1, 1, 'S')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(40, 40, 40)
  doc.text('"' + (analysis.symptoms || 'Symptoms not specified') + '"', margin + 4, y + 6)
  y += 22
  space(5)

  // ===== AI CLINICAL ASSESSMENT =====
  title('AI Clinical Assessment')

  if (analysis.ai?.conditions?.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 51, 102)
    doc.text('Possible Diagnoses:', margin + 3, y)
    y += 7

    analysis.ai.conditions.forEach((condition, i) => {
      checkPage(10)
      doc.setFillColor(245, 248, 255)
      doc.roundedRect(margin + 3, y - 3, pageWidth - margin * 2 - 6, 9, 1, 1, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 51, 102)
      doc.text((i + 1) + '.', margin + 7, y + 3)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(condition, margin + 15, y + 3)
      y += 10
    })
    space(4)
  }

  // Confidence Score
  const confidence = analysis.ai?.confidence !== undefined
    ? Math.round(analysis.ai.confidence * 100)
    : 65
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  doc.text('AI Confidence Level:', margin + 3, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(confidence + '%', margin + 45, y)

  doc.setFillColor(230, 230, 230)
  doc.roundedRect(margin + 60, y - 3, 60, 6, 1, 1, 'F')
  const confColor = confidence >= 70 ? [0, 150, 0] : confidence >= 50 ? [200, 150, 0] : [200, 0, 0]
  doc.setFillColor(...confColor)
  doc.roundedRect(margin + 60, y - 3, Math.max((confidence / 100) * 60, 3), 6, 1, 1, 'F')
  y += 10
  space(4)

  // ===== CLINICAL REASONING =====
  if (analysis.ai?.clinical_reasoning) {
    title('Clinical Reasoning')
    paragraph(analysis.ai.clinical_reasoning)
    space(4)
  }

  // ===== RECOMMENDED TESTS =====
  title('Recommended Diagnostic Tests')
  const rawTests = analysis.ai?.suggested_tests?.length > 0
    ? analysis.ai.suggested_tests
    : getDefaultTests(analysis)
  const tests = rawTests
    .filter(t => t && typeof t === 'string' && t.length > 0)
    .map(t => cleanTestName(t))
  tests.forEach(test => checkbox(test))
  space(4)

  // ===== SPECIALIST REFERRAL =====
  title('Specialist Referral')
  const specialist = analysis.ai?.recommended_specialist || 'General Physician'
  doc.setFillColor(240, 248, 255)
  doc.roundedRect(margin, y - 2, pageWidth - margin * 2, 14, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102)
  doc.text('Recommended: ' + specialist, pageWidth / 2, y + 5, { align: 'center' })
  y += 16
  space(4)

  // ===== RED FLAGS =====
  if (analysis.ai?.red_flags?.length > 0) {
    doc.setFillColor(255, 240, 240)
    doc.roundedRect(margin, y, pageWidth - margin * 2, 12 + analysis.ai.red_flags.length * 7, 2, 2, 'F')
    doc.setDrawColor(200, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(180, 0, 0)
    doc.text('⚠  CLINICAL ALERTS', margin + 4, y + 7)
    y += 11
    analysis.ai.red_flags.forEach(flag => {
      checkPage(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(150, 0, 0)
      doc.text('⚠  ' + flag, margin + 4, y)
      y += 7
    })
    space(5)
  }

  // ===== SIGNATURE LINE =====
  checkPage(40)
  space(8)
  doc.setDrawColor(100, 100, 100)
  doc.line(margin, y, margin + 70, y)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Doctor/Physician Signature', margin, y + 5)

  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y)
  doc.text('Date', pageWidth - margin - 70, y + 5)
  y += 15

  // ===== FOOTER =====
  doc.setFillColor(245, 245, 245)
  doc.rect(0, pageHeight - 22, pageWidth, 22, 'F')

  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)
  doc.text('This report is generated by ArogyaAI for informational purposes only. It does not constitute medical advice.', pageWidth / 2, pageHeight - 16, { align: 'center' })
  doc.text('Always consult a qualified healthcare professional for diagnosis and treatment. In case of emergency, call emergency services immediately.', pageWidth / 2, pageHeight - 12, { align: 'center' })
  doc.setTextColor(150, 150, 150)
  doc.text('ArogyaAI Medical Analysis System  |  Report ID: ' + (analysis._id || '').substring(0, 12), pageWidth / 2, pageHeight - 6, { align: 'center' })

  return doc
}

function cleanTestName(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\u00A0]/g, ' ')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2026/g, '...')
    .trim()
}

function getRiskReason(analysis) {
  const symptoms = (analysis.symptoms || '').toLowerCase()
  const risk = analysis.combinedRiskLevel || 'moderate'

  if (symptoms.includes('chest') && (risk === 'critical' || risk === 'high')) {
    return 'Cardiac evaluation required'
  }
  if (symptoms.includes('chest') || symptoms.includes('heart')) {
    return 'Cardiac symptoms detected'
  }
  if (symptoms.includes('fever') && symptoms.includes('cough')) {
    return 'Respiratory assessment recommended'
  }
  if (symptoms.includes('breathing')) {
    return 'Respiratory evaluation required'
  }

  const reasons = {
    critical: 'Immediate medical attention required',
    high: 'Prompt medical evaluation advised',
    moderate: 'Medical consultation recommended',
    low: 'Monitor and rest advised'
  }
  return reasons[risk] || reasons.moderate
}

function getDefaultTests(analysis) {
  const symptoms = (analysis.symptoms || '').toLowerCase()
  const tests = ['Complete Blood Count (CBC)', 'Basic Metabolic Panel']

  if (symptoms.includes('chest') || symptoms.includes('heart')) {
    tests.unshift('ECG (Electrocardiogram)', 'Chest X-Ray', 'Lipid Profile')
  }
  if (symptoms.includes('fever')) {
    tests.push('Fever Panel / Typhoid Test', 'Malaria Test')
  }
  if (symptoms.includes('stomach') || symptoms.includes('nausea')) {
    tests.push('Abdominal Ultrasound', 'Stool Examination')
  }
  if (symptoms.includes('cough')) {
    tests.push('Chest X-Ray', 'Sputum Culture')
  }

  return [...new Set(tests)].slice(0, 6)
}

export function downloadAnalysisPDF(analysis) {
  const doc = generateAnalysisPDF(analysis)
  const filename = `ArogyaAI-Medical-Report-${(analysis._id || Date.now()).substring(0, 8)}.pdf`
  doc.save(filename)
  return filename
}
