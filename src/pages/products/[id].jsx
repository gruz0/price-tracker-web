import React from 'react'

import Layout from '../../components/Layout'
import ErrorWrapper from '../../components/ErrorWrapper'
import JustOneSecond from '../../components/JustOneSecond'
import { useAuth } from '../../hooks'
import useProduct from '../../hooks/useProduct'
import { useRouter } from 'next/router'
import ProductCard from '../../components/ProductCard'

const ProductPage = () => {
  const router = useRouter()
  const { user, token, logout } = useAuth()
  const { data, isLoading, error } = useProduct(router.query.id, token)

  // FIXME: Генерирует ошибку в консоли браузера:
  // Warning: Functions are not valid as a React child. This may happen if you return a Component
  // instead of <Component /> from render. Or maybe you meant to call this function rather than return it
  if (!user) {
    return logout
  }

  return (
    <>
      {error ? (
        <ErrorWrapper header="Не удалось загрузить товар" error={error} />
      ) : (
        <>
          {isLoading && <JustOneSecond />}
          {data && <ProductCard product={data.product} />}
        </>
      )}
    </>
  )
}

ProductPage.requiresAuth = true
ProductPage.redirectUnauthenticatedTo = '/sign_in'

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
