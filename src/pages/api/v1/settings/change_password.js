import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { checkToken } from '../../../../lib/auth'
import {
  getUserByToken,
  findUserByLoginAndPassword,
  updateUserPasswordAndToken,
} from '../../../../services/auth'
import { isEmptyString } from '../../../../lib/validators'

import {
  CURRENT_PASSWORD_IS_NOT_VALID,
  FORBIDDEN,
  METHOD_NOT_ALLOWED,
  MISSING_CURRENT_PASSWORD,
  MISSING_NEW_PASSWORD,
  MISSING_NEW_PASSWORD_CONFIRMATION,
  NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD,
  PASSWORDS_DO_NOT_MATCH,
  PASSWORD_IS_TOO_SHORT,
  UNABLE_TO_FIND_USER,
  UNABLE_TO_GET_USER_BY_TOKEN,
  UNABLE_TO_UPDATE_USER_PASSWORD_AND_TOKEN,
} from '../../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json(METHOD_NOT_ALLOWED)
  }

  const token = checkToken(req, res)

  if (!token) {
    return
  }

  let userByToken

  try {
    userByToken = getUserByToken(token)
  } catch (err) {
    console.error({ err })
    Sentry.withScope(function (scope) {
      scope.setTag('section', 'getUserByToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_BY_TOKEN)
  }

  if (!userByToken) {
    return res.status(403).json(FORBIDDEN)
  }

  const { current_password, new_password, new_password_confirmation } = req.body

  if (isEmptyString(current_password)) {
    return res.status(422).json(MISSING_CURRENT_PASSWORD)
  }

  if (isEmptyString(new_password)) {
    return res.status(422).json(MISSING_NEW_PASSWORD)
  }

  if (isEmptyString(new_password_confirmation)) {
    return res.status(422).json(MISSING_NEW_PASSWORD_CONFIRMATION)
  }

  if (new_password !== new_password_confirmation) {
    return res.status(422).json(PASSWORDS_DO_NOT_MATCH)
  }

  if (new_password.toString().length < 8) {
    return res.status(422).json(PASSWORD_IS_TOO_SHORT)
  }

  if (new_password === current_password) {
    return res
      .status(422)
      .json(NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD)
  }

  let user

  try {
    user = findUserByLoginAndPassword(userByToken.login, current_password)
  } catch (err) {
    console.error({ err })
    Sentry.withScope(function (scope) {
      scope.setContext('args', { login: user.login })
      scope.setTag('section', 'findUserByLoginAndPassword')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return res.status(422).json(CURRENT_PASSWORD_IS_NOT_VALID)
  }

  try {
    user = updateUserPasswordAndToken(user.id, new_password)
  } catch (err) {
    console.error({ err })
    Sentry.withScope(function (scope) {
      scope.setContext('args', { user })
      scope.setTag('section', 'updateUserPasswordAndToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_UPDATE_USER_PASSWORD_AND_TOKEN)
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
