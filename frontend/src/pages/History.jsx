import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { Clock, Filter, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, Button, LoadingSpinner, RiskBadge, ErrorState, EmptyState } from '../components/common'
import toast from 'react-hot-toast'

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  })
  const [filters, setFilters] = useState({
    riskLevel: '',
    search: '',
  })

  const fetchAnalyses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: pagination.currentPage,
        limit: 10,
      }
      if (filters.riskLevel) {
        params.riskLevel = filters.riskLevel
      }

      const response = await analyzeApi.getMyAnalyses(params)
      setAnalyses(response.data.analyses)
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analyses')
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, filters.riskLevel])

  useEffect(() => {
    fetchAnalyses()
  }, [fetchAnalyses])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters({ ...filters, [name]: value })
    setPagination((p) => ({ ...p, currentPage: 1 }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (filters.search.trim()) {
      const filtered = analyses.filter((a) =>
        a.symptoms.toLowerCase().includes(filters.search.toLowerCase())
      )
      setAnalyses(filtered)
    } else {
      fetchAnalyses()
    }
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((p) => ({ ...p, currentPage: page }))
    }
  }

  const clearFilters = () => {
    setFilters({ riskLevel: '', search: '' })
    setPagination((p) => ({ ...p, currentPage: 1 }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
        <Link to="/analyze">
          <Button>
            <FileText className="h-5 w-5 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search symptoms..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              name="riskLevel"
              value={filters.riskLevel}
              onChange={handleFilterChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All Risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
            {(filters.riskLevel || filters.search) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAnalyses} />
        ) : analyses.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No analyses found"
            description={filters.riskLevel || filters.search ? "Try adjusting your filters" : "Start by creating your first analysis"}
            action={
              filters.riskLevel || filters.search ? (
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              ) : (
                <Link to="/analyze">
                  <Button variant="outline">Start Your First Analysis</Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Link
                  key={analysis._id}
                  to={`/result/${analysis._id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 line-clamp-2">{analysis.symptoms}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {analysis.files?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {analysis.files.length} file(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <RiskBadge level={analysis.combinedRiskLevel} />
                  </div>
                </Link>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.currentPage - 1) * 10 + 1} to{' '}
                  {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
