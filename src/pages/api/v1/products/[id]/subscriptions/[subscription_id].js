import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { findUserByToken } from '../../../../../../services/auth'
import { findProductById } from '../../../../../../services/products'
import { responseJSON } from '../../../../../../lib/helpers'
import {
  getUserProductSubscription,
  removeUserProductSubscription,
} from '../../../../../../services/products'
import {
  METHOD_NOT_ALLOWED,
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
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
} from '../../../../../../lib/messages'
import { isEmptyString, isValidUUID } from '../../../../../../lib/validators'
import { UserProductsService } from '../../../../../../services/user_products_service'
import { validateBearerToken } from '../../../../../../lib/auth_helpers'
import { UsersService } from '../../../../../../services/users'

const handler = async (req, res) => {
  if (!['DELETE'].includes(req.method)) {
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

  try {
    await UsersService.updateLastActivity(user.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user })
      scope.setTag('section', 'UsersService.updateLastActivity')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_UPDATE_USER_LAST_ACTIVITY)
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
