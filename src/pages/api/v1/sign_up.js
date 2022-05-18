import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { isUserExists, createUser } from '../../../services/auth'
import { isEmptyString, isNotDefined } from '../../../lib/validators'

import {
  METHOD_NOT_ALLOWED,
  MISSING_LOGIN,
  MISSING_PASSWORD,
  PASSWORD_IS_TOO_SHORT,
  UNABLE_TO_CHECK_USER_EXISTENCE,
  UNABLE_TO_CREATE_NEW_USER,
  USER_ALREADY_EXISTS,
} from '../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json(METHOD_NOT_ALLOWED)
  }

  const { login, password } = req.body

  if (isEmptyString(login)) {
    return res.status(422).json(MISSING_LOGIN)
  }

  if (isNotDefined(password)) {
    return res.status(422).json(MISSING_PASSWORD)
  }

  // TODO: Добавить проверку сложности пароля
  // TODO: Добавить проверку в haveibeenpwned: https://github.com/mxschmitt/react-have-i-been-pwned/blob/master/index.js
  if (password.toString().length < 8) {
    return res.status(422).json(PASSWORD_IS_TOO_SHORT)
  }

  let userExists

  try {
    userExists = isUserExists(login)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { login })
      scope.setTag('section', 'isUserExists')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_CHECK_USER_EXISTENCE)
  }

  if (userExists) {
    return res.status(422).json(USER_ALREADY_EXISTS)
  }

  let user

  try {
    user = createUser(login, password)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { login })
      scope.setTag('section', 'createUser')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_CREATE_NEW_USER)
  }

  return res.status(200).json({
    token: user.token,
    user: {
      id: user.id,
      login: user.login,
    },
  })
}

export default withSentry(handler)
