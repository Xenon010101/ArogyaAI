import api from './axios'

export const authApi = {
  register: async (data) => {
    const response = await api.post('/auth/register', data)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
    }
    return response.data
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
    }
    return response.data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updatePassword: async (data) => {
    const response = await api.patch('/auth/update-password', data)
    return response.data
  },
}
