import React, { useEffect, useContext } from 'react'
import DisplayContext from '../../context/display-context'
import UsersLayout from '../../layouts/Users'
import ProductsGroupScreen from '../../screens/users/products_groups/show'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <UsersLayout
      meta={{
        title: 'Карточка группы товаров | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <ProductsGroupScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
