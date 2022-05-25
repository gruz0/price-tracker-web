import React from 'react'
import LandingLayout from '../layouts/Landing'
import UsersLayout from '../layouts/Users'
import { useAuth } from '../hooks'

import LandingScreen from '../screens/landing'
import DashboardScreen from '../screens/users/dashboard'

const Page = () => {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return (
      <LandingLayout
        meta={{
          title: 'Трекер цен',
          description: 'Покупайте вовремя!',
        }}
      >
        <LandingScreen />
      </LandingLayout>
    )
  }

  return (
    <UsersLayout
      meta={{
        title: 'Дашборд',
        description: 'Покупайте вовремя!',
      }}
    >
      <DashboardScreen />
    </UsersLayout>
  )
}

export default Page
