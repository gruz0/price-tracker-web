import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { findUserByToken } from '../../../../../../services/auth'
import {
  findProductById,
  removeUserProductSubscriptions,
} from '../../../../../../services/products'
import { responseJSON } from '../../../../../../lib/helpers'
import {
  addProductSubscription,
  getUserProductSubscriptions,
  getUserProductSubscriptionByType,
} from '../../../../../../services/products'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  FORBIDDEN,
  MISSING_PRODUCT_ID,
  INVALID_PRODUCT_UUID,
  UNABLE_TO_FIND_PRODUCT_BY_ID,
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
import { isEmptyString, isValidUUID } from '../../../../../../lib/validators'
import { validateBearerToken } from '../../../../../../lib/auth_helpers'
import { UserProductsService } from '../../../../../../services/user_products_service'

const handler = async (req, res) => {
  if (!['POST', 'GET', 'DELETE'].includes(req.method)) {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const tokenResult = validateBearerToken(req.headers)

  if (typeof tokenResult !== 'string') {
    return responseJSON(res, tokenResult.code, tokenResult.error)
  }

  const token = tokenResult

  let user

  try {
    user = await findUserByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'findUserByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_TOKEN)
  }

  if (!user) {
    return responseJSON(res, 403, FORBIDDEN)
  }

  const productId = req.query.id

  if (isEmptyString(productId)) {
    return responseJSON(res, 400, MISSING_PRODUCT_ID)
  }

  if (!isValidUUID(productId)) {
    return responseJSON(res, 400, INVALID_PRODUCT_UUID)
  }

  let product

  try {
    product = await findProductById(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'findProductById')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_PRODUCT_BY_ID)
  }

  if (!product) {
    return responseJSON(res, 404, PRODUCT_DOES_NOT_EXIST)
  }

  let userProduct

  try {
    userProduct = await UserProductsService.getByUserIdAndProductId(
      user.id,
      product.id
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product })
      scope.setTag('section', 'UserProductsService.getByUserIdAndProductId')
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
        userProductSubscriptions = await getUserProductSubscriptions(
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

      if (userProductSubscriptions.length > 0) {
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
        await removeUserProductSubscriptions(user.id, product.id)
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
        userSubscription = await getUserProductSubscriptionByType(
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
        userSubscription = await addProductSubscription(
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
