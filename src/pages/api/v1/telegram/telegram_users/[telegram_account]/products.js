import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { findUserByTelegramAccount } from '../../../../../../services/auth'
import { isEmptyString } from '../../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_GET_BOT_BY_TOKEN,
  BOT_DOES_NOT_EXIST,
  UNABLE_TO_ADD_BOT_LOG,
  MISSING_TELEGRAM_ACCOUNT,
  UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT,
  INVALID_URL,
  UNABLE_TO_CLEAN_URL,
  UNABLE_TO_CALCULATE_URL_HASH,
  MISSING_URL,
  SHOP_IS_NOT_SUPPORTED_YET,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE,
  PRODUCT_ADDED_TO_QUEUE,
  UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  REDIRECT_TO_PRODUCT_PAGE,
  UNABLE_TO_GET_USER_PRODUCT,
  PRODUCT_ADDED_TO_USER,
  USER_DOES_NOT_EXIST,
} from '../../../../../../lib/messages'
import { getBotByToken, addBotLog } from '../../../../../../services/bots'
import {
  buildCleanURL,
  calculateHash,
  detectURL,
  isShopSupported,
  isValidUrl,
  responseJSON,
} from '../../../../../../lib/helpers'
import {
  addNewProductToQueue,
  findProductByURLHash,
  getProductLatestValidPriceFromHistory,
} from '../../../../../../services/products'
import {
  addProductToUser,
  getUserProduct,
} from '../../../../../../services/users'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
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

  const logArgs = {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
  }

  try {
    addBotLog(bot, logArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { bot, logArgs })
      scope.setTag('section', 'addBotLog')
      scope.setTag('bot_id', botId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_ADD_BOT_LOG)
  }

  const { telegram_account: telegramAccount } = req.query

  if (isEmptyString(telegramAccount)) {
    return responseJSON(res, 400, MISSING_TELEGRAM_ACCOUNT)
  }

  const clearTelegramAccount = telegramAccount.toString().trim().toLowerCase()

  let user

  try {
    user = findUserByTelegramAccount(clearTelegramAccount)
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

  const { url } = req.body

  if (isEmptyString(url)) {
    return responseJSON(res, 422, MISSING_URL)
  }

  const detectedURLs = detectURL(url)

  if (!detectedURLs || detectedURLs.length === 0) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { url, detectedURLs })
      scope.setTag('section', 'detectURL')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          'Не удалось найти ссылки от пользователя через форму добавления товара'
        )
      )
    })

    return responseJSON(res, 422, INVALID_URL)
  }

  const detectedURL = detectedURLs[0]

  if (!isValidUrl(detectedURL)) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { detectedURL })
      scope.setTag('section', 'isValidUrl')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          'Пользователь отправил некорректный URL через форму добавления товара'
        )
      )
    })

    return responseJSON(res, 422, INVALID_URL)
  }

  let cleanURL

  try {
    cleanURL = buildCleanURL(detectedURL)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { detectedURL })
      scope.setTag('section', 'buildCleanURL')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_CLEAN_URL)
  }

  if (!isShopSupported(cleanURL)) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { cleanURL })
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          'Пользователь отправил ссылку на неподдерживаемый магазин через форму добавления товара'
        )
      )
    })

    return responseJSON(res, 400, SHOP_IS_NOT_SUPPORTED_YET)
  }

  let urlHash

  try {
    urlHash = calculateHash(cleanURL)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { cleanURL })
      scope.setTag('section', 'calculateHash')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_CALCULATE_URL_HASH)
  }

  let product

  try {
    product = findProductByURLHash(urlHash)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { urlHash, cleanURL })
      scope.setTag('section', 'findProductByURLHash')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_PRODUCT_BY_URL_HASH)
  }

  if (!product) {
    const newProductArgs = {
      url_hash: urlHash,
      url: cleanURL,
      requested_by: user.id,
    }

    try {
      addNewProductToQueue(newProductArgs)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { newProductArgs })
        scope.setTag('section', 'addNewProductToQueue')
        scope.setTag('bot_id', botId)
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE)
    }

    return responseJSON(res, 201, PRODUCT_ADDED_TO_QUEUE)
  }

  let productLatestPrice = null

  try {
    productLatestPrice = getProductLatestValidPriceFromHistory(product.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { product })
      scope.setTag('section', 'getProductLatestValidPriceFromHistory')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(
      res,
      500,
      UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY
    )
  }

  if (!productLatestPrice || productLatestPrice === 0) {
    return responseJSON(
      res,
      400,
      UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE
    )
  }

  let userProduct

  try {
    userProduct = getUserProduct(user.id, product.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product })
      scope.setTag('section', 'getUserProduct')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCT)
  }

  if (userProduct) {
    return responseJSON(res, 200, {
      ...REDIRECT_TO_PRODUCT_PAGE,
      location: '/products/' + product.id,
    })
  }

  try {
    addProductToUser(user.id, product.id, productLatestPrice)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product })
      scope.setTag('section', 'addProductToUser')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER)
  }

  return responseJSON(res, 201, {
    ...PRODUCT_ADDED_TO_USER,
    location: '/products/' + product.id,
  })
}

export default withSentry(handler)