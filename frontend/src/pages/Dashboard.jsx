import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { analyzeApi } from '../api/analyzeApi'
import { Activity, Plus, Clock, AlertTriangle, TrendingUp, FileText } from 'lucide-react'
import { Card, Button, LoadingSpinner, RiskBadge, Alert } from '../components/common'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, moderate: 0, low: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await analyzeApi.getMyAnalyses({ limit: 5 })
      setRecentAnalyses(response.data.analyses)

      const allResponse = await analyzeApi.getMyAnalyses({ limit: 100 })
      const analyses = allResponse.data.analyses
      setStats({
        total: analyses.length,
        critical: analyses.filter((a) => a.combinedRiskLevel === 'critical').length,
        high: analyses.filter((a) => a.combinedRiskLevel === 'high').length,
        moderate: analyses.filter((a) => a.combinedRiskLevel === 'moderate').length,
        low: analyses.filter((a) => a.combinedRiskLevel === 'low').length,
      })
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="mt-1 text-gray-600">Your AI-powered health analysis dashboard</p>
        </div>
        <Link to="/analyze">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Analyses</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-sm text-gray-600">Critical</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
            <p className="text-sm text-gray-600">High Risk</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.low}</p>
            <p className="text-sm text-gray-600">Low Risk</p>
          </div>
        </Card>
      </div>

      {stats.critical > 0 && (
        <Alert variant="emergency">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">You have {stats.critical} critical analysis result(s)</p>
              <p className="text-sm mt-1">Please review your recent analyses and consult a healthcare professional.</p>
            </div>
          </div>
        </Alert>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Analyses</h2>
          <Link to="/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No analyses yet</p>
            <Link to="/analyze">
              <Button variant="outline">Start Your First Analysis</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnalyses.map((analysis) => (
              <Link
                key={analysis._id}
                to={`/result/${analysis._id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {analysis.symptoms.substring(0, 50)}
                      {analysis.symptoms.length > 50 ? '...' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <RiskBadge level={analysis.combinedRiskLevel} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
