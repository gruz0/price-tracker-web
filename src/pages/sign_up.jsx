import React from 'react'
import LandingLayout from '../layouts/Landing'
import SignUpScreen from '../screens/auth/sign-up'

const Page = () => (
  <LandingLayout
    meta={{
      title: 'Регистрация в системе | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    <SignUpScreen />
  </LandingLayout>
)

export default Page
