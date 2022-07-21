import React from 'react'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import { ProductsGroupCard } from '../../../../components/ProductsGroupCard'
import ErrorWrapper from '../../../../components/ErrorWrapper'

export const ProductsGroupScreen = ({
  productsGroup,
  productsGroupItems,
  userProducts,
  isSmallScreen,
}) => {
  const { isLoading: userLoading, isAuthenticated } = useAuth()

  if (userLoading) {
    return <JustOneSecond title="Загружаем пользователя..." />
  }

  if (!isAuthenticated) {
    return <ErrorWrapper header="Пожалуйста, войдите в систему" />
  }

  return (
    <ProductsGroupCard
      productsGroup={productsGroup}
      productsGroupItems={productsGroupItems}
      userProducts={userProducts}
      isSmallScreen={isSmallScreen}
    />
  )
}
