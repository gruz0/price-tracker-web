import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'
import { findUserByTelegramAccount } from '../../../../../../services/auth'
import { isEmptyString } from '../../../../../../lib/validators'
import { findBotByToken } from '../../../../../../services/bots'
import { responseJSON } from '../../../../../../lib/helpers'
import { UsersService } from '../../../../../../services/users'
import { validateBearerToken } from '../../../../../../lib/auth_helpers'
import { addProductToUserUseCase } from '../../../../../../useCases/users/addProductToUser'
import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_FIND_BOT_BY_TOKEN,
  BOT_DOES_NOT_EXIST,
  MISSING_TELEGRAM_ACCOUNT,
  UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT,
  USER_DOES_NOT_EXIST,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
} from '../../../../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
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

  const { telegram_account: telegramAccount } = req.query

  if (isEmptyString(telegramAccount)) {
    return responseJSON(res, 400, MISSING_TELEGRAM_ACCOUNT)
  }

  const clearTelegramAccount = telegramAccount.toString().trim().toLowerCase()

  let user

  try {
    user = await findUserByTelegramAccount(clearTelegramAccount)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { clearTelegramAccount })
      scope.setTag('section', 'findUserByTelegramAccount')
      scope.setTag('bot_id', botId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT)
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

  const { url } = req.body
  const extraSentryTags = {
    bot_id: botId,
  }
  const useCase = await addProductToUserUseCase({ user, url, extraSentryTags })

  return responseJSON(res, useCase.status, useCase.response)
}

export default withSentry(handler)
