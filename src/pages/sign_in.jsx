import React, { useEffect, useContext } from 'react'
import LandingLayout from '../layouts/Landing'
import SignInScreen from '../screens/auth/sign-in'
import DisplayContext from '../context/display-context'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <LandingLayout
      meta={{
        title: 'Вход в систему | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <SignInScreen />
    </LandingLayout>
  )
}

export default Page
