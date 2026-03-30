import { jsPDF } from 'jspdf'

export function generateAnalysisPDF(analysis) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A'
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return 'N/A'
    }
  }

  const newPage = () => {
    doc.addPage()
    y = margin
    doc.setFontSize(9)
    doc.setTextColor(150)
    doc.text('ArogyaAI Health Report - Page ' + doc.getCurrentPageInfo().pageNumber, pageWidth / 2, pageHeight - 8, { align: 'center' })
    y += 10
  }

  const checkPage = (h = 15) => {
    if (y + h > pageHeight - 20) newPage()
  }

  const space = (h = 6) => { y += h }
  const line = () => {
    doc.setDrawColor(220)
    doc.line(margin, y, pageWidth - margin, y)
    space(3)
  }

  const title = (text) => {
    checkPage(15)
    space(2)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(text.toUpperCase(), margin, y)
    y += 7
    line()
  }

  const label = (text) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text(text, margin, y)
  }

  const value = (text) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(text || '-', margin + 50, y)
  }

  const paragraph = (text, size = 10) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
    lines.forEach(line => {
      checkPage(5)
      doc.text(line, margin, y)
      y += size * 0.45
    })
  }

  const bullet = (text, size = 10) => {
    checkPage(6)
    doc.setFontSize(size)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text('• ' + text, margin + 3, y)
    y += size * 0.5
  }

  const displayDate = formatDate(analysis.analyzedAt || analysis.createdAt)
  const riskLevel = (analysis.combinedRiskLevel || 'moderate').toUpperCase()

  const riskColors = { CRITICAL: [200, 0, 0], HIGH: [220, 100, 0], MODERATE: [180, 140, 0], LOW: [0, 150, 0] }
  const riskColor = riskColors[riskLevel] || [0, 0, 0]

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 102)
  doc.text('AROGYAAI HEALTH REPORT', margin, y + 8)
  space(12)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text('Report Date: ' + displayDate + '   |   ID: ' + (analysis._id || '').substring(0, 12), margin, y)
  space(10)

  doc.setFillColor(...riskColor)
  doc.roundedRect(margin, y, 180, 22, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RISK LEVEL: ' + riskLevel, margin + 10, y + 9)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(getRiskReason(analysis), margin + 10, y + 17)
  doc.setTextColor(0, 0, 0)
  space(26)

  title('PATIENT INFORMATION')
  label('Name:'); value(analysis.user?.name || 'Not provided'); space()
  label('Age:'); value(analysis.userContext?.age ? analysis.userContext.age + ' years' : 'Not provided'); space()
  label('Gender:'); value(analysis.userContext?.gender ? analysis.userContext.gender.charAt(0).toUpperCase() + analysis.userContext.gender.slice(1) : 'Not provided'); space()
  label('Medical History:'); value(analysis.userContext?.medicalHistory?.join(', ') || 'None'); space(10)

  title('SYMPTOMS')
  paragraph('Patient reported: ' + (analysis.symptoms || 'Not specified'))
  space(4)

  if (analysis.ai?.detected_symptoms?.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text('Detected symptoms:', margin, y)
    y += 5
    analysis.ai.detected_symptoms.forEach(s => bullet(s.replace(/_/g, ' ')))
  }
  space(4)

  if (analysis.triage?.flags?.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text('Clinical flags:', margin, y)
    y += 5
    analysis.triage.flags.forEach(f => bullet(f.message + ' (Severity: ' + f.severity + ')'))
  }
  space(6)

  title('POSSIBLE CONDITIONS')
  const conditions = analysis.ai?.conditions?.length > 0
    ? analysis.ai.conditions
    : ['Viral Infection', 'Common Cold', 'General Illness']
  conditions.forEach(c => bullet(c))
  space(6)

  title('CONFIDENCE SCORE')
  const confidence = analysis.ai?.confidence !== undefined
    ? Math.round(analysis.ai.confidence * 100)
    : 60
  const confLevel = confidence >= 75 ? 'HIGH' : confidence >= 50 ? 'MODERATE' : 'LOW'
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(confidence + '% (' + confLevel + ')', margin, y)
  space(8)

  title('CLINICAL REASONING')
  const reasoning = analysis.ai?.clinical_reasoning || getDefaultReasoning(analysis)
  paragraph(reasoning)
  space(6)

  title('RECOMMENDED SPECIALIST')
  const specialist = analysis.ai?.recommended_specialist || 'General Physician'
  bullet(specialist)
  space(6)

  title('NEXT STEPS')
  const nextSteps = getNextSteps(riskLevel)
  nextSteps.forEach(step => bullet(step))
  space(6)

  title('DIAGNOSTIC SUGGESTIONS')
  const tests = analysis.ai?.suggested_tests?.length > 0
    ? analysis.ai.suggested_tests
    : getDefaultTests(analysis)
  tests.forEach(test => bullet(test))
  space(6)

  if (analysis.files?.length > 0) {
    title('ATTACHED DOCUMENTS')
    analysis.files.forEach(f => bullet((f.originalName || f.fileName) + ' (' + f.category + ')'))
    space(6)
  }

  title('DISCLAIMER')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100)
  paragraph('This report is generated by ArogyaAI for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical decisions. In case of emergency, seek immediate medical attention.', 8)
  space(10)

  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Generated by ArogyaAI - ' + displayDate, pageWidth / 2, pageHeight - 8, { align: 'center' })

  return doc
}

