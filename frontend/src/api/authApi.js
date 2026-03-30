import api from './axios'

export const authApi = {
  register: async (data) => {
    const response = await api.post('/auth/register', data)
    const { token, data: userData } = response.data
    if (token) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData.user))
    }
    return response.data
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data)
    const { token, data: userData } = response.data
    if (token) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData.user))
    }
    return response.data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.warn('Logout API failed, clearing local storage')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}
