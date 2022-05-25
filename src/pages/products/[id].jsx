import React from 'react'
import UsersLayout from '../../layouts/Users'
import ProductScreen from '../../screens/users/products/show'

const Page = () => (
  <UsersLayout
    meta={{
      title: 'Карточка товара | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    <ProductScreen />
  </UsersLayout>
)

Page.requiresAuth = true

export default Page
