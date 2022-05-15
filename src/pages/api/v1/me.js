import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { getUserByToken } from '../../../services'
import { checkToken } from '../../../lib/auth'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_GET_USER_BY_TOKEN,
  FORBIDDEN,
} from '../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json(METHOD_NOT_ALLOWED)
  }

  const token = checkToken(req, res)

  if (!token) {
    return
  }

  let user

  try {
    user = getUserByToken(token)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'getUserByToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_BY_TOKEN)
  }

  if (!user) {
    return res.status(403).json(FORBIDDEN)
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
