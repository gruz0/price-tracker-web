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
  const { token } = useAuth()

  const { data, isLoading, error } = useProduct(router.query.id, token)

  return (
    <>
      {error && (
        <ErrorWrapper header="Не удалось загрузить товар" error={error} />
      )}

      {isLoading && <JustOneSecond />}

      {data && <ProductCard product={data.product} history={data.history} />}
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
