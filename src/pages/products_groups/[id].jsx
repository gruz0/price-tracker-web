import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import ErrorWrapper from '../../components/ErrorWrapper'
import JustOneSecond from '../../components/JustOneSecond'
import DisplayContext from '../../context/display-context'
import { useAuth } from '../../hooks'
import useProductsGroup from '../../hooks/useProductsGroup'
import { LandingLayout } from '../../layouts/Landing'
import { UsersLayout } from '../../layouts/Users'
import { ProductsGroupScreen } from '../../screens/users/products_groups/show'

const Page = () => {
  const router = useRouter()
  const { isLoading: userLoading, isAuthenticated, token } = useAuth()
  const {
    data: productsGroupResponse,
    isLoading: productsGroupLoading,
    error: productsGroupError,
  } = useProductsGroup(router.query.id, token)
  const { isSmallScreen, setSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    setSmallScreen(window.matchMedia('(max-width: 700px)').matches)
  }, [])

  if (userLoading) {
    return (
      <LandingLayout>
        <JustOneSecond title="Загружаем пользователя..." />
      </LandingLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <LandingLayout>
        <ErrorWrapper header="Пожалуйста, войдите в систему" />
      </LandingLayout>
    )
  }

  if (productsGroupLoading) {
    return (
      <UsersLayout>
        <JustOneSecond title="Загружаем группу товаров..." />
      </UsersLayout>
    )
  }

  if (productsGroupError) {
    return (
      <UsersLayout>
        <ErrorWrapper
          header="Не удалось загрузить группу товаров"
          error={productsGroupError}
        />
      </UsersLayout>
    )
  }

  const {
    products_group: productsGroup,
    products_group_items: productsGroupItems,
    user_products: userProducts,
  } = productsGroupResponse

  return (
    <UsersLayout meta={{ title: 'Карточка группы товаров' }}>
      <ProductsGroupScreen
        productsGroup={productsGroup}
        productsGroupItems={productsGroupItems}
        userProducts={userProducts}
        isSmallScreen={isSmallScreen}
      />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
