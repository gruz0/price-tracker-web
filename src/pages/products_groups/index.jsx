import React, { useEffect, useContext } from 'react'
import DisplayContext from '../../context/display-context'
import UsersLayout from '../../layouts/Users'
import ProductsGroupsScreen from '../../screens/users/products_groups/index'

const Page = () => {
  const { setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  return (
    <UsersLayout
      meta={{
        title: 'Группы товаров | Chartik',
        description: 'Покупайте вовремя!',
      }}
    >
      <ProductsGroupsScreen />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
