import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { getUserByToken } from '../../../../../services/auth'
import { getProduct } from '../../../../../services/products'
import { responseJSON } from '../../../../../lib/helpers'
import {
  getUserProduct,
  getUserProductWithActualStateAndHistory,
} from '../../../../../services/users'
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
  UNABLE_TO_GET_PRODUCT_HISTORY,
} from '../../../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
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

  let productWithActualStateAndHistory

  try {
    productWithActualStateAndHistory = getUserProductWithActualStateAndHistory(
      product,
      userProduct
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, userProduct })
      scope.setTag('section', 'getUserProductWithActualStateAndHistory')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_PRODUCT_HISTORY)
  }

  return responseJSON(res, 200, {
    product: productWithActualStateAndHistory.product,
    history: productWithActualStateAndHistory.history,
  })
}

export default withSentry(handler)