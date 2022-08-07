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
import { findProductByURLHash } from '../../../../services/products'
import { findUserByApiKey } from '../../../../services/auth'
import {
  METHOD_NOT_ALLOWED,
  API_KEY_DOES_NOT_EXIST,
  UNABLE_TO_FIND_USER_BY_TOKEN,
  UNABLE_TO_GET_USER_PRODUCT,
  MISSING_URL,
  INVALID_URL,
  SHOP_IS_NOT_SUPPORTED_YET,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  UNABLE_TO_USE_SHOP_ORIGINAL_DOMAIN,
  UNABLE_TO_CALCULATE_URL_HASH,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY,
  PRODUCT_EXISTS_AND_CAN_BE_ADDED_TO_YOUR_LIST,
  URL_IS_SUPPORTED_AND_CAN_BE_ADDED_TO_YOUR_LIST,
  YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
  UNABLE_TO_UPDATE_USER_LAST_ACTIVITY,
  UNABLE_TO_GET_LAST_PRODUCT_HISTORY,
} from '../../../../lib/messages'
import { isEmptyString } from '../../../../lib/validators'
import { UserProductsService } from '../../../../services/user_products_service'
import { validateBearerToken } from '../../../../lib/auth_helpers'
import { UsersService } from '../../../../services/users'
import { ProductsService } from '../../../../services/products_service'

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

    return responseJSON(res, 500, UNABLE_TO_FIND_USER_BY_TOKEN)
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
          `Пользователь отправил ссылку на неподдерживаемую страницу через приложение: ${url}`
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
    return responseJSON(
      res,
      200,
      URL_IS_SUPPORTED_AND_CAN_BE_ADDED_TO_YOUR_LIST
    )
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

  if (!userProduct) {
    return responseJSON(res, 200, PRODUCT_EXISTS_AND_CAN_BE_ADDED_TO_YOUR_LIST)
  }

  let productRecentHistory

  try {
    productRecentHistory = await ProductsService.getRecentHistory(product.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { product })
      scope.setTag('section', 'ProductsService.getRecentHistory')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_LAST_PRODUCT_HISTORY)
  }

  let productPrice = 0

  if (productRecentHistory) {
    const {
      price: productRecentPrice,
      status: productRecentStatus,
      in_stock: productRecentInStock,
    } = productRecentHistory

    if (
      productRecentStatus === 'ok' &&
      productRecentInStock &&
      productRecentPrice === 0
    ) {
      return responseJSON(
        res,
        500,
        UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY
      )
    }

    productPrice = productRecentPrice
  }

  return responseJSON(res, 200, {
    ...YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
    product: {
      latest_price: productPrice,
      my_price: userProduct.price,
      has_discount: productPrice < userProduct.price,
      my_benefit: userProduct.price - productPrice,
      location: `/products/${product.id}`,
    },
  })
}

export default withSentry(handler)
