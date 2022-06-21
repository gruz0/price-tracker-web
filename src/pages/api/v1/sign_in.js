import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import {
  findUserByLoginAndPassword,
  updateUserToken,
} from '../../../services/auth'
import { isEmptyString } from '../../../lib/validators'

import {
  METHOD_NOT_ALLOWED,
  MISSING_LOGIN,
  MISSING_PASSWORD,
  UNABLE_TO_FIND_USER,
  INVALID_CREDENTIALS,
  UNABLE_TO_UPDATE_USER_TOKEN,
} from '../../../lib/messages'
import { buildUserResponse, responseJSON } from '../../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const { login, password } = req.body

  if (isEmptyString(login)) {
    return responseJSON(res, 400, MISSING_LOGIN)
  }

  if (isEmptyString(password)) {
    return responseJSON(res, 400, MISSING_PASSWORD)
  }

  let user

  const cleanLogin = login.toString().toLowerCase().trim()

  try {
    user = await findUserByLoginAndPassword(cleanLogin, password)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { cleanLogin })
      scope.setTag('section', 'findUserByLoginAndPassword')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return responseJSON(res, 403, INVALID_CREDENTIALS)
  }

  try {
    user = await updateUserToken(user.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user })
      scope.setTag('section', 'updateUserToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_UPDATE_USER_TOKEN)
  }

  return responseJSON(res, 200, buildUserResponse(user))
}

export default withSentry(handler)
