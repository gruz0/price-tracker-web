import React, { useEffect, useContext } from 'react'
import DisplayContext from '../../context/display-context'
import UsersLayout from '../../layouts/Users'
import ProductScreen from '../../screens/users/products/show'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <UsersLayout
      meta={{
        title: 'Карточка товара | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <ProductScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
