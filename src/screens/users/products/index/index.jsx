import React, { useEffect, useContext } from 'react'
import Link from 'next/link'

import { Segment, Divider, Message, List } from 'semantic-ui-react'

import Products from '../../../../components/Products'
import ErrorWrapper from '../../../../components/ErrorWrapper'
import JustOneSecond from '../../../../components/JustOneSecond'
import { useAuth } from '../../../../hooks'
import AddNewProduct from '../../../../forms/AddNewProduct'
import useProducts from '../../../../hooks/useProducts'
import DisplayContext from '../../../../context/display-context'

const telegram_bot_account = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ACCOUNT

const Screen = () => {
  const { user, token, logout } = useAuth()
  const { data, isLoading, error } = useProducts(token)
  const { isSmallScreen } = useContext(DisplayContext)

  useEffect(() => {
    if (error && error?.info?.status === 'forbidden') {
      return logout()
    }
  }, [error])

  if (!user) {
    return <JustOneSecond />
  }

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
              <Message>
                <Message.Header>
                  Рады вас видеть и хотим поблагодарить, что согласились помочь
                  нам в тестировании!
                </Message.Header>

                <Segment>
                  <p>
                    <strong>Что мы хотим протестировать:</strong>
                  </p>

                  <List ordered>
                    <List.Item>Удобство использования системой</List.Item>
                    <List.Item>
                      Найти проблемы и ошибки при обработке цен и наличия
                      товаров
                    </List.Item>
                    <List.Item>Выяснить интерес пользователей</List.Item>
                  </List>
                </Segment>

                <Segment>
                  <p>
                    <strong>На сегодня план очень простой и понятный:</strong>
                  </p>

                  <List bulleted>
                    <List.Item>
                      В форму ниже добавьте по очереди несколько ссылок на свои
                      товары из Озона и/или Вайлдберрис
                    </List.Item>

                    <List.Item>
                      Если пользуетесь только одним магазином, то значит ссылки
                      только из него. Если не знаете как -{' '}
                      <Link href="/help" passHref>
                        <a>мы подготовили инструкции</a>
                      </Link>
                    </List.Item>

                    <List.Item>
                      Через полчаса товары появятся в системе и мы начнём
                      собирать цены и проверять наличие
                    </List.Item>

                    <List.Item>
                      Перейдите по{' '}
                      <a
                        href={`https://t.me/${telegram_bot_account}?start=${user.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Наш бот в Telegram"
                      >
                        этой ссылке{' '}
                      </a>
                      в Телеграм бота, чтобы мы добавили аккаунт в систему
                    </List.Item>

                    <List.Item>
                      Ответьте на вопросы{' '}
                      <a
                        href="https://forms.gle/Vojfs8t1hNAhKc5q8"
                        target="_blank"
                        rel="noreferrer"
                      >
                        простой формы
                      </a>
                    </List.Item>
                  </List>
                </Segment>

                <Segment>
                  <p>
                    <strong>Что дальше?</strong>
                  </p>

                  <List bulleted>
                    <List.Item>
                      Завтра к вечеру мы будем знать 2-3 цены по каждой позиции
                    </List.Item>
                    <List.Item>
                      Попробуйте пока полазить в системе и понять, удобно ли вам
                      этим вообще пользоваться или же всё слишком сложно
                    </List.Item>
                  </List>
                </Segment>
              </Message>

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
