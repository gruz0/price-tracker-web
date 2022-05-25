import React, { useEffect } from 'react'
import { useRouter } from 'next/router'

import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import useProduct from '../../../../hooks/useProduct'
import ProductCard from '../../../../components/ProductCard'

const ProductPage = () => {
  const router = useRouter()
  const { token, logout } = useAuth()
  const { data, isLoading, error } = useProduct(router.query.id, token)

  useEffect(() => {
    if (error && error?.info?.status === 'forbidden') {
      return logout()
    }
  }, [error])

  return (
    <>
      {error ? (
        <ErrorWrapper header="Не удалось загрузить товар" error={error} />
      ) : (
        <>
          {isLoading ? (
            <JustOneSecond />
          ) : (
            <ProductCard product={data.product} />
          )}
        </>
      )}
    </>
  )
}

export default ProductPage
