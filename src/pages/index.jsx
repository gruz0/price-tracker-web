import React, { useEffect, useContext } from 'react'
import LandingLayout from '../layouts/Landing'
import UsersLayout from '../layouts/Users'
import { useAuth } from '../hooks'

import LandingScreen from '../screens/landing'
import DashboardScreen from '../screens/users/dashboard'
import DisplayContext from '../context/display-context'

const Page = () => {
  const { user, isLoading } = useAuth()
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  if (isLoading || !user) {
    return (
      <LandingLayout
        meta={{
          title: 'Chartik | Трекер цен',
          description:
            'Узнавайте об изменении цен и наличии любимых товаров быстрее всех!',
        }}
      >
        <LandingScreen />
      </LandingLayout>
    )
  }

  return (
    <UsersLayout
      meta={{
        title: 'Дашборд | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <DashboardScreen />
    </UsersLayout>
  )
}

export default Page
