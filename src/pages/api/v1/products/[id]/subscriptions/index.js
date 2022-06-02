import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { getUserByToken } from '../../../../../../services/auth'
import {
  getProduct,
  removeUserProductSubscriptions,
} from '../../../../../../services/products'
import { getUserProduct } from '../../../../../../services/users'
import { responseJSON } from '../../../../../../lib/helpers'
import {
  addProductSubscription,
  getUserProductSubscriptions,
  getUserProductSubscriptionByType,
} from '../../../../../../services/products'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
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
  UNABLE_TO_REMOVE_USER_PRODUCT_SUBSCRIPTIONS,
} from '../../../../../../lib/messages'
import { isEmptyString } from '../../../../../../lib/validators'

const handler = async (req, res) => {
  if (!['POST', 'GET', 'DELETE'].includes(req.method)) {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const { authorization } = req.headers

  if (!authorization) {
    return responseJSON(res, 401, MISSING_AUTHORIZATION_HEADER)
  }

  if (!authorization.startsWith('Bearer ')) {
    return responseJSON(res, 401, MISSING_BEARER_KEY)
  }

  const token = authorization.replace(/^Bearer /, '').trim()

  if (token.length === 0) {
    return responseJSON(res, 401, MISSING_TOKEN)
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

    return responseJSON(res, 500, UNABLE_TO_GET_USER_BY_TOKEN)
  }

  if (!user) {
    return responseJSON(res, 403, FORBIDDEN)
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

    return responseJSON(res, 500, UNABLE_TO_GET_PRODUCT_BY_ID)
  }

  if (!product) {
    return responseJSON(res, 404, PRODUCT_DOES_NOT_EXIST)
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

    return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCT)
  }

  if (!userProduct) {
    return responseJSON(res, 404, USER_DOES_NOT_HAVE_PRODUCT)
  }

  // FIXME: До этого момента сверху всё копипаста из src/pages/products/[id].jsx

  switch (req.method) {
    case 'GET': {
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

        return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCT_SUBSCRIPTIONS)
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

      return responseJSON(res, 200, subscriptions)
    }

    case 'DELETE': {
      try {
        removeUserProductSubscriptions(user.id, product.id)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user, product })
          scope.setTag('section', 'removeUserProductSubscriptions')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(
          res,
          500,
          UNABLE_TO_REMOVE_USER_PRODUCT_SUBSCRIPTIONS
        )
      }

      return responseJSON(res, 200, {})
    }

    default: {
      if (!user.telegram_account || isEmptyString(user.telegram_account)) {
        return responseJSON(
          res,
          400,
          USER_DOES_NOT_HAVE_LINKED_TELEGRAM_ACCOUNT
        )
      }

      const { subscription_type, payload } = req.body

      if (isEmptyString(subscription_type)) {
        return responseJSON(res, 400, MISSING_SUBSCRIPTION_TYPE)
      }

      const subscriptionType = subscription_type.toLowerCase()

      if (subscriptionType !== 'on_change_status_to_in_stock') {
        return responseJSON(res, 422, SUBSCRIPTION_TYPE_IS_NOT_VALID)
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

        return responseJSON(res, 500, UNABLE_TO_GET_USER_SUBSCRIPTION_BY_TYPE)
      }

      if (userSubscription) {
        return responseJSON(
          res,
          200,
          USER_ALREADY_SUBSCRIBED_TO_SUBSCRIPTION_TYPE
        )
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
            payload,
          })
          scope.setTag('section', 'addProductSubscription')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(
          res,
          500,
          UNABLE_TO_ADD_USER_SUBSCRIPTION_TO_PRODUCT
        )
      }

      return responseJSON(res, 201, userSubscription)
    }
  }
}

export default withSentry(handler)
