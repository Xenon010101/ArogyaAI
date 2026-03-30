import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { analyzeApi } from '../api/analyzeApi'
import { downloadAnalysisPDF } from '../utils/pdfGenerator'
import { Clock, Filter, Search, FileText, ChevronLeft, ChevronRight, Download, Plus, Activity, X } from 'lucide-react'
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'N/A'
  }
}

export default function History() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
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
      if (response.status === 'success' && response.data) {
        setAnalyses(response.data.analyses || [])
        if (response.data.pagination) {
          setPagination({
            currentPage: response.data.pagination.currentPage || 1,
            totalPages: response.data.pagination.totalPages || 1,
            total: response.data.pagination.total || 0,
          })
        }
      } else {
        throw new Error('Invalid response')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load analyses')
    } finally {
      setLoading(false)
    }
  }, [pagination.currentPage, filters.riskLevel])

  useEffect(() => { fetchAnalyses() }, [fetchAnalyses])

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

  const handleDownload = async (e, analysis) => {
    e.preventDefault()
    e.stopPropagation()
    setDownloadingId(analysis._id)
    try {
      downloadAnalysisPDF({
        ...analysis,
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            Analysis History
          </h1>
          <p className="mt-2 text-gray-600">View and manage your past health analyses</p>
        </div>
        <Link to="/analyze">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            New Analysis
          </Button>
        </Link>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search symptoms..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <select
              name="riskLevel"
              value={filters.riskLevel}
              onChange={handleFilterChange}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white font-medium"
            >
              <option value="">All Risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
            {(filters.riskLevel || filters.search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalyses}>Try Again</Button>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.riskLevel || filters.search ? 'No matching analyses' : 'No analyses yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {filters.riskLevel || filters.search
                ? "Try adjusting your filters to find what you're looking for"
                : "Start by creating your first analysis to see your history here"
              }
            </p>
            {filters.riskLevel || filters.search ? (
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            ) : (
              <Link to="/analyze">
                <Button>Create Your First Analysis</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {pagination.total} total analyses
            </div>
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <Link
                  key={analysis._id}
                  to={`/result/${analysis._id}`}
                  className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {analysis.symptoms}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(analysis.createdAt)}
                        </span>
                        {analysis.files?.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            {analysis.files.length} file{analysis.files.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <RiskBadge level={analysis.combinedRiskLevel} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDownload(e, analysis)}
                      disabled={downloadingId === analysis._id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            pagination.currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
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
