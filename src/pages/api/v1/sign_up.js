import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { isUserExists, createUser } from '../../../services/auth'
import { isEmptyString, isNotDefined } from '../../../lib/validators'

import {
  LOGIN_IS_INVALID,
  METHOD_NOT_ALLOWED,
  MISSING_LOGIN,
  MISSING_PASSWORD,
  PASSWORD_IS_TOO_SHORT,
  UNABLE_TO_CHECK_USER_EXISTENCE,
  UNABLE_TO_CREATE_NEW_USER,
  USER_ALREADY_EXISTS,
} from '../../../lib/messages'
import { responseJSON } from '../../../lib/helpers'
import { newUserRegistration } from '../../../services/telegram'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const { login, password } = req.body

  if (isEmptyString(login)) {
    return responseJSON(res, 400, MISSING_LOGIN)
  }

  if (isNotDefined(password)) {
    return responseJSON(res, 400, MISSING_PASSWORD)
  }

  const cleanLogin = login.toLowerCase().trim()

  if (!cleanLogin.match(/^[a-z0-9\-_]+$/i)) {
    return responseJSON(res, 422, LOGIN_IS_INVALID)
  }

  // TODO: Добавить проверку сложности пароля
  // TODO: Добавить проверку в haveibeenpwned: https://github.com/mxschmitt/react-have-i-been-pwned/blob/master/index.js
  if (password.toString().length < 8) {
    return responseJSON(res, 422, PASSWORD_IS_TOO_SHORT)
  }

  let userExists

  try {
    userExists = isUserExists(cleanLogin)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { cleanLogin })
      scope.setTag('section', 'isUserExists')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_CHECK_USER_EXISTENCE)
  }

  if (userExists) {
    return responseJSON(res, 409, USER_ALREADY_EXISTS)
  }

  let user

  try {
    user = createUser(cleanLogin, password)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { cleanLogin })
      scope.setTag('section', 'createUser')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_CREATE_NEW_USER)
  }

  try {
    newUserRegistration(user.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user })
      scope.setTag('section', 'newUserRegistration')
      Sentry.captureException(err)
    })
  }

  return responseJSON(res, 200, {
    token: user.token,
    user: {
      id: user.id,
      login: user.login,
    },
  })
}

export default withSentry(handler)
