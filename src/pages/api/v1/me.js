import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { findUserByToken } from '../../../services/auth'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  FORBIDDEN,
} from '../../../lib/messages'
import { buildUserResponse, responseJSON } from '../../../lib/helpers'
import { validateUserToken } from '../../../lib/auth_helpers'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
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

  return responseJSON(res, 200, buildUserResponse(user))
}

export default withSentry(handler)
