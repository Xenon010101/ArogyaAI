import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const { user, loading, isAuthenticated, login, register, logout, updateUser } =
    useAuthContext()

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  }
}
