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
import { findUserByToken } from '../../../../services/auth'
import {
  addProductToUser,
  getUserProductsWithActualState,
} from '../../../../services/users'

import {
  METHOD_NOT_ALLOWED,
  FORBIDDEN,
  REDIRECT_TO_PRODUCT_PAGE,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  UNABLE_TO_GET_USER_PRODUCT,
  UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES,
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
} from '../../../../lib/messages'
import { isEmptyString } from '../../../../lib/validators'
import { UserProductsService } from '../../../../services/user_products_service'
import { validateUserToken } from '../../../../lib/auth_helpers'

const handler = async (req, res) => {
  if (!['POST', 'GET'].includes(req.method)) {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const tokenResult = validateUserToken(req.headers)

  if (typeof tokenResult !== 'string') {
    return responseJSON(res, tokenResult.code, tokenResult.error)
  }

  const token = tokenResult

  let user

  try {
    user = await findUserByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'findUserByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_TOKEN)
  }

  if (!user) {
    return responseJSON(res, 403, FORBIDDEN)
  }

  if (req.method === 'GET') {
    let products

    try {
      products = await getUserProductsWithActualState(user.id)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { user })
        scope.setTag('section', 'getUserProductsWithActualState')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES)
    }

    return responseJSON(res, 200, { products: products })
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
          `Не удалось найти ссылки от пользователя через форму добавления товара: ${url}`
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
          `Пользователь отправил ссылку на неподдерживаемый магазин через форму добавления товара: ${url}`
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
          `Пользователь отправил ссылку на неподдерживаемую страницу через форму добавления товара: ${url}`
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
    userProduct = await UserProductsService.getByUserIdAndProductId(
      user.id,
      product.id
    )
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product })
      scope.setTag('section', 'UserProductsService.getByUserIdAndProductId')
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
