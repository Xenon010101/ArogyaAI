import api from './axios'

export const analyzeApi = {
  analyze: async (formData) => {
    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  preCheck: async (symptoms) => {
    const response = await api.post('/analyze/pre-check', { symptoms })
    return response.data
  },

  getAnalysis: async (id) => {
    const response = await api.get(`/analyze/${id}`)
    return response.data
  },

  getMyAnalyses: async (params = {}) => {
    const response = await api.get('/analyze/my-analyses', { params })
    return response.data
  },
}

export const reportApi = {
  getReports: async (params = {}) => {
    const response = await api.get('/reports', { params })
    return response.data
  },

  getReport: async (id) => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  createReport: async (data) => {
    const response = await api.post('/reports', data)
    return response.data
  },
}
