import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { responseJSON } from '../../../../../lib/helpers'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  FORBIDDEN,
  MISSING_PRODUCTS_GROUP_ID,
  INVALID_PRODUCTS_GROUP_UUID,
  UNABLE_TO_FIND_USER_PRODUCTS_GROUP,
  PRODUCTS_GROUP_DOES_NOT_EXIST,
  UNABLE_TO_GET_USER_PRODUCTS,
  UNABLE_TO_GET_PRODUCTS_FROM_USER_PRODUCTS_GROUP,
  MISSING_USER_PRODUCT_ID,
  INVALID_USER_PRODUCT_UUID,
  UNABLE_TO_FIND_USER_PRODUCT,
  UNABLE_TO_CHECK_ITEM_PRESENCE_IN_PRODUCTS_GROUP,
  USER_PRODUCT_DOES_NOT_EXIST,
  USER_PRODUCT_ALREADY_EXISTS_IN_PRODUCTS_GROUP,
  USER_PRODUCT_HAS_BEEN_ADDED_TO_PRODUCTS_GROUP,
  UNABLE_TO_ADD_USER_PRODUCT_TO_PRODUCTS_GROUP,
  UNABLE_TO_DELETE_USER_PRODUCTS_GROUP,
  USER_PRODUCTS_GROUP_DELETED,
} from '../../../../../lib/messages'
import { isEmptyString, isValidUUID } from '../../../../../lib/validators'
import { UserProductsGroupsService } from '../../../../../services/user_products_groups_service'
import { UserProductsGroupService } from '../../../../../services/user_products_group_service'
import { UserProductsService } from '../../../../../services/user_products_service'
import { validateUserToken } from '../../../../../lib/auth_helpers'
import { findUserByToken } from '../../../../../services/auth'

const handler = async (req, res) => {
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const tokenResult = validateUserToken(req.headers)

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

  const productsGroupId = req.query.id

  if (isEmptyString(productsGroupId)) {
    return responseJSON(res, 400, MISSING_PRODUCTS_GROUP_ID)
  }

  if (!isValidUUID(productsGroupId)) {
    return responseJSON(res, 400, INVALID_PRODUCTS_GROUP_UUID)
  }

  let productsGroup

  try {
    productsGroup = await UserProductsGroupsService.find(
      user.id,
      productsGroupId
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, productsGroupId })
      scope.setTag('section', 'UserProductsGroupsService.find')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_PRODUCTS_GROUP)
  }

  if (!productsGroup) {
    return responseJSON(res, 404, PRODUCTS_GROUP_DOES_NOT_EXIST)
  }

  switch (req.method) {
    case 'GET': {
      let productsInGroup

      try {
        productsInGroup = await UserProductsGroupService.getProductsInGroup(
          user.id,
          productsGroupId
        )
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user, productsGroupId })
          scope.setTag('section', 'UserProductsGroupService.getProductsInGroup')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(
          res,
          500,
          UNABLE_TO_GET_PRODUCTS_FROM_USER_PRODUCTS_GROUP
        )
      }

      let userProducts

      try {
        userProducts = await UserProductsService.all(user.id)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user })
          scope.setTag('section', 'UserProductsService.all')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCTS)
      }

      // Удаляем те товары из доступных товаров, которые уже есть в текущей группе товаров
      const productsInGroupIds = productsInGroup.map(
        (productInGroup) => productInGroup.product_id
      )

      userProducts = userProducts.filter(
        (userProduct) => !productsInGroupIds.includes(userProduct.product_id)
      )

      return responseJSON(res, 200, {
        products_group: productsGroup,
        products_group_items: productsInGroup,
        user_products: userProducts,
      })
    }
    case 'POST': {
      const userProductId = req.body.user_product_id

      if (isEmptyString(userProductId)) {
        return responseJSON(res, 400, MISSING_USER_PRODUCT_ID)
      }

      if (!isValidUUID(userProductId)) {
        return responseJSON(res, 400, INVALID_USER_PRODUCT_UUID)
      }

      let userProduct

      try {
        userProduct = await UserProductsService.findForUser(
          user.id,
          userProductId
        )
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user, userProductId })
          scope.setTag('section', 'UserProductsService.findForUser')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(res, 500, UNABLE_TO_FIND_USER_PRODUCT)
      }

      if (!userProduct) {
        return responseJSON(res, 404, USER_PRODUCT_DOES_NOT_EXIST)
      }

      let groupItemExists

      try {
        groupItemExists = await UserProductsGroupService.isItemExists(
          user.id,
          productsGroupId,
          userProductId
        )
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user, productsGroupId, userProductId })
          scope.setTag('section', 'UserProductsGroupService.isItemExists')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(
          res,
          500,
          UNABLE_TO_CHECK_ITEM_PRESENCE_IN_PRODUCTS_GROUP
        )
      }

      if (groupItemExists) {
        return responseJSON(
          res,
          409,
          USER_PRODUCT_ALREADY_EXISTS_IN_PRODUCTS_GROUP
        )
      }

      try {
        await UserProductsGroupService.addItem(
          user.id,
          productsGroupId,
          userProductId
        )
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user, productsGroupId, userProductId })
          scope.setTag('section', 'UserProductsGroupService.addItem')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(
          res,
          500,
          UNABLE_TO_ADD_USER_PRODUCT_TO_PRODUCTS_GROUP
        )
      }

      return responseJSON(
        res,
        201,
        USER_PRODUCT_HAS_BEEN_ADDED_TO_PRODUCTS_GROUP
      )
    }
    case 'DELETE': {
      try {
        await UserProductsGroupsService.delete(user.id, productsGroupId)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user, productsGroupId })
          scope.setTag('section', 'UserProductsGroupsService.delete')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(res, 500, UNABLE_TO_DELETE_USER_PRODUCTS_GROUP)
      }

      return responseJSON(res, 200, USER_PRODUCTS_GROUP_DELETED)
    }
  }
}

export default withSentry(handler)
