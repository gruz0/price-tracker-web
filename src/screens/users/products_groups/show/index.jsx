import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import useProductsGroup from '../../../../hooks/useProductsGroup'
import ProductsGroupCard from '../../../../components/ProductsGroupCard'
import DisplayContext from '../../../../context/display-context'

const Screen = () => {
  const router = useRouter()
  const { token, logout } = useAuth()
  const { data, isLoading, error } = useProductsGroup(router.query.id, token)
  const { isSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    if (error && error?.info?.status === 'forbidden') {
      return logout()
    }
  }, [error])

  if (error) {
    return (
      <ErrorWrapper
        header="Не удалось загрузить группу товаров"
        error={error}
      />
    )
  }

  if (isLoading) {
    return <JustOneSecond />
  }

  return (
    <ProductsGroupCard
      productsGroup={data.products_group}
      productsGroupItems={data.products_group_items}
      userProducts={data.user_products}
      isSmallScreen={isSmallScreen}
    />
  )
}

export default Screen
