import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import {
  findUserByToken,
  findUserByLoginAndPassword,
  updateUserPasswordAndToken,
} from '../../../../services/auth'
import { isEmptyString, isValidUUID } from '../../../../lib/validators'

import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  CURRENT_PASSWORD_IS_NOT_VALID,
  FORBIDDEN,
  MISSING_CURRENT_PASSWORD,
  MISSING_NEW_PASSWORD,
  MISSING_NEW_PASSWORD_CONFIRMATION,
  NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD,
  PASSWORDS_DO_NOT_MATCH,
  PASSWORD_IS_TOO_SHORT,
  UNABLE_TO_FIND_USER,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  UNABLE_TO_UPDATE_USER_PASSWORD_AND_TOKEN,
} from '../../../../lib/messages'
import { buildUserResponse, responseJSON } from '../../../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
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

  let userByToken

  try {
    userByToken = await findUserByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'findUserByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_TOKEN)
  }

  if (!userByToken) {
    return responseJSON(res, 403, FORBIDDEN)
  }

  const { current_password, new_password, new_password_confirmation } = req.body

  if (isEmptyString(current_password)) {
    return responseJSON(res, 400, MISSING_CURRENT_PASSWORD)
  }

  if (isEmptyString(new_password)) {
    return responseJSON(res, 400, MISSING_NEW_PASSWORD)
  }

  if (isEmptyString(new_password_confirmation)) {
    return responseJSON(res, 400, MISSING_NEW_PASSWORD_CONFIRMATION)
  }

  if (new_password !== new_password_confirmation) {
    return responseJSON(res, 422, PASSWORDS_DO_NOT_MATCH)
  }

  if (new_password.toString().length < 8) {
    return responseJSON(res, 422, PASSWORD_IS_TOO_SHORT)
  }

  if (new_password === current_password) {
    return responseJSON(
      res,
      422,
      NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD
    )
  }

  let user

  try {
    user = await findUserByLoginAndPassword(userByToken.login, current_password)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { login: user.login })
      scope.setTag('section', 'findUserByLoginAndPassword')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return responseJSON(res, 403, CURRENT_PASSWORD_IS_NOT_VALID)
  }

  try {
    user = await updateUserPasswordAndToken(user.id, new_password)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user })
      scope.setTag('section', 'updateUserPasswordAndToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_UPDATE_USER_PASSWORD_AND_TOKEN)
  }

  return responseJSON(res, 200, buildUserResponse(user))
}

export default withSentry(handler)
