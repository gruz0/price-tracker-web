import React from 'react'
import UsersLayout from '../../layouts/Users'
import ProductsScreen from '../../screens/users/products/index'

const Page = () => {
  return (
    <UsersLayout
      meta={{
        title: 'Товары | Трекер цен',
        description: 'Покупайте вовремя!',
      }}
    >
      <ProductsScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
