import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import {
  findUser,
  findUserByTelegramAccount,
  updateUserTelegramAccount,
} from '../../../../../../services/auth'
import { isEmptyString } from '../../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_GET_BOT_BY_TOKEN,
  BOT_DOES_NOT_EXIST,
  MISSING_USER_ID,
  UNABLE_TO_FIND_USER,
  USER_DOES_NOT_EXIST,
  MISSING_TELEGRAM_ACCOUNT,
  USER_ALREADY_HAS_TELEGRAM_ACCOUNT,
  USER_WITH_TELEGRAM_ACCOUNT_ALREADY_EXISTS,
  UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT,
  UNABLE_TO_UPDATE_USER_TELEGRAM_ACCOUNT,
} from '../../../../../../lib/messages'
import { getBotByToken } from '../../../../../../services/bots'
import { responseJSON } from '../../../../../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'PUT') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const { authorization } = req.headers

  if (isEmptyString(authorization)) {
    return responseJSON(res, 401, MISSING_AUTHORIZATION_HEADER)
  }

  if (!authorization.startsWith('Bearer ')) {
    return responseJSON(res, 401, MISSING_BEARER_KEY)
  }

  const token = authorization.replace(/^Bearer/, '').trim()

  if (token.length === 0) {
    return responseJSON(res, 401, MISSING_TOKEN)
  }

  let bot

  try {
    bot = getBotByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'getBotByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_BOT_BY_TOKEN)
  }

  if (!bot) {
    return responseJSON(res, 404, BOT_DOES_NOT_EXIST)
  }

  const botId = bot.id

  const { user_id: userId } = req.query

  if (isEmptyString(userId)) {
    return responseJSON(res, 400, MISSING_USER_ID)
  }

  let user

  try {
    user = findUser(userId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { userId })
      scope.setTag('section', 'findUser')
      scope.setTag('bot_id', botId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return responseJSON(res, 404, USER_DOES_NOT_EXIST)
  }

  const { telegram_account } = req.body

  if (isEmptyString(telegram_account)) {
    return responseJSON(res, 400, MISSING_TELEGRAM_ACCOUNT)
  }

  if (!isEmptyString(user.telegram_account)) {
    return responseJSON(res, 400, USER_ALREADY_HAS_TELEGRAM_ACCOUNT)
  }

  const clearTelegramAccount = telegram_account.toString().trim().toLowerCase()

  let userByTelegramAccount

  try {
    userByTelegramAccount = findUserByTelegramAccount(clearTelegramAccount)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, clearTelegramAccount })
      scope.setTag('section', 'findUserByTelegramAccount')
      scope.setTag('bot_id', botId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT)
  }

  if (userByTelegramAccount) {
    return responseJSON(res, 400, USER_WITH_TELEGRAM_ACCOUNT_ALREADY_EXISTS)
  }

  try {
    user = updateUserTelegramAccount(user.id, clearTelegramAccount)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, clearTelegramAccount })
      scope.setTag('section', 'updateUserTelegramAccount')
      scope.setTag('bot_id', botId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_UPDATE_USER_TELEGRAM_ACCOUNT)
  }

  return responseJSON(res, 200, { id: user.id, login: user.login })
}

export default withSentry(handler)
