import React, { useEffect, useContext } from 'react'
import DisplayContext from '../../context/display-context'
import UsersLayout from '../../layouts/Users'
import HelpScreen from '../../screens/users/help/index'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <UsersLayout
      meta={{
        title: 'Помощь | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <HelpScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
