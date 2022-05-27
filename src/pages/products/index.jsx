import React, { useEffect, useContext } from 'react'
import DisplayContext from '../../context/display-context'
import UsersLayout from '../../layouts/Users'
import ProductsScreen from '../../screens/users/products/index'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <UsersLayout
      meta={{
        title: 'Товары | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <ProductsScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
