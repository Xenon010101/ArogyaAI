import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { analyzeApi } from '../api/analyzeApi'
import { downloadAnalysisPDF } from '../utils/pdfGenerator'
import { Activity, Plus, Clock, AlertTriangle, FileText, Download, TrendingUp, Heart, ArrowRight } from 'lucide-react'
import { Card, Button, LoadingSpinner, RiskBadge, EmptyState } from '../components/common'
import toast from 'react-hot-toast'

function formatDate(dateValue) {
  if (!dateValue) return 'N/A'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, moderate: 0, low: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [recentResponse, allResponse] = await Promise.all([
        analyzeApi.getMyAnalyses({ limit: 5 }),
        analyzeApi.getMyAnalyses({ limit: 100 }),
      ])

      setRecentAnalyses(recentResponse.data?.analyses || [])

      const analyses = allResponse.data?.analyses || []
      setStats({
        total: analyses.length,
        critical: analyses.filter((a) => a.combinedRiskLevel === 'critical').length,
        high: analyses.filter((a) => a.combinedRiskLevel === 'high').length,
        moderate: analyses.filter((a) => a.combinedRiskLevel === 'moderate').length,
        low: analyses.filter((a) => a.combinedRiskLevel === 'low').length,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const handleQuickDownload = async (e, analysis) => {
    e.preventDefault()
    e.stopPropagation()
    setDownloadingId(analysis._id)
    try {
      downloadAnalysisPDF({
        ...analysis,
        user: { name: user?.name },
        triage: { flags: [], recommendation: {} },
        ai: {},
        analyzedAt: analysis.createdAt,
      })
      toast.success('PDF downloaded!')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-800 font-medium mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-gray-600">Track your health insights and get AI-powered analysis</p>
        </div>
        <Link to="/analyze">
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600 font-medium">Total Analyses</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-sm text-gray-600 font-medium">Critical</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">{stats.high}</p>
              <p className="text-sm text-gray-600 font-medium">High Risk</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{stats.low}</p>
              <p className="text-sm text-gray-600 font-medium">Low Risk</p>
            </div>
          </div>
        </Card>
      </div>

      {stats.critical > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-900">Critical Results Alert</p>
            <p className="text-sm text-red-700 mt-1">
              You have {stats.critical} critical analysis result{stats.critical > 1 ? 's' : ''}. Please review and consult a healthcare professional.
            </p>
          </div>
          <Link to="/history?riskLevel=critical" className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1">
            View <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
              <p className="text-xs text-gray-500">Your latest health analyses</p>
            </div>
          </div>
          {recentAnalyses.length > 0 && (
            <Link to="/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Start by describing your symptoms to get AI-powered health insights
            </p>
            <Link to="/analyze">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Analysis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAnalyses.map((analysis) => (
              <Link
                key={analysis._id}
                to={`/result/${analysis._id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                      {analysis.symptoms.length > 60 ? analysis.symptoms.substring(0, 60) + '...' : analysis.symptoms}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(analysis.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RiskBadge level={analysis.combinedRiskLevel} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleQuickDownload(e, analysis)}
                    loading={downloadingId === analysis._id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
