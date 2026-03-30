import api from './axios'

export const analyzeApi = {
  analyze: async (formData) => {
    const response = await api.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    return response.data
  },

  preCheck: async (symptoms) => {
    const response = await api.post('/analyze/pre-check', { symptoms }, { timeout: 30000 })
    return response.data
  },

  getAnalysis: async (id) => {
    const response = await api.get(`/analyze/${id}`, { timeout: 10000 })
    return response.data
  },

  getMyAnalyses: async (params = {}) => {
    const response = await api.get('/analyze/my-analyses', { 
      params,
      timeout: 10000 
    })
    return response.data
  },
}

export const reportApi = {
  getReports: async (params = {}) => {
    const response = await api.get('/reports', { params, timeout: 10000 })
    return response.data
  },
}
