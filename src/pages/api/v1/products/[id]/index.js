import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { findUserByToken } from '../../../../../services/auth'
import { findProductById } from '../../../../../services/products'
import {
  removeProductWithSubscriptionsFromUser,
  UsersService,
} from '../../../../../services/users'
import { responseJSON } from '../../../../../lib/helpers'
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
  UNABLE_TO_REMOVE_USER_PRODUCT_WITH_SUBSCRIPTIONS,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
  UNABLE_TO_CHANGE_PRODUCT_STATUS_TO_HOLD,
  UNABLE_TO_CHECK_IS_PRODUCT_OWNED_BY_USERS,
} from '../../../../../lib/messages'
import { isEmptyString, isValidUUID } from '../../../../../lib/validators'
import { getShops } from '../../../../../services/shops'
import { UserProductsService } from '../../../../../services/user_products_service'
import { validateBearerToken } from '../../../../../lib/auth_helpers'
import { ProductsService } from '../../../../../services/products_service'

const handler = async (req, res) => {
  if (!['GET', 'DELETE'].includes(req.method)) {
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
      productId
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, productId })
      scope.setTag('section', 'UserProductsService.getByUserIdAndProductId')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCT)
  }

  if (!userProduct) {
    return responseJSON(res, 404, USER_DOES_NOT_HAVE_PRODUCT)
  }

  if (req.method === 'DELETE') {
    try {
      await removeProductWithSubscriptionsFromUser(user.id, productId)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { user, productId })
        scope.setTag('section', 'removeProductWithSubscriptionsFromUser')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return responseJSON(
        res,
        500,
        UNABLE_TO_REMOVE_USER_PRODUCT_WITH_SUBSCRIPTIONS
      )
    }

    let isOwnedByUsers

    try {
      isOwnedByUsers = await ProductsService.isOwnedByUsers(productId)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { productId })
        scope.setTag('section', 'ProductsService.isOwnedByUsers')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_CHECK_IS_PRODUCT_OWNED_BY_USERS)
    }

    if (!isOwnedByUsers) {
      try {
        await ProductsService.moveToHold(productId)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { productId })
          scope.setTag('section', 'ProductsService.moveToHold')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(res, 500, UNABLE_TO_CHANGE_PRODUCT_STATUS_TO_HOLD)
      }
    }

    return responseJSON(res, 200, {})
  }

  const groups = await UserProductsService.findAllProductsGroups(
    user.id,
    userProduct.user_product_id
  )

  return responseJSON(res, 200, {
    product: userProduct,
    shops: getShops(),
    groups: groups,
  })
}

export default withSentry(handler)
