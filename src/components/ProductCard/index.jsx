import React, { useState } from 'react'
import {
  Divider,
  Menu,
  Button,
  Header,
  Segment,
  Message,
  Checkbox,
  Icon,
} from 'semantic-ui-react'
import { useRouter } from 'next/router'
import { Statistics } from './Statistics'
import { ProductGroups } from './ProductGroups'
import { SearchInOtherShops } from './SearchInOtherShops'
import { Chart } from './Chart'
import { PriceTable } from './PriceTable'
import ErrorWrapper from '../ErrorWrapper'
import { isEmptyString } from '../../lib/validators'
import {
  subscribeUserToProductEvent,
  unsubscribeUserFromProductEvent,
  removeAllProductSubscriptionsFromUser,
} from '../../lib/subscriptions'
import { removeProductFromUser } from '../../lib/products'

export const ProductCard = ({
  user,
  token,
  product,
  shops,
  groups,
  productHistory,
  productSubscriptions,
  isSmallScreen,
}) => {
  const router = useRouter()

  const [subscriptionError, setSubscriptionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // FIXME: Вынести это в хелпер и переиспользовать в auth.js
  const hasSubscriptions =
    productSubscriptions &&
    !(
      Object.keys(productSubscriptions).length === 0 &&
      productSubscriptions.constructor === Object
    )

  const userHasTelegramAccount =
    user && user.telegram_account && !isEmptyString(user.telegram_account)

  const handleOutOfStockSubscription = () => {
    setSubscriptionError('')
    setIsSubmitting(true)

    const subscriptionType = 'on_change_status_to_in_stock'
    const subscription =
      hasSubscriptions && productSubscriptions['on_change_status_to_in_stock']

    try {
      if (subscription) {
        unsubscribeUserFromProductEvent(token, product.id, subscription.id)
          .then(() => router.reload())
          .catch((err) => {
            console.error({ err })
            setSubscriptionError(err)
          })
      } else {
        subscribeUserToProductEvent(token, product.id, subscriptionType)
          .then(() => router.reload())
          .catch((err) => {
            console.error({ err })
            setSubscriptionError(err)
          })
      }
    } catch (err) {
      console.error({ err })
      setSubscriptionError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveProductFromUser = () => {
    if (!confirm('Удалить товар из отслеживаемых?')) {
      return
    }

    try {
      removeProductFromUser(token, product.id)
        .then(() => router.push('/products'))
        .catch((err) => console.error({ err }))
    } catch (err) {
      console.error({ err })
    }
  }

  const handleRemoveAllProductSubscriptions = () => {
    if (!confirm('Удалить все уведомления товара?')) {
      return
    }

    try {
      removeAllProductSubscriptionsFromUser(token, product.id)
        .then(() => router.reload())
        .catch((err) => console.error({ err }))
    } catch (err) {
      console.error({ err })
    }
  }

  return (
    <>
      {!isSmallScreen && <Divider hidden fitted />}

      <Header as={isSmallScreen ? 'h2' : 'h1'}>{product.title}</Header>

      {productHistory.history.length > 0 ? (
        <>
          <Segment padded={!isSmallScreen} loading={isSubmitting}>
            {subscriptionError !== '' && (
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
                Boolean(productSubscriptions['on_change_status_to_in_stock'])
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
                    Для получения уведомлений вам необходимо выполнить привязку
                    вашего аккаунта Telegram.
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
            <Statistics
              product={productHistory.product}
              isSmallScreen={isSmallScreen}
            />
          </Segment>

          <Menu stackable>
            <Menu.Item
              as="a"
              href={productHistory.product.url}
              target="_blank"
              rel="noreferrer noopener"
              content={`Перейти в магазин ${product.shop}`}
              icon="linkify"
            />

            {groups.length > 0 && <ProductGroups groups={groups} />}

            <SearchInOtherShops product={product} shops={shops} />
          </Menu>

          <Header as="h3">Динамика цен</Header>

          <Segment>
            <Chart
              product={productHistory.product}
              history={productHistory.history}
            />
          </Segment>

          <Header as="h3">Таблица цен</Header>

          {isSmallScreen ? (
            <Message>
              <Message.Header>Не доступно в мобильной версии</Message.Header>
              <p>
                В мобильной версии таблица цен не отображается. Воспользуйтесь
                десктопной версией, пожалуйста.
              </p>
            </Message>
          ) : (
            <PriceTable history={productHistory.history} />
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
            В данный момент недостаточно информации для отображения графиков и
            таблиц
          </Message.Header>
          <p>
            Вернитесь, пожалуйста, через несколько часов, мы обновим цены и
            сможем отобразить все необходимые элементы страницы.
          </p>
        </Message>
      )}
    </>
  )
}
