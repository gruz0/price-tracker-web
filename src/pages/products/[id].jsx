import React, { useEffect } from 'react'

import Layout from '../../components/Layout'
import ErrorWrapper from '../../components/ErrorWrapper'
import JustOneSecond from '../../components/JustOneSecond'
import { useAuth } from '../../hooks'
import useProduct from '../../hooks/useProduct'
import { useRouter } from 'next/router'
import ProductCard from '../../components/ProductCard'

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

ProductPage.requiresAuth = true

ProductPage.getLayout = (page) => (
  <Layout
    meta={{
      title: 'Карточка товара | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </Layout>
)

export default ProductPage
