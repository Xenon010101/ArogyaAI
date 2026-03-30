import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from './AuthContext'
import { authApi } from '../api/authApi'

export function useAuth() {
  const context = useAuthContext()
  return context
}

export function useApi(apiCall, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiCall])

  const retry = useCallback(() => {
    if (retryCount < (options.maxRetries || 3)) {
      setRetryCount((c) => c + 1)
      execute(...(options.lastArgs || []))
    }
  }, [retryCount, options.maxRetries, options.lastArgs, execute])

  useEffect(() => {
    if (options.immediate !== false) {
      execute()
    }
  }, [])

  return { data, loading, error, execute, retry, retryCount }
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
