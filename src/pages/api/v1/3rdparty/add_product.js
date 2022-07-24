import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { responseJSON } from '../../../../lib/helpers'
import { findUserByApiKey } from '../../../../services/auth'
import { UsersService } from '../../../../services/users'
import { validateBearerToken } from '../../../../lib/auth_helpers'
import { addProductToUserUseCase } from '../../../../useCases/users/addProductToUser'
import {
  METHOD_NOT_ALLOWED,
  API_KEY_DOES_NOT_EXIST,
  UNABLE_TO_FIND_USER_BY_API_KEY,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
} from '../../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const tokenResult = validateBearerToken(req.headers)

  if (typeof tokenResult !== 'string') {
    return responseJSON(res, tokenResult.code, tokenResult.error)
  }

  const api_key = tokenResult

  let user

  try {
    user = await findUserByApiKey(api_key)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { api_key })
      scope.setTag('section', 'findUserByApiKey')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_API_KEY)
  }

  if (!user) {
    return responseJSON(res, 403, API_KEY_DOES_NOT_EXIST)
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

  const { url } = req.body
  const useCase = await addProductToUserUseCase({ user, url })

  return responseJSON(res, useCase.status, useCase.response)
}

export default withSentry(handler)
