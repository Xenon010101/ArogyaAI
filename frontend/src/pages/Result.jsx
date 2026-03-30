import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { downloadAnalysisPDF } from '../utils/pdfGenerator'
import { 
  AlertTriangle, Clock, User, FileText, Image, ArrowLeft, 
  Download, Share2, Activity, Shield, CheckCircle, Stethoscope,
  Heart, Pill, Zap, Calendar
} from 'lucide-react'
import { Card, Button, LoadingSpinner, RiskBadge, Alert, ErrorState } from '../components/common'
import toast from 'react-hot-toast'

function formatDate(dateValue) {
  if (!dateValue) return 'N/A'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

const riskExplanations = {
  critical: 'Immediate medical attention required. Call emergency services.',
  high: 'Urgent care recommended. Consult a doctor within 24 hours.',
  moderate: 'Schedule an appointment with your healthcare provider.',
  low: 'Monitor symptoms. Seek care if they persist.',
}

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
      setError(err.response?.data?.message || 'Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAnalysis() }, [fetchAnalysis])

  const handleDownloadPDF = async () => {
    if (!analysis) return
    setDownloading(true)
    try {
      downloadAnalysisPDF(analysis)
      toast.success('PDF downloaded!')
    } catch {
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
          text: `Risk: ${analysis.combinedRiskLevel}`,
          url: window.location.href,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(window.location.href)
          toast.success('Link copied!')
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorState message={error} onRetry={fetchAnalysis} />
        <div className="text-center mt-6">
          <Link to="/dashboard">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-4">Analysis not found</p>
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const { triage, ai, combinedRiskLevel, files, analyzedAt, createdAt, symptoms, user } = analysis
  const displayDate = formatDate(analyzedAt || createdAt)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/history" className="text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Analysis</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {displayDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleDownloadPDF} loading={downloading}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {combinedRiskLevel === 'critical' && (
        <Alert variant="emergency" className="mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Critical Risk Level</p>
              <p className="text-sm opacity-90 mt-1">Seek immediate medical attention.</p>
            </div>
          </div>
        </Alert>
      )}

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center">
              <Shield className={`h-7 w-7 ${
                combinedRiskLevel === 'critical' ? 'text-red-600' :
                combinedRiskLevel === 'high' ? 'text-orange-600' :
                combinedRiskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Risk Assessment</p>
              <p className="text-gray-700 mt-1">{riskExplanations[combinedRiskLevel]}</p>
            </div>
          </div>
          <RiskBadge level={combinedRiskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {ai?.summary && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Analysis Summary</h2>
                  <p className="text-xs text-gray-500">Powered by Gemini AI</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed pl-[52px]">{ai.summary}</p>
            </Card>
          )}

          {ai?.conditions?.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Possible Conditions</h2>
                  <p className="text-xs text-gray-500">{ai.conditions.length} conditions identified</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-[52px]">
                {ai.conditions.map((condition, i) => (
                  <span key={i} className="px-4 py-2 bg-purple-50 text-purple-800 rounded-lg text-sm font-medium border border-purple-100">
                    {condition}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {ai?.recommendations?.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Pill className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Recommendations</h2>
                  <p className="text-xs text-gray-500">{ai.recommendations.length} suggestions</p>
                </div>
              </div>
              <div className="space-y-3 pl-[52px]">
                {ai.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {ai?.red_flags?.length > 0 && (
            <Card className="bg-red-50 border-red-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-red-900">Red Flags</h2>
                  <p className="text-xs text-red-600">{ai.red_flags.length} warning signs</p>
                </div>
              </div>
              <div className="space-y-2 pl-[52px]">
                {ai.red_flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-red-800">{flag}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {typeof ai?.confidence === 'number' && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">AI Confidence</h2>
                    <p className="text-xs text-gray-500">Analysis reliability score</p>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${
                  ai.confidence >= 0.8 ? 'text-green-600' :
                  ai.confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(ai.confidence * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ai.confidence >= 0.8 ? 'bg-green-500' :
                    ai.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${ai.confidence * 100}%` }}
                />
              </div>
            </Card>
          )}

          {triage?.flags?.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Detected Keywords</h2>
                  <p className="text-xs text-gray-500">{triage.flags.length} symptoms flagged</p>
                </div>
              </div>
              <div className="space-y-2 pl-[52px]">
                {triage.flags.map((flag, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{flag.message}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      flag.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      flag.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
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
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              Patient Info
            </h3>
            <div className="space-y-3 text-sm">
              {user?.name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="text-gray-900 font-medium">{user.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Analyzed</span>
                <span className="text-gray-900">{displayDate}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              Symptoms Reported
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{symptoms}</p>
          </Card>

          {files?.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                Attached Files ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <a
                    key={i}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {file.category === 'image' ? (
                      <Image className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-700 truncate flex-1">{file.originalName || file.fileName}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">Medical Disclaimer</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  This analysis is for informational purposes only and does not constitute medical advice.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
