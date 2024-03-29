import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import {
  findUserById,
  findUserByTelegramAccount,
  updateUserTelegramAccount,
} from '../../../../../../services/auth'
import { isEmptyString, isValidUUID } from '../../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_FIND_BOT_BY_TOKEN,
  BOT_DOES_NOT_EXIST,
  MISSING_USER_ID,
  INVALID_USER_UUID,
  UNABLE_TO_FIND_USER,
  USER_DOES_NOT_EXIST,
  MISSING_TELEGRAM_ACCOUNT,
  USER_WITH_TELEGRAM_ACCOUNT_ALREADY_EXISTS,
  UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT,
  UNABLE_TO_UPDATE_USER_TELEGRAM_ACCOUNT,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
} from '../../../../../../lib/messages'
import { findBotByToken } from '../../../../../../services/bots'
import { responseJSON } from '../../../../../../lib/helpers'
import { validateBearerToken } from '../../../../../../lib/auth_helpers'
import { UsersService } from '../../../../../../services/users'

const handler = async (req, res) => {
  if (req.method !== 'PUT') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const tokenResult = validateBearerToken(req.headers)

  if (typeof tokenResult !== 'string') {
    return responseJSON(res, tokenResult.code, tokenResult.error)
  }

  const token = tokenResult

  let bot

  try {
    bot = await findBotByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'findBotByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_BOT_BY_TOKEN)
  }

  if (!bot) {
    return responseJSON(res, 404, BOT_DOES_NOT_EXIST)
  }

  const botId = bot.id

  const { user_id: userId } = req.query

  if (isEmptyString(userId)) {
    return responseJSON(res, 400, MISSING_USER_ID)
  }

  if (!isValidUUID(userId)) {
    return responseJSON(res, 400, INVALID_USER_UUID)
  }

  let user

  try {
    user = await findUserById(userId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { userId })
      scope.setTag('section', 'findUserById')
      scope.setTag('bot_id', botId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return responseJSON(res, 404, USER_DOES_NOT_EXIST)
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

  const { telegram_account } = req.body

  if (isEmptyString(telegram_account)) {
    return responseJSON(res, 400, MISSING_TELEGRAM_ACCOUNT)
  }

  const clearTelegramAccount = telegram_account.toString().trim().toLowerCase()

  let userByTelegramAccount

  try {
    userByTelegramAccount = await findUserByTelegramAccount(
      clearTelegramAccount
    )
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
    if (userByTelegramAccount.id !== user.id) {
      return responseJSON(res, 400, USER_WITH_TELEGRAM_ACCOUNT_ALREADY_EXISTS)
    }

    if (userByTelegramAccount.telegram_account === user.telegram_account) {
      return responseJSON(res, 200, {})
    }
  }

  try {
    user = await updateUserTelegramAccount(user.id, clearTelegramAccount)
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

  return responseJSON(res, 200, {
    id: user.id,
    login: user.login,
    telegram_account: user.telegram_account,
  })
}

export default withSentry(handler)
