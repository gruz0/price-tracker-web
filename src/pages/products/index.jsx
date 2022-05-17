import React from 'react'

import { Divider, Header, Message } from 'semantic-ui-react'

import Layout from '../../components/Layout'
import Products from '../../components/Products'
import ErrorWrapper from '../../components/ErrorWrapper'
import JustOneSecond from '../../components/JustOneSecond'
import { useAuth } from '../../hooks'
import AddNewProductForm from '../../components/AddNewProductForm'
import useProducts from '../../hooks/useProducts'

const ProductsPage = () => {
  const { user, token, logout } = useAuth()
  const { data, isLoading, error } = useProducts(token)

  // FIXME: Генерирует ошибку в консоли браузера:
  // Warning: Functions are not valid as a React child. This may happen if you return a Component
  // instead of <Component /> from render. Or maybe you meant to call this function rather than return it
  if (!user) {
    return logout
  }

  return (
    <>
      <Header as="h1">Товары</Header>

      {error ? (
        <ErrorWrapper header="Не удалось загрузить товары" error={error} />
      ) : (
        <>
          {isLoading ? (
            <JustOneSecond />
          ) : (
            <>
              <AddNewProductForm token={token} />

              <Divider hidden />

              {data?.products && data.products.length > 0 ? (
                <Products products={data.products} />
              ) : (
                <Message info>
                  <Message.Header>
                    В данный момент у вас нет добавленных товаров для
                    отображения
                  </Message.Header>
                  <p>
                    Воспользуйтесь формой выше для добавления первого товара для
                    отслеживания цены.
                  </p>
                </Message>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}

ProductsPage.requiresAuth = true
ProductsPage.redirectUnauthenticatedTo = '/sign_in'

ProductsPage.getLayout = (page) => (
  <Layout
    meta={{
      title: 'Товары | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </Layout>
)

export default ProductsPage
