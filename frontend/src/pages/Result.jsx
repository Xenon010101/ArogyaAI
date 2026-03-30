import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { downloadAnalysisPDF } from '../utils/pdfGenerator'
import { 
  AlertTriangle, Clock, User, FileText, Image, ArrowLeft, 
  Download, Share2, Activity, Shield, CheckCircle, Heart,
  Stethoscope, Pill, MapPin, Phone, FileDown, Plus, 
  Brain, TrendingUp, Calendar, ChevronRight, Info, 
  AlertCircle, Zap, Crosshair
} from 'lucide-react'
import { Card, Button, RiskBadge } from '../components/common'
import toast from 'react-hot-toast'

function formatDate(dateValue) {
  if (!dateValue) return 'N/A'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

const specialistMapping = {
  chest_pain: 'Cardiologist',
  stroke: 'Neurologist',
  breathing_difficulty: 'Pulmonologist',
  seizure: 'Neurologist',
  severe_bleeding: 'Emergency Medicine',
  head_injury: 'Neurologist',
  high_fever: 'General Physician',
  poisoning: 'Emergency Medicine',
  severe_allergic: 'Allergist/Immunologist',
  severe_pain: 'Pain Specialist',
  diabetic_emergency: 'Endocrinologist',
  allergic_reaction: 'Allergist',
  dehydration: 'General Physician',
  broken_bone: 'Orthopedic Specialist',
  default: 'General Physician'
}

const nextStepsGuidance = {
  critical: {
    title: 'Immediate Action Required',
    icon: AlertCircle,
    color: 'red',
    actions: [
      'Call emergency services (112) immediately',
      'Do not delay seeking medical attention',
      'If possible, have someone accompany you',
      'Bring this report to the hospital'
    ]
  },
  high: {
    title: 'Urgent Medical Consultation',
    icon: Zap,
    color: 'orange',
    actions: [
      'Visit an emergency room within 2-4 hours',
      'Do not ignore these symptoms',
      'Prepare your medical history for the doctor',
      'Consider calling ahead to the hospital'
    ]
  },
  moderate: {
    title: 'Schedule Medical Appointment',
    icon: Clock,
    color: 'yellow',
    actions: [
      'Book an appointment within 24-48 hours',
      'Note any worsening symptoms to report',
      'Keep this analysis report handy',
      'Consider teleconsultation if symptoms worsen'
    ]
  },
  low: {
    title: 'Monitor & Self-Care',
    icon: Activity,
    color: 'green',
    actions: [
      'Rest and monitor symptoms for 2-3 days',
      'Maintain hydration and proper nutrition',
      'Note any changes in condition',
      'Seek medical help if symptoms persist'
    ]
  }
}

const getRiskExplanation = (riskLevel, symptomsText) => {
  const symptoms = (symptomsText || '').toLowerCase()
  
  if (symptoms.includes('chest') && riskLevel === 'critical') {
    return 'Chest pain is a high-risk symptom that may indicate cardiac emergency. Immediate evaluation required.'
  }
  if (symptoms.includes('chest') || symptoms.includes('heart')) {
    return 'Cardiac-related symptoms detected. Heart health evaluation recommended.'
  }
  if (symptoms.includes('fever') && symptoms.includes('cough')) {
    return 'Respiratory infection symptoms detected. Monitor and seek care if worsened.'
  }
  if (symptoms.includes('breathing') || symptoms.includes('shortness of breath')) {
    return 'Breathing difficulty detected. Urgent evaluation recommended.'
  }
  
  const explanations = {
    critical: 'High-risk symptoms detected. Immediate medical attention required.',
    high: 'Concerning symptoms detected. Prompt medical evaluation advised.',
    moderate: 'Symptoms detected. Medical consultation within 24-48 hours recommended.',
    low: 'Minor symptoms detected. Rest and monitoring advised.'
  }
  return explanations[riskLevel] || explanations.moderate
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
      if (response.status === 'success' && response.data) {
        setAnalysis(response.data)
      } else {
        throw new Error('Invalid response')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load analysis')
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
      toast.success('PDF downloaded successfully!')
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
          text: `Risk: ${analysis.combinedRiskLevel} - AI-powered health analysis`,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalysis}>Try Again</Button>
          <Link to="/dashboard" className="block mt-4 text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center">
          <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Analysis not found</p>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    )
  }

  const { triageResult, aiAnalysis, combinedRiskLevel, files, analyzedAt, createdAt, symptoms, user, userContext } = analysis
  const triage = triageResult
  const ai = aiAnalysis
  const displayDate = formatDate(analyzedAt || createdAt)
  const riskLevel = combinedRiskLevel || 'moderate'
  const recommendedSpecialist = ai?.recommended_specialist || (triage?.flags?.[0]?.type 
    ? specialistMapping[triage.flags[0].type] || specialistMapping.default 
    : specialistMapping.default)
  
  const symptomsArray = (symptoms?.length > 0)
    ? symptoms.split(/[.,;]/).filter(s => s.trim().length > 0).map(s => s.trim())
    : ['No symptoms specified']

  const confidencePercent = ai?.confidence !== undefined ? Math.round(ai.confidence * 100) : 75
  const confidenceLevel = confidencePercent >= 80 ? 'High' : confidencePercent >= 50 ? 'Moderate' : 'Low'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/history" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Health Analysis Report</h1>
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
              Download PDF
            </Button>
          </div>
        </div>

        {/* Emergency Alert */}
        {riskLevel === 'critical' && (
          <div className="bg-red-600 text-white rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-lg shadow-red-200">
            <div className="bg-red-500 p-3 rounded-xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">Critical Risk Level Detected</h2>
              <p className="text-red-100">Please seek immediate medical attention. Do not delay.</p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-red-600 hover:bg-red-50"
              onClick={() => window.open('https://www.google.com/maps/search/hospital+near+me', '_blank')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Find Hospital
            </Button>
          </div>
        )}

        {/* Image Analysis Warning */}
        {analysis.imageAnalysisFailed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Image Could Not Be Analyzed</p>
              <p className="text-sm text-amber-700 mt-1">
                The uploaded image could not be processed by the AI model. Analysis was performed based on text symptoms only. 
                For a complete analysis, please consult a healthcare professional.
              </p>
            </div>
          </div>
        )}

        {/* Prescription Image-Based Warning */}
        {analysis.prescriptionImageBased && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Document Uploaded (Scanned/Image PDF)</p>
              <p className="text-sm text-blue-700 mt-1">
                Your prescription document appears to be a scanned PDF or image. Text could not be extracted for analysis. 
                The doctor reviewing this report may need to examine the original document.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Analysis */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Prediction Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">AI Prediction</h2>
                  <p className="text-xs text-blue-600">Powered by Gemini AI</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Possible Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {(ai?.conditions?.length > 0 ? ai.conditions : ['General Illness', 'Viral Infection', 'Common Cold']).map((condition, i) => (
                    <span key={i} className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confidence Score */}
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                  <span className={`text-lg font-bold ${
                    confidencePercent >= 80 ? 'text-green-600' :
                    confidencePercent >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {confidencePercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      confidencePercent >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      confidencePercent >= 50 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                    }`}
                    style={{ width: `${Math.max(confidencePercent, 10)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{confidenceLevel} confidence in this analysis</p>
              </div>
            </Card>

            {/* Risk Assessment Card */}
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    riskLevel === 'critical' ? 'bg-red-100' :
                    riskLevel === 'high' ? 'bg-orange-100' :
                    riskLevel === 'moderate' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <Shield className={`h-7 w-7 ${
                      riskLevel === 'critical' ? 'text-red-600' :
                      riskLevel === 'high' ? 'text-orange-600' :
                      riskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-gray-900">Risk Assessment</h2>
                      <RiskBadge level={riskLevel} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{getRiskExplanation(riskLevel, symptoms)}</p>
                  </div>
                </div>
              </div>
              
              {/* Symptoms as Tags */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Detected Symptoms</h3>
                <div className="flex flex-wrap gap-2">
                  {symptomsArray.map((symptom, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Clinical Reasoning Card */}
            {(ai?.clinical_reasoning || ai?.summary || ai?.risk_explanation) && (
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Clinical Analysis</h2>
                    <p className="text-xs text-purple-600">Comprehensive assessment based on all inputs</p>
                  </div>
                </div>
                
                {ai?.risk_explanation && (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Assessment</h3>
                    <p className="text-gray-700 leading-relaxed">{ai.risk_explanation}</p>
                  </div>
                )}
                
                {ai?.clinical_reasoning && (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Clinical Reasoning</h3>
                    <p className="text-gray-700 leading-relaxed">{ai.clinical_reasoning}</p>
                  </div>
                )}
                
                {ai?.summary && (
                  <div className="bg-white rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{ai.summary}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Suggested Tests Card */}
            {ai?.suggested_tests && ai.suggested_tests.length > 0 && (
              <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Suggested Diagnostic Tests</h2>
                    <p className="text-xs text-cyan-600">Recommended tests based on assessment</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {ai.suggested_tests.map((test, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center text-xs font-bold text-cyan-600">
                        {i + 1}
                      </div>
                      <span className="text-gray-700">{test}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Red Flags */}
            {ai?.red_flags?.length > 0 && (
              <Card className="bg-red-50 border border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-red-900">Red Flags</h2>
                    <p className="text-xs text-red-600">{ai.red_flags.length} warning signs detected</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {ai.red_flags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-100">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-red-800 font-medium">{flag}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Next Steps Card */}
            <Card className={`border-l-4 ${
              riskLevel === 'critical' ? 'border-l-red-500' :
              riskLevel === 'high' ? 'border-l-orange-500' :
              riskLevel === 'moderate' ? 'border-l-yellow-500' : 'border-l-green-500'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  riskLevel === 'critical' ? 'bg-red-100' :
                  riskLevel === 'high' ? 'bg-orange-100' :
                  riskLevel === 'moderate' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <AlertCircle className={`h-6 w-6 ${
                    riskLevel === 'critical' ? 'text-red-600' :
                    riskLevel === 'high' ? 'text-orange-600' :
                    riskLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{nextStepsGuidance[riskLevel]?.title || 'Next Steps'}</h2>
                  <p className="text-xs text-gray-500">What to do next</p>
                </div>
              </div>
              <div className="space-y-2">
                {(nextStepsGuidance[riskLevel]?.actions || nextStepsGuidance.moderate.actions).map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Patient Info */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                Patient Information
              </h3>
              <div className="space-y-3 text-sm">
                {user?.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                )}
                {userContext?.age && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age</span>
                    <span className="font-medium text-gray-900">{userContext.age}</span>
                  </div>
                )}
                {userContext?.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-medium text-gray-900 capitalize">{userContext.gender}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Analysis Date</span>
                  <span className="font-medium text-gray-900">{displayDate}</span>
                </div>
              </div>
            </Card>

            {/* Recommended Specialist */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-purple-500" />
                Recommended Specialist
              </h3>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Stethoscope className="h-8 w-8 text-purple-600" />
                </div>
                <p className="font-bold text-gray-900 text-lg">{recommendedSpecialist}</p>
                <p className="text-sm text-gray-500 mt-1">Based on your symptoms</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => window.open(`https://www.google.com/search?q=${recommendedSpecialist}+near+me`, '_blank')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Find {recommendedSpecialist}
              </Button>
            </Card>

            {/* Find Doctor CTA */}
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-xl mb-2">Find a Doctor</h3>
                <p className="text-blue-100 text-sm mb-4">Locate healthcare professionals near you</p>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => window.open('https://www.google.com/maps/search/hospital+near+me', '_blank')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Search Nearby
                </Button>
              </div>
            </Card>

            {/* Uploaded Files */}
            {files?.length > 0 && (
              <Card>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.originalName || file.fileName}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/analyze" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    New Analysis
                  </Button>
                </Link>
                <Link to="/history" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </Link>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
