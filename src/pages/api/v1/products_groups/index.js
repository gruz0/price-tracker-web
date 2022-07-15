import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { responseJSON } from '../../../../lib/helpers'
import { UserProductsGroupsService } from '../../../../services/user_products_groups_service'
import {
  METHOD_NOT_ALLOWED,
  FORBIDDEN,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  UNABLE_TO_GET_USER_PRODUCTS_GROUPS,
  MISSING_USER_PRODUCTS_GROUP_TITLE,
  USER_PRODUCTS_GROUP_CREATED,
  UNABLE_TO_CREATE_USER_PRODUCTS_GROUP,
} from '../../../../lib/messages'
import { isEmptyString } from '../../../../lib/validators'
import { validateBearerToken } from '../../../../lib/auth_helpers'
import { findUserByToken } from '../../../../services/auth'

const handler = async (req, res) => {
  if (!['POST', 'GET'].includes(req.method)) {
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

  if (req.method === 'GET') {
    let userProductsGroups

    try {
      userProductsGroups = await UserProductsGroupsService.all(user.id)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { user })
        scope.setTag('section', 'UserProductsGroupsService.all')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCTS_GROUPS)
    }

    return responseJSON(res, 200, { products_groups: userProductsGroups })
  }

  const { title } = req.body

  if (isEmptyString(title)) {
    return responseJSON(res, 422, MISSING_USER_PRODUCTS_GROUP_TITLE)
  }

  const cleanTitle = title.toString().trim()

  try {
    const userProductsGroup = await UserProductsGroupsService.create(
      user.id,
      cleanTitle
    )

    return responseJSON(res, 201, {
      ...USER_PRODUCTS_GROUP_CREATED,
      location: '/products_groups/' + userProductsGroup.id,
    })
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, cleanTitle })
      scope.setTag('section', 'UserProductsGroupsService.create')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_CREATE_USER_PRODUCTS_GROUP)
  }
}

export default withSentry(handler)
