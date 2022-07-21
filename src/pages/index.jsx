import React, { useEffect, useContext } from 'react'
import { LandingLayout } from '../layouts/Landing'
import { UsersLayout } from '../layouts/Users'
import { useAuth } from '../hooks'
import { LandingScreen } from '../screens/landing'
import { DashboardScreen } from '../screens/users/dashboard'
import DisplayContext from '../context/display-context'
import JustOneSecond from '../components/JustOneSecond'

const Page = () => {
  const { isAuthenticated, isLoading: userLoading } = useAuth()
  const { isSmallScreen, setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  if (userLoading) {
    return (
      <LandingLayout>
        <JustOneSecond title="Загружаем пользователя..." />
      </LandingLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <LandingLayout meta={{ title: 'Трекер цен' }}>
        <LandingScreen isSmallScreen={isSmallScreen} />
      </LandingLayout>
    )
  }

  return (
    <UsersLayout meta={{ title: 'Дашборд' }}>
      <DashboardScreen isSmallScreen={isSmallScreen} />
    </UsersLayout>
  )
}

export default Page
