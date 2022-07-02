import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { responseJSON } from '../../../../lib/helpers'
import { findUserByApiKey } from '../../../../services/auth'

import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_API_KEY,
  INVALID_API_KEY_UUID,
  API_KEY_DOES_NOT_EXIST,
  UNABLE_TO_FIND_USER_BY_API_KEY,
  MISSING_VERSION,
  MISSING_MESSAGE,
  MISSING_APP,
  ERROR_REPORT_CREATED,
} from '../../../../lib/messages'
import { isEmptyString, isValidUUID } from '../../../../lib/validators'

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

  const api_key = authorization.replace(/^Bearer /, '').trim()

  if (api_key.length === 0) {
    return responseJSON(res, 401, MISSING_API_KEY)
  }

  if (!isValidUUID(api_key)) {
    return responseJSON(res, 400, INVALID_API_KEY_UUID)
  }

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
