import React, { useState, useEffect } from 'react'
import {
  Divider,
  Label,
  Button,
  Header,
  Segment,
  Message,
  Checkbox,
  Icon,
} from 'semantic-ui-react'
import { useRouter } from 'next/router'
import Statistics from './Statistics'
import Chart from './Chart'
import PriceTable from './PriceTable'
import { useAuth } from '../../hooks'
import JustOneSecond from '../JustOneSecond'
import useProductHistory from '../../hooks/useProductHistory'
import useMyProductSubscriptions from '../../hooks/useMyProductSubscriptions'
import ErrorWrapper from '../ErrorWrapper'
import { isEmptyString } from '../../lib/validators'
import {
  subscribeUserToProductEvent,
  unsubscribeUserFromProductEvent,
  removeAllProductSubscriptionsFromUser,
} from '../../lib/subscriptions'
import { removeProductFromUser } from '../../lib/products'

export default function ProductCard({ product, isSmallScreen }) {
  const router = useRouter()
  const { user, token, logout } = useAuth()
  const { data, isLoading, error } = useProductHistory(product.id, token)
  const {
    data: subscriptions,
    isLoading: areSubscriptionsLoading,
    error: subscriptionsLoadingError,
  } = useMyProductSubscriptions(product.id, token)

  const [subscriptionError, setSubscriptionError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // FIXME: Вынести это в хелпер и переиспользовать в auth.js
  const hasSubscriptions =
    subscriptions &&
    !(
      Object.keys(subscriptions).length === 0 &&
      subscriptions.constructor === Object
    )

  useEffect(() => {
    if (error && error?.info?.status === 'forbidden') {
      return logout()
    }

    if (subscriptionError && subscriptionError?.info?.status === 'forbidden') {
      return logout()
    }

    if (
      subscriptionsLoadingError &&
      subscriptionsLoadingError?.info?.status === 'forbidden'
    ) {
      return logout()
    }
  }, [error, subscriptionError, subscriptionsLoadingError])

  const userHasTelegramAccount =
    user && user.telegram_account && !isEmptyString(user.telegram_account)

  const handleOutOfStockSubscription = async (e) => {
    e.preventDefault()

    setSubscriptionError(null)
    setIsSubmitting(true)

    const subscriptionType = 'on_change_status_to_in_stock'
    const subscription =
      hasSubscriptions && subscriptions['on_change_status_to_in_stock']

    try {
      if (subscription) {
        await unsubscribeUserFromProductEvent(
          token,
          product.id,
          subscription.id
        )
      } else {
        await subscribeUserToProductEvent(token, product.id, subscriptionType)
      }

      router.reload()
    } catch (err) {
      setSubscriptionError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveProductFromUser = async (e) => {
    if (!confirm('Удалить товар из отслеживаемых?')) {
      return
    }

    e.preventDefault()

    try {
      await removeProductFromUser(token, product.id)

      router.push('/products')
      return
    } catch (err) {
      console.error({ err })
    }
  }

  const handleRemoveAllProductSubscriptions = async (e) => {
    if (!confirm('Удалить все уведомления товара?')) {
      return
    }

    e.preventDefault()

    try {
      await removeAllProductSubscriptionsFromUser(token, product.id)

      router.reload()
      return
    } catch (err) {
      console.error({ err })
    }
  }

  return (
    <>
      {!isSmallScreen && <Divider hidden fitted />}

      <Header as={isSmallScreen ? 'h2' : 'h1'}>{product.title}</Header>

      {error ? (
        <ErrorWrapper
          header="Не удалось загрузить историю товара"
          error={error}
        />
      ) : (
        <>
          {isLoading || !data?.product ? (
            <JustOneSecond />
          ) : (
            <>
              {data?.history && data.history.length > 0 ? (
                <>
                  <Segment
                    padded={!isSmallScreen}
                    loading={isSubmitting || areSubscriptionsLoading}
                  >
                    {subscriptionError && (
                      <ErrorWrapper
                        header="Ошибка при обработке подписки"
                        error={subscriptionError}
                      />
                    )}

                    <Checkbox
                      toggle
                      label="Уведомить меня в Telegram при появлении товара"
                      disabled={!userHasTelegramAccount}
                      onChange={handleOutOfStockSubscription}
                      checked={
                        hasSubscriptions &&
                        Boolean(subscriptions['on_change_status_to_in_stock'])
                      }
                    />

                    {!userHasTelegramAccount && (
                      <Message warning icon>
                        <Icon name="warning" />

                        <Message.Content>
                          <Message.Header>
                            Необходимо привязать аккаунт Telegram
                          </Message.Header>

                          <p>
                            Для получения уведомлений вам необходимо выполнить
                            привязку вашего аккаунта Telegram.
                            <br />
                            Перейдите{' '}
                            <a
                              href={`https://t.me/chartik_ru_bot?start=${user.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Выполнить привязку бота к аккаунту"
                            >
                              по ссылке{' '}
                            </a>
                            для привязки вашего аккаунта к сервису.
                          </p>
                        </Message.Content>
                      </Message>
                    )}
                  </Segment>

                  <Segment padded={!isSmallScreen}>
                    <Label
                      as="a"
                      href={data.product.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      content="Перейти в магазин"
                      attached="bottom"
                      icon="linkify"
                    />

                    <Statistics
                      product={data.product}
                      isSmallScreen={isSmallScreen}
                    />
                  </Segment>

                  <Header as="h3">Динамика цен</Header>

                  <Segment>
                    <Chart product={data.product} history={data.history} />
                  </Segment>

                  <Header as="h3">Таблица цен</Header>

                  {isSmallScreen ? (
                    <Message>
                      <Message.Header>
                        Не доступно в мобильной версии
                      </Message.Header>
                      <p>
                        В мобильной версии таблица цен не отображается.
                        Воспользуйтесь десктопной версией, пожалуйста.
                      </p>
                    </Message>
                  ) : (
                    <PriceTable history={data.history} />
                  )}

                  <Header as="h3">Полезные кнопки</Header>

                  <Segment textAlign="right">
                    {hasSubscriptions && (
                      <Button
                        onClick={handleRemoveAllProductSubscriptions}
                        content="Удалить все уведомления"
                        color="orange"
                      />
                    )}

                    <Button
                      onClick={handleRemoveProductFromUser}
                      content="Удалить товар"
                      negative
                    />
                  </Segment>
                </>
              ) : (
                <Message info>
                  <Message.Header>
                    В данный момент недостаточно информации для отображения
                    графиков и таблиц
                  </Message.Header>
                  <p>
                    Вернитесь, пожалуйста, через несколько часов, мы обновим
                    цены и сможем отобразить все необходимые элементы страницы.
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
