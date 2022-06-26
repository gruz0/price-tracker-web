import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { findUserByTelegramAccount } from '../../../../../../services/auth'
import { isEmptyString, isValidUUID } from '../../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  UNABLE_TO_FIND_BOT_BY_TOKEN,
  BOT_DOES_NOT_EXIST,
  MISSING_TELEGRAM_ACCOUNT,
  UNABLE_TO_FIND_USER_BY_TELEGRAM_ACCOUNT,
  INVALID_URL,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  UNABLE_TO_USE_SHOP_ORIGINAL_DOMAIN,
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
import { findBotByToken } from '../../../../../../services/bots'
import {
  calculateHash,
  detectURL,
  isValidUrl,
  responseJSON,
} from '../../../../../../lib/helpers'
import {
  findShopByURL,
  isSingleProductURL,
  replaceHostWithOriginalShopDomain,
} from '../../../../../../services/shops'
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

  if (!isValidUUID(token)) {
    return responseJSON(res, 400, INVALID_TOKEN_UUID)
  }

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

  const { url } = req.body

  if (isEmptyString(url)) {
    return responseJSON(res, 422, MISSING_URL)
  }

  const detectedURLs = detectURL(url)

  if (
    !detectedURLs ||
    detectedURLs.length === 0 ||
    !isValidUrl(detectedURLs[0])
  ) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { url, detectedURLs })
      scope.setTag('section', 'detectURL')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(
        new Error(`Не удалось найти ссылки от пользователя через бота: ${url}`)
      )
    })

    return responseJSON(res, 422, INVALID_URL)
  }

  const detectedURL = detectedURLs[0]

  let shop

  try {
    shop = findShopByURL(detectedURL)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { detectedURL })
      scope.setTag('section', 'findShopByURL')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          `Пользователь отправил ссылку на неподдерживаемый магазин через бота: ${url}`
        )
      )
    })
  }

  if (!shop) {
    return responseJSON(res, 422, SHOP_IS_NOT_SUPPORTED_YET)
  }

  let cleanURL

  try {
    cleanURL = replaceHostWithOriginalShopDomain(shop, detectedURL)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { shop, detectedURL })
      scope.setTag('section', 'replaceHostWithOriginalShopDomain')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_USE_SHOP_ORIGINAL_DOMAIN)
  }

  try {
    if (!isSingleProductURL(shop.name, cleanURL)) {
      return responseJSON(res, 422, IT_IS_NOT_A_SINGLE_PRODUCT_URL)
    }
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { shop, cleanURL })
      scope.setTag('section', 'isSingleProductURL')
      scope.setTag('bot_id', botId)
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          `Пользователь отправил ссылку на неподдерживаемую страницу через бота: ${url}`
        )
      )
    })
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
    product = await findProductByURLHash(urlHash)
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
      await addNewProductToQueue(newProductArgs)
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

  let userProduct

  try {
    userProduct = await getUserProduct(user.id, product.id)
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

  let productLatestPrice = null

  try {
    productLatestPrice = await getProductLatestValidPriceFromHistory(product.id)
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

  try {
    await addProductToUser(user.id, product.id, productLatestPrice)
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
