import React, { useEffect, useContext } from 'react'
import { LandingLayout } from '../layouts/Landing'
import { SignInScreen } from '../screens/auth/sign-in'
import DisplayContext from '../context/display-context'

const Page = () => {
  const { isSmallScreen, setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <LandingLayout meta={{ title: 'Вход в систему' }}>
      <SignInScreen isSmallScreen={isSmallScreen} />
    </LandingLayout>
  )
}

export default Page
