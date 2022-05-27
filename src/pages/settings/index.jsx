import React, { useEffect, useContext } from 'react'
import DisplayContext from '../../context/display-context'
import UsersLayout from '../../layouts/Users'
import SettingsScreen from '../../screens/users/settings'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <UsersLayout
      meta={{
        title: 'Настройки | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <SettingsScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
