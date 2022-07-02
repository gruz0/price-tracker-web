import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import {
  isValidUrl,
  calculateHash,
  responseJSON,
  detectURL,
} from '../../../../lib/helpers'
import {
  findShopByURL,
  isSingleProductURL,
  replaceHostWithOriginalShopDomain,
} from '../../../../services/shops'

import {
  findProductByURLHash,
  addNewProductToQueue,
  getProductLatestValidPriceFromHistory,
} from '../../../../services/products'
import { findUserByApiKey } from '../../../../services/auth'
import { addProductToUser, getUserProduct } from '../../../../services/users'

import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_API_KEY,
  INVALID_API_KEY_UUID,
  API_KEY_DOES_NOT_EXIST,
  REDIRECT_TO_PRODUCT_PAGE,
  UNABLE_TO_GET_USER_PRODUCT,
  INVALID_URL,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  UNABLE_TO_USE_SHOP_ORIGINAL_DOMAIN,
  UNABLE_TO_CALCULATE_URL_HASH,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  PRODUCT_ADDED_TO_QUEUE,
  UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
  SHOP_IS_NOT_SUPPORTED_YET,
  MISSING_URL,
  UNABLE_TO_FIND_USER_BY_API_KEY,
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
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          `Не удалось найти ссылки от пользователя через стороннее приложение: ${url}`
        )
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
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          `Пользователь отправил ссылку на неподдерживаемый магазин через стороннее приложение: ${url}`
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
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          `Пользователь отправил ссылку на неподдерживаемую страницу через стороннее приложение: ${url}`
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
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER)
  }

  return responseJSON(res, 201, {
    ...REDIRECT_TO_PRODUCT_PAGE,
    location: '/products/' + product.id,
  })
}

export default withSentry(handler)