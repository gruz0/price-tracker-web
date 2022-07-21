import React, { useEffect, useContext } from 'react'
import ErrorWrapper from '../../components/ErrorWrapper'
import JustOneSecond from '../../components/JustOneSecond'
import DisplayContext from '../../context/display-context'
import { useAuth } from '../../hooks/index'
import { LandingLayout } from '../../layouts/Landing'
import { UsersLayout } from '../../layouts/Users'
import { HelpScreen } from '../../screens/users/help/index'

const Page = () => {
  const { isLoading: userLoading, isAuthenticated, user } = useAuth()
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
      <LandingLayout>
        <ErrorWrapper header="Пожалуйста, войдите в систему" />
      </LandingLayout>
    )
  }

  return (
    <UsersLayout meta={{ title: 'Помощь' }}>
      <HelpScreen user={user} isSmallScreen={isSmallScreen} />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
