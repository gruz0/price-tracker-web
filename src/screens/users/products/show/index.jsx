import React from 'react'
import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { ProductCard } from '../../../../components/ProductCard'
import { useAuth } from '../../../../hooks'
import useMyProductSubscriptions from '../../../../hooks/useMyProductSubscriptions'
import useProductHistory from '../../../../hooks/useProductHistory'

export const ProductScreen = ({ product, shops, groups, isSmallScreen }) => {
  const { isLoading: userLoading, isAuthenticated, user, token } = useAuth()
  const {
    data: productHistoryResponse,
    isLoading: productHistoryLoading,
    error: productHistoryError,
  } = useProductHistory(product.id, token)
  const {
    data: productSubscriptionsResponse,
    isLoading: productSubscriptionsLoading,
    error: productSubscriptionsError,
  } = useMyProductSubscriptions(product.id, token)

  if (userLoading) {
    return <JustOneSecond title="Загружаем пользователя..." />
  }

  if (!isAuthenticated) {
    return <ErrorWrapper header="Пожалуйста, войдите в систему" />
  }

  if (productHistoryLoading) {
    return <JustOneSecond title="Загружаем историю товара..." />
  }

  if (productHistoryError) {
    return (
      <ErrorWrapper
        header="Не удалось загрузить историю товара"
        error={productHistoryError}
      />
    )
  }

  if (productSubscriptionsLoading) {
    return <JustOneSecond title="Загружаем подписки на товар..." />
  }

  if (productSubscriptionsError) {
    return (
      <ErrorWrapper
        header="Не удалось загрузить подписки на товар"
        error={productSubscriptionsError}
      />
    )
  }

  return (
    <ProductCard
      user={user}
      token={token}
      product={product}
      shops={shops}
      groups={groups}
      productHistory={productHistoryResponse}
      productSubscriptions={productSubscriptionsResponse}
      isSmallScreen={isSmallScreen}
    />
  )
}
