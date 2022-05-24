import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { checkToken } from '../../../../../../lib/auth'

import { getUserByToken } from '../../../../../../services/auth'
import { getProduct } from '../../../../../../services/products'
import { getUserProduct } from '../../../../../../services/users'
import {
  addProductSubscription,
  getUserProductSubscriptions,
  getUserProductSubscriptionByType,
} from '../../../../../../services/products'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_GET_USER_BY_TOKEN,
  FORBIDDEN,
  UNABLE_TO_GET_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  UNABLE_TO_GET_USER_PRODUCT,
  USER_DOES_NOT_HAVE_PRODUCT,
  USER_DOES_NOT_HAVE_LINKED_TELEGRAM_ACCOUNT,
  UNABLE_TO_GET_USER_SUBSCRIPTION_BY_TYPE,
  USER_ALREADY_SUBSCRIBED_TO_SUBSCRIPTION_TYPE,
  UNABLE_TO_ADD_USER_SUBSCRIPTION_TO_PRODUCT,
  MISSING_SUBSCRIPTION_TYPE,
  SUBSCRIPTION_TYPE_IS_NOT_VALID,
  UNABLE_TO_GET_USER_PRODUCT_SUBSCRIPTIONS,
} from '../../../../../../lib/messages'
import { isEmptyString } from '../../../../../../lib/validators'

const handler = async (req, res) => {
  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json(METHOD_NOT_ALLOWED)
  }

  const token = checkToken(req, res)

  if (!token) {
    return
  }

  let user

  try {
    user = getUserByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'getUserByToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_BY_TOKEN)
  }

  if (!user) {
    return res.status(403).json(FORBIDDEN)
  }

  const productId = req.query.id

  let product

  try {
    product = getProduct(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'getProduct')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_PRODUCT_BY_ID)
  }

  if (!product) {
    return res.status(404).json(PRODUCT_DOES_NOT_EXIST)
  }

  let userProduct

  try {
    userProduct = getUserProduct(user.id, product.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product })
      scope.setTag('section', 'getUserProduct')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_PRODUCT)
  }

  if (!userProduct) {
    return res.status(404).json(USER_DOES_NOT_HAVE_PRODUCT)
  }

  // FIXME: До этого момента сверху всё копипаста из src/pages/products/[id].jsx

  if (req.method === 'GET') {
    let subscriptions = {}
    let userProductSubscriptions

    try {
      userProductSubscriptions = getUserProductSubscriptions(
        user.id,
        product.id
      )
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { user, product })
        scope.setTag('section', 'getUserProductSubscriptions')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return res.status(400).json(UNABLE_TO_GET_USER_PRODUCT_SUBSCRIPTIONS)
    }

    if (userProductSubscriptions.length !== 0) {
      userProductSubscriptions.forEach((userProductSubscription) => {
        const { id, payload, created_at } = userProductSubscription

        subscriptions[userProductSubscription.subscription_type] = {
          id,
          payload,
          created_at,
        }
      })
    }

    return res.status(200).json(subscriptions)
  }

  if (!user.telegram_account || isEmptyString(user.telegram_account)) {
    return res.status(400).json(USER_DOES_NOT_HAVE_LINKED_TELEGRAM_ACCOUNT)
  }

  const { subscription_type, payload } = req.body

  if (isEmptyString(subscription_type)) {
    return res.status(422).json(MISSING_SUBSCRIPTION_TYPE)
  }

  const subscriptionType = subscription_type.toLowerCase()

  if (subscriptionType !== 'on_change_status_to_in_stock') {
    return res.status(422).json(SUBSCRIPTION_TYPE_IS_NOT_VALID)
  }

  let userSubscription

  try {
    userSubscription = getUserProductSubscriptionByType(
      user.id,
      product.id,
      subscriptionType
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product, subscriptionType })
      scope.setTag('section', 'getUserProductSubscriptionByType')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_SUBSCRIPTION_BY_TYPE)
  }

  if (userSubscription) {
    return res.status(200).json(USER_ALREADY_SUBSCRIBED_TO_SUBSCRIPTION_TYPE)
  }

  try {
    userSubscription = addProductSubscription(
      product.id,
      user.id,
      subscriptionType,
      payload
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', {
        user,
        product,
        subscriptionType,
      })
      scope.setTag('section', 'addProductSubscription')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_ADD_USER_SUBSCRIPTION_TO_PRODUCT)
  }

  return res.status(201).json(userSubscription)
}

export default withSentry(handler)
