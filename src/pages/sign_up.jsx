import React, { useEffect, useContext } from 'react'
import LandingLayout from '../layouts/Landing'
import SignUpScreen from '../screens/auth/sign-up'
import DisplayContext from '../context/display-context'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <LandingLayout
      meta={{
        title: 'Регистрация в системе | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <SignUpScreen />
    </LandingLayout>
  )
}

export default Page
