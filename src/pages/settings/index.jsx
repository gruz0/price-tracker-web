import React from 'react'
import UsersLayout from '../../layouts/Users'
import SettingsScreen from '../../screens/users/settings'

const Page = () => (
  <UsersLayout
    meta={{
      title: 'Настройки | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    <SettingsScreen />
  </UsersLayout>
)

Page.requiresAuth = true

export default Page
