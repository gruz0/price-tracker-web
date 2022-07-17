import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { responseJSON } from '../../../../lib/helpers'
import { findUserByApiKey } from '../../../../services/auth'
import {
  METHOD_NOT_ALLOWED,
  API_KEY_DOES_NOT_EXIST,
  UNABLE_TO_FIND_USER_BY_API_KEY,
  MISSING_VERSION,
  MISSING_MESSAGE,
  MISSING_APP,
  ERROR_REPORT_CREATED,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
} from '../../../../lib/messages'
import { isEmptyString } from '../../../../lib/validators'
import { validateBearerToken } from '../../../../lib/auth_helpers'
import { UsersService } from '../../../../services/users'

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

  const { app, version, message, meta } = req.body

  if (isEmptyString(app)) {
    return responseJSON(res, 422, MISSING_APP)
  }

  if (isEmptyString(version)) {
    return responseJSON(res, 422, MISSING_VERSION)
  }

  if (isEmptyString(message)) {
    return responseJSON(res, 422, MISSING_MESSAGE)
  }

  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { app, version, message, meta })
      scope.setUser({
        id: user.id,
        login: user.login,
      })
      Sentry.captureException(
        new Error(`Получен отчёт об ошибке из приложения ${app} (${version})`)
      )
    })
  }

  return responseJSON(res, 201, {
    ...ERROR_REPORT_CREATED,
    report: {
      app,
      version,
      message,
      meta,
    },
  })
}

export default withSentry(handler)
