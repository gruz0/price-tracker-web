import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import JustOneSecond from '../../components/JustOneSecond'
import DisplayContext from '../../context/display-context'
import { useAuth } from '../../hooks'
import useProduct from '../../hooks/useProduct'
import { UsersLayout } from '../../layouts/Users'
import { ProductScreen } from '../../screens/users/products/show'
import ErrorWrapper from '../../components/ErrorWrapper'
import { LandingLayout } from '../../layouts/Landing'

const Page = () => {
  const router = useRouter()
  const { isLoading: userLoading, isAuthenticated, token } = useAuth()
  const { isSmallScreen, setSmallScreen } = useContext(DisplayContext)
  const {
    data: productResponse,
    isLoading: productLoading,
    error: productError,
  } = useProduct(router.query.id, token)

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

  if (productLoading) {
    return (
      <UsersLayout>
        <JustOneSecond title="Загружаем товар..." />
      </UsersLayout>
    )
  }

  if (productError) {
    return (
      <UsersLayout>
        <ErrorWrapper
          header="Не удалось загрузить товар"
          error={productError}
        />
      </UsersLayout>
    )
  }

  const { product, groups, shops } = productResponse

  return (
    <UsersLayout meta={{ title: product.title }}>
      <ProductScreen
        product={product}
        groups={groups}
        shops={shops}
        isSmallScreen={isSmallScreen}
      />
    </UsersLayout>
  )
}

Page.requiresAuth = true

export default Page
