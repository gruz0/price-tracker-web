import React from 'react'
import LandingLayout from '../layouts/Landing'
import SignInScreen from '../screens/auth/sign-in'

const Page = () => (
  <LandingLayout
    meta={{
      title: 'Вход в систему | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    <SignInScreen />
  </LandingLayout>
)

export default Page
