import * as Sentry from '@sentry/nextjs'
import { addProductToUser } from '../../../services/users'
import { UserProductsService } from '../../../services/user_products_service'
import { ProductsService } from '../../../services/products_service'
import {
  addNewProductToQueue,
  findProductByURLHash,
} from '../../../services/products'
import {
  findShopByURL,
  isSingleProductURL,
  replaceHostWithOriginalShopDomain,
} from '../../../services/shops'
import { calculateHash, detectURL, isValidUrl } from '../../../lib/helpers'
import { isEmptyString, isValidUser } from '../../../lib/validators'
import {
  INVALID_URL,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  MISSING_URL,
  PRODUCT_ADDED_TO_QUEUE,
  PRODUCT_ADDED_TO_USER,
  SHOP_IS_NOT_SUPPORTED_YET,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
  UNABLE_TO_CALCULATE_URL_HASH,
  UNABLE_TO_CHANGE_PRODUCT_STATUS_TO_ACTIVE,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  UNABLE_TO_GET_LAST_PRODUCT_HISTORY,
  UNABLE_TO_GET_USER_PRODUCT,
  UNABLE_TO_USE_SHOP_ORIGINAL_DOMAIN,
  YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
} from '../../../lib/messages'

export const addProductToUserUseCase = async ({
  user,
  url,
  extraSentryTags = {},
}) => {
  if (!isValidUser(user)) {
    throw new Error('Некорректный объект user')
  }

  const sentryTags = Object.entries(extraSentryTags)

  if (typeof url !== 'string' || isEmptyString(url)) {
    return {
      status: 422,
      response: MISSING_URL,
    }
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
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(
        new Error(`Не удалось найти ссылки от пользователя: ${url}`)
      )
    })

    return {
      status: 422,
      response: INVALID_URL,
    }
  }

  const detectedURL = detectedURLs[0]

  let shop

  try {
    shop = findShopByURL(detectedURL)
  } catch (err) {
    // TODO: Здесь надо сохранять в базу данных ссылку на неподдерживаемый адрес
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { detectedURL })
      scope.setTag('section', 'findShopByURL')
      scope.setUser({ user })
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(
        new Error(
          `Пользователь отправил ссылку на неподдерживаемый магазин: ${url}`
        )
      )
    })
  }

  if (!shop) {
    return {
      status: 422,
      response: SHOP_IS_NOT_SUPPORTED_YET,
    }
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
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_USE_SHOP_ORIGINAL_DOMAIN,
    }
  }

  try {
    if (!isSingleProductURL(shop.name, cleanURL)) {
      return {
        status: 422,
        response: IT_IS_NOT_A_SINGLE_PRODUCT_URL,
      }
    }
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { shop, cleanURL })
      scope.setTag('section', 'isSingleProductURL')
      scope.setUser({ user })
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(
        new Error(
          `Пользователь отправил ссылку на неподдерживаемую страницу: ${url}`
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
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_CALCULATE_URL_HASH,
    }
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
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
    }
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
        sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
        Sentry.captureException(err)
      })

      return {
        status: 500,
        response: UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE,
      }
    }

    return {
      status: 201,
      response: PRODUCT_ADDED_TO_QUEUE,
    }
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
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_GET_USER_PRODUCT,
    }
  }

  if (userProduct) {
    return {
      status: 200,
      response: {
        ...YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
        location: `/products/${product.id}`,
      },
    }
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
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_GET_LAST_PRODUCT_HISTORY,
    }
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
      return {
        status: 500,
        response:
          UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
      }
    }

    productPrice = productRecentPrice
  }

  if (product.status === 'hold') {
    try {
      await ProductsService.moveToActive(product.id)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { product })
        scope.setTag('section', 'ProductsService.moveToActive')
        scope.setUser({ user })
        sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
        Sentry.captureException(err)
      })

      return {
        status: 500,
        response: UNABLE_TO_CHANGE_PRODUCT_STATUS_TO_ACTIVE,
      }
    }
  }

  try {
    await addProductToUser(user.id, product.id, productPrice)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product, productPrice })
      scope.setTag('section', 'addProductToUser')
      scope.setUser({ user })
      sentryTags.forEach((tag) => scope.setTag(tag[0], tag[1]))
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
    }
  }

  return {
    status: 201,
    response: {
      ...PRODUCT_ADDED_TO_USER,
      location: `/products/${product.id}`,
    },
  }
}
