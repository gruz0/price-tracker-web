import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Cookies from 'js-cookie'

export const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isAuthenticated = !!user

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    setIsLoading(false)
    router.push('/sign_in')
  }

  const authenticate = async (token) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        mode: 'cors',
      })

      const json = await response.json()

      if (response.ok) {
        setUser(json.user)
        Cookies.set('token', token)
        setIsLoading(false)
      } else {
        logout()
      }
    } catch (err) {
      console.error({ err })
      logout()
    }
  }

  const signIn = async (login, password) => {
    return await fetch('/api/v1/sign_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ login, password }),
    })
  }

  const signUp = async (login, password) => {
    return await fetch('/api/v1/sign_up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ login, password }),
    })
  }

  useEffect(() => {
    const token = Cookies.get('token')

    if (!token) return

    authenticate(token)
  }, [])

  useEffect(() => {
    const Component = children.type

    // If it doesn't require auth, everything's good.
    if (!Component.requiresAuth) return

    // If we're already authenticated, everything's good.
    if (isAuthenticated) return

    // If we don't have a token in the cookies, logout
    const token = Cookies.get('token')
    if (!token) {
      return logout()
    }

    // If we're not loading give the try to authenticate with the given token.
    if (!isLoading) {
      authenticate(token)
    }
  }, [isLoading, isAuthenticated, children.type.requiresAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticate,
        signIn,
        signUp,
        logout,
        isLoading,
        isAuthenticated: !!user,
        token: Cookies.get('token'),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
