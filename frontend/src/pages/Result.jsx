import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { downloadAnalysisPDF } from '../utils/pdfGenerator'
import { AlertTriangle, Clock, User, FileText, Image, ArrowLeft, Download, Share2 } from 'lucide-react'
import { Card, Button, LoadingSpinner, RiskBadge, Alert, ErrorState } from '../components/common'
import toast from 'react-hot-toast'

export default function Result() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await analyzeApi.getAnalysis(id)
      setAnalysis(response.data.analysis)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load analysis'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const handleDownloadPDF = async () => {
    if (!analysis) return

    setDownloading(true)
    try {
      const filename = downloadAnalysisPDF(analysis)
      toast.success('PDF downloaded successfully!')
    } catch (err) {
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!analysis) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ArogyaAI Health Analysis',
          text: `Risk Level: ${analysis.combinedRiskLevel}`,
          url: window.location.href,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Failed to share')
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState message={error} onRetry={fetchAnalysis} />
        <div className="mt-4 text-center">
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Analysis not found</p>
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const { triage, ai, combinedRiskLevel, files, analyzedAt } = analysis

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/history">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Analysis Result</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPDF}
            loading={downloading}
            disabled={downloading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {combinedRiskLevel === 'critical' && (
        <Alert variant="emergency">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Critical Risk Level Detected</p>
              <p className="text-sm mt-1">
                Please seek immediate medical attention. This is not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Risk Assessment</h2>
              <RiskBadge level={combinedRiskLevel} />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Triage Analysis</h3>
              <p className="text-sm text-gray-600">{triage?.recommendation?.instruction}</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Summary</h3>
                <p className="text-gray-900">{ai?.summary}</p>
              </div>

              {ai?.possibleConditions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Possible Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {ai.possibleConditions.map((condition, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ai?.recommendations?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
                  <ul className="space-y-2">
                    {ai.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-primary-600 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai?.specialistSuggestion && (
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm font-medium text-primary-900">
                    Suggested Specialist: {ai.specialistSuggestion}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {triage?.flags?.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detected Symptoms</h2>
              <div className="space-y-2">
                {triage.flags.map((flag, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{flag.message}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      flag.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      flag.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Analysis Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{new Date(analyzedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>{analysis.user?.name || 'You'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Your Symptoms</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{analysis.symptoms}</p>
          </Card>

          {files?.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Uploaded Files</h3>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <a
                    key={i}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    {file.category === 'image' ? (
                      <Image className="h-4 w-4 text-gray-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700 truncate">{file.originalName || file.fileName}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card className="bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute medical advice. Always consult a healthcare professional for proper diagnosis and treatment.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
