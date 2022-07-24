import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { responseJSON } from '../../../../lib/helpers'
import { findUserByToken } from '../../../../services/auth'
import {
  getUserProductsWithActualState,
  UsersService,
} from '../../../../services/users'
import { validateBearerToken } from '../../../../lib/auth_helpers'
import { addProductToUserUseCase } from '../../../../useCases/users/addProductToUser'
import {
  METHOD_NOT_ALLOWED,
  FORBIDDEN,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
} from '../../../../lib/messages'

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

  switch (req.method) {
    case 'GET': {
      let products

      try {
        products = await getUserProductsWithActualState(user.id)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { user })
          scope.setTag('section', 'getUserProductsWithActualState')
          scope.setUser({ user })
          Sentry.captureException(err)
        })

        return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES)
      }

      return responseJSON(res, 200, { products: products })
    }
    case 'POST': {
      const { url } = req.body
      const useCase = await addProductToUserUseCase({ user, url })

      return responseJSON(res, useCase.status, useCase.response)
    }
  }
}

export default withSentry(handler)
