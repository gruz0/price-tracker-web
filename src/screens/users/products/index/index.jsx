import React, { useEffect, useContext } from 'react'

import { Divider, Message } from 'semantic-ui-react'

import Products from '../../../../components/Products'
import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import AddNewProduct from '../../../../forms/AddNewProduct'
import useProducts from '../../../../hooks/useProducts'
import DisplayContext from '../../../../context/display-context'

const Screen = () => {
  const { token, logout } = useAuth()
  const { data, isLoading, error } = useProducts(token)
  const { isSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    if (error && error?.info?.status === 'forbidden') {
      return logout()
    }
  }, [error])

  return (
    <>
      {error ? (
        <ErrorWrapper header="Не удалось загрузить товары" error={error} />
      ) : (
        <>
          {isLoading ? (
            <JustOneSecond />
          ) : (
            <>
              <AddNewProduct token={token} isSmallScreen={isSmallScreen} />

              {!isSmallScreen && <Divider hidden />}

              {data?.products && data.products.length > 0 ? (
                <Products
                  products={data.products}
                  isSmallScreen={isSmallScreen}
                />
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

export default Screen
