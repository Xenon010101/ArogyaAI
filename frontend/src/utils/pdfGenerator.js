import { jsPDF } from 'jspdf'

export function generateAnalysisPDF(analysis) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = margin

  const addLine = () => {
    yPosition += 8
    if (yPosition > 270) {
      doc.addPage()
      yPosition = margin
    }
  }

  const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(text, margin, yPosition)
    yPosition += fontSize * 0.4
  }

  const addWrappedText = (text, fontSize = 11, isBold = false) => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
    lines.forEach((line) => {
      doc.text(line, margin, yPosition)
      yPosition += fontSize * 0.5
    })
  }

  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ArogyaAI Health Analysis Report', pageWidth / 2, 18, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('AI-Powered Health Analysis', pageWidth / 2, 28, { align: 'center' })

  yPosition = 55

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.text(`Generated on: ${new Date(analysis.analyzedAt).toLocaleString()}`, margin, yPosition)
  yPosition += 5
  doc.text(`Report ID: ${analysis._id}`, margin, yPosition)

  yPosition += 10

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  const riskColors = {
    critical: [220, 38, 38],
    high: [234, 88, 12],
    moderate: [202, 138, 4],
    low: [22, 163, 74],
  }
  const riskColor = riskColors[analysis.combinedRiskLevel] || [0, 0, 0]

  doc.setFillColor(...riskColor)
  doc.roundedRect(margin, yPosition, 60, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Risk Level: ${analysis.combinedRiskLevel.toUpperCase()}`, margin + 5, yPosition + 8)

  yPosition += 25

  addText('PATIENT INFORMATION', 14, true, [59, 130, 246])
  addLine()
  addText(`Name: ${analysis.user?.name || 'Patient'}`, 11)
  addText(`Analysis Date: ${new Date(analysis.analyzedAt).toLocaleString()}`, 11)
  addLine()

  addText('SYMPTOMS REPORTED', 14, true, [59, 130, 246])
  addLine()
  addWrappedText(analysis.symptoms, 11)
  addLine()

  if (analysis.triage?.flags?.length > 0) {
    addText('DETECTED SYMPTOMS FLAGS', 14, true, [59, 130, 246])
    addLine()
    analysis.triage.flags.forEach((flag) => {
      doc.setFillColor(254, 242, 242)
      doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 15, 2, 2, 'F')
      doc.setTextColor(185, 28, 28)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(flag.message, margin + 5, yPosition + 6)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Severity: ${flag.severity}`, margin + 5, yPosition + 12)
      yPosition += 20
    })
    addLine()
  }

  if (analysis.ai) {
    addText('AI ANALYSIS', 14, true, [59, 130, 246])
    addLine()

    if (analysis.ai.summary) {
      addText('Summary:', 11, true)
      addWrappedText(analysis.ai.summary, 11)
      addLine()
    }

    if (analysis.ai.possibleConditions?.length > 0) {
      addText('Possible Conditions:', 11, true)
      analysis.ai.possibleConditions.forEach((condition) => {
        doc.setTextColor(0, 0, 0)
        doc.text(`  - ${condition}`, margin + 5, yPosition)
        yPosition += 6
      })
      addLine()
    }

    if (analysis.ai.recommendations?.length > 0) {
      addText('Recommendations:', 11, true)
      analysis.ai.recommendations.forEach((rec) => {
        doc.setTextColor(0, 0, 0)
        doc.text(`  - ${rec}`, margin + 5, yPosition)
        yPosition += 6
      })
      addLine()
    }

    if (analysis.ai.specialistSuggestion) {
      addText(`Suggested Specialist: ${analysis.ai.specialistSuggestion}`, 11, true)
      addLine()
    }
  }

  if (analysis.triage?.recommendation) {
    addText('TRIAGE RECOMMENDATION', 14, true, [59, 130, 246])
    addLine()
    addText(analysis.triage.recommendation.action, 12, true, riskColor)
    addWrappedText(analysis.triage.recommendation.instruction, 11)
    addLine()
  }

  if (analysis.files?.length > 0) {
    addText('ATTACHED FILES', 14, true, [59, 130, 246])
    addLine()
    analysis.files.forEach((file) => {
      addText(`- ${file.originalName || file.fileName} (${file.category})`, 10)
    })
    addLine()
  }

  doc.setDrawColor(200, 200, 200)
  const footerY = 275
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFillColor(254, 242, 242)
  doc.roundedRect(margin, footerY, pageWidth - margin * 2, 20, 2, 2, 'F')

  doc.setTextColor(150, 50, 50)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('DISCLAIMER', pageWidth / 2, footerY + 6, { align: 'center' })

  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 50, 50)
  doc.setFontSize(8)
  const disclaimer = 'This report is AI-generated and not a substitute for medical advice. Please consult a qualified healthcare professional for proper diagnosis and treatment.'
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2 - 10)
  disclaimerLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, footerY + 11 + i * 4, { align: 'center' })
  })

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.text('Generated by ArogyaAI - AI-Powered Health Analysis', pageWidth / 2, 290, { align: 'center' })

  return doc
}

export function downloadAnalysisPDF(analysis) {
  const doc = generateAnalysisPDF(analysis)
  const filename = `arogyaai-report-${analysis._id}-${Date.now()}.pdf`
  doc.save(filename)
  return filename
}
