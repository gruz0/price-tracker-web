import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { findUserByToken } from '../../../../../../services/auth'
import { findProductById } from '../../../../../../services/products'
import { getUserProduct } from '../../../../../../services/users'
import { responseJSON } from '../../../../../../lib/helpers'
import {
  getUserProductSubscription,
  removeUserProductSubscription,
} from '../../../../../../services/products'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  FORBIDDEN,
  INVALID_PRODUCT_UUID,
  UNABLE_TO_FIND_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  UNABLE_TO_GET_USER_PRODUCT,
  USER_DOES_NOT_HAVE_PRODUCT,
  USER_DOES_NOT_HAVE_PRODUCT_SUBSCRIPTION,
  UNABLE_TO_REMOVE_USER_SUBSCRIPTION_FROM_PRODUCT,
  UNABLE_TO_GET_USER_PRODUCT_SUBSCRIPTION,
  MISSING_PRODUCT_ID,
  MISSING_SUBSCRIPTION_ID,
  INVALID_SUBSCRIPTION_UUID,
} from '../../../../../../lib/messages'
import { isEmptyString, isValidUUID } from '../../../../../../lib/validators'

const handler = async (req, res) => {
  if (!['DELETE'].includes(req.method)) {
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

  if (!isValidUUID(token)) {
    return responseJSON(res, 400, INVALID_TOKEN_UUID)
  }

  let user

  try {
    user = await findUserByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
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
    userProduct = await getUserProduct(user.id, product.id)
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

  const subscriptionId = req.query.subscription_id

  if (isEmptyString(subscriptionId)) {
    return responseJSON(res, 400, MISSING_SUBSCRIPTION_ID)
  }

  if (!isValidUUID(subscriptionId)) {
    return responseJSON(res, 400, INVALID_SUBSCRIPTION_UUID)
  }

  let userProductSubscription

  try {
    userProductSubscription = await getUserProductSubscription(
      user.id,
      product.id,
      subscriptionId
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product, subscriptionId })
      scope.setTag('section', 'getUserProductSubscription')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCT_SUBSCRIPTION)
  }

  if (!userProductSubscription) {
    return responseJSON(res, 404, USER_DOES_NOT_HAVE_PRODUCT_SUBSCRIPTION)
  }

  try {
    await removeUserProductSubscription(user.id, product.id, subscriptionId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', {
        user,
        product,
        subscriptionId,
      })
      scope.setTag('section', 'removeUserProductSubscription')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(
      res,
      500,
      UNABLE_TO_REMOVE_USER_SUBSCRIPTION_FROM_PRODUCT
    )
  }

  return responseJSON(res, 200, {})
}

export default withSentry(handler)