function getRiskReason(analysis) {
  const symptoms = (analysis.symptoms || '').toLowerCase()
  const risk = analysis.combinedRiskLevel || 'moderate'

  if (symptoms.includes('chest') || symptoms.includes('heart')) {
    if (risk === 'critical') return 'Chest pain with high-risk symptoms requires immediate attention'
    return 'Chest symptoms detected - cardiac evaluation recommended'
  }
  if (symptoms.includes('fever') && symptoms.includes('cough')) {
    return 'Fever with cough may indicate respiratory infection'
  }
  if (symptoms.includes('headache')) {
    return 'Headache symptoms reported - monitor for severity changes'
  }
  if (symptoms.includes('stomach') || symptoms.includes('nausea')) {
    return 'Digestive symptoms detected - may indicate gastric issue'
  }

  const reasons = {
    critical: 'High-risk symptoms detected - immediate medical attention required',
    high: 'Concerning symptoms detected - prompt medical evaluation advised',
    moderate: 'Symptoms detected - medical consultation recommended',
    low: 'Minor symptoms detected - rest and monitoring advised'
  }
  return reasons[risk] || reasons.moderate
}

function getDefaultReasoning(analysis) {
  const symptoms = analysis.ai?.detected_symptoms || []
  const conditions = analysis.ai?.conditions || []
  const risk = analysis.combinedRiskLevel || 'moderate'

  let reason = ''
  if (symptoms.length > 0) {
    reason = 'Based on the reported symptoms (' + symptoms.map(s => s.replace(/_/g, ' ')).join(', ') + '), '
  }

  if (conditions.length > 0) {
    reason += 'the analysis suggests possible conditions including ' + conditions.slice(0, 2).join(' and ') + '. '
  } else {
    reason += 'common conditions like viral infection or common cold may be present. '
  }

  if (risk === 'critical' || risk === 'high') {
    reason += 'Due to the severity of symptoms, immediate medical evaluation is recommended.'
  } else if (risk === 'moderate') {
    reason += 'Medical consultation within 24-48 hours is advised.'
  } else {
    reason += 'Rest and symptom monitoring are recommended.'
  }

  return reason
}

function getNextSteps(riskLevel) {
  const steps = {
    CRITICAL: [
      'Seek immediate emergency medical attention',
      'Visit nearest hospital or call emergency services',
      'Do not delay - high-risk symptoms detected',
      'Bring this report to the medical facility'
    ],
    HIGH: [
      'Consult a doctor within 24 hours',
      'Do not ignore symptoms - seek medical evaluation',
      'Prepare your medical history for the doctor',
      'Consider visiting urgent care if symptoms worsen'
    ],
    MODERATE: [
      'Schedule a medical appointment within 2-3 days',
      'Monitor symptoms and note any changes',
      'Rest and stay hydrated',
      'Seek earlier care if symptoms worsen'
    ],
    LOW: [
      'Rest and maintain hydration',
      'Monitor symptoms for 2-3 days',
      'Consider over-the-counter remedies if needed',
      'Consult a doctor if symptoms persist beyond a week'
    ]
  }
  return steps[riskLevel] || steps.MODERATE
}

function getDefaultTests(analysis) {
  const symptoms = (analysis.symptoms || '').toLowerCase()
  const tests = ['Complete Blood Count (CBC)', 'General Health Check']

  if (symptoms.includes('chest') || symptoms.includes('heart')) {
    tests.unshift('ECG (Electrocardiogram)', 'Chest X-ray')
  }
  if (symptoms.includes('fever')) {
    tests.push('Fever Panel / Typhoid Test')
  }
  if (symptoms.includes('stomach') || symptoms.includes('nausea')) {
    tests.push('Abdominal Ultrasound', 'Stool Examination')
  }
  if (symptoms.includes('cough')) {
    tests.push('Chest X-ray', 'Sputum Test')
  }

  return [...new Set(tests)].slice(0, 5)
}

export function downloadAnalysisPDF(analysis) {
  const doc = generateAnalysisPDF(analysis)
  const filename = `arogyaai-report-${(analysis._id || Date.now()).substring(0, 8)}.pdf`
  doc.save(filename)
  return filename
}
