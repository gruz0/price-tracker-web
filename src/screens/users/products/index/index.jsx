import React from 'react'
import { Divider, Message } from 'semantic-ui-react'
import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import Products from '../../../../components/Products'
import { AddNewProduct } from '../../../../forms/AddNewProduct'
import { useAuth } from '../../../../hooks'
import useProducts from '../../../../hooks/useProducts'
import { isEmptyString } from '../../../../lib/validators'
import { Brief } from './Brief'

export const ProductsScreen = ({ isSmallScreen }) => {
  const { isLoading: userLoading, isAuthenticated, user, token } = useAuth()
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(token)

  if (userLoading) {
    return <JustOneSecond title="Загружаем пользователя..." />
  }

  if (!isAuthenticated) {
    return <ErrorWrapper header="Пожалуйста, войдите в систему" />
  }

  if (productsLoading) {
    return <JustOneSecond title="Загружаем товары..." />
  }

  if (productsError) {
    return (
      <ErrorWrapper
        header="Не удалось загрузить товары"
        error={productsError}
      />
    )
  }

  const products = productsResponse.products

  return (
    <>
      {isEmptyString(user.telegram_account) ? (
        <Brief user={user} />
      ) : (
        <Message>
          <Message.Header>
            Если вы ещё не заполнили наш простой опросник, уделите 5 минут
            времени, пожалуйста
          </Message.Header>
          <p>
            Воспользуйтесь формой{' '}
            <a
              href="https://forms.gle/Vojfs8t1hNAhKc5q8"
              target="_blank"
              rel="noreferrer noopener"
            >
              по этой ссылке{' '}
            </a>
            и на основании ответов мы улучшим сервис для вас :-)
          </p>
        </Message>
      )}

      <AddNewProduct token={token} isSmallScreen={isSmallScreen} />

      {!isSmallScreen && <Divider hidden />}

      {products.length > 0 ? (
        <Products products={products} isSmallScreen={isSmallScreen} />
      ) : (
        <Message info>
          <Message.Header>
            В данный момент у вас нет добавленных товаров для отображения
          </Message.Header>
          <p>
            Воспользуйтесь формой выше для добавления первого товара для
            отслеживания цены.
          </p>
        </Message>
      )}
    </>
  )
}
