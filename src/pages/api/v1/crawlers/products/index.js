import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { isEmptyString } from '../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_GET_PRODUCTS_WITH_OUTDATED_PRICE,
  UNABLE_TO_GET_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
  UNABLE_TO_ADD_CRAWLER_LOG,
  MISSING_REQUESTED_BY,
  MISSING_URL_HASH,
  MISSING_SHOP,
  MISSING_URL,
  MISSING_STATUS,
  UNABLE_TO_FIND_USER,
  USER_DOES_NOT_EXIST,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  UNABLE_TO_CREATE_NEW_PRODUCT,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY,
  UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE,
  UNABLE_TO_MOVE_PRODUCT_FROM_QUEUE_TO_CHANGE_LOCATION,
} from '../../../../../lib/messages'
import {
  getCrawlerByToken,
  addCrawlerLog,
  getOutdatedProducts,
  removeNewProductFromQueue,
  createProduct,
  moveProductFromQueueToChangeLocation,
} from '../../../../../services/crawlers'
import { findUser } from '../../../../../services/auth'
import {
  findProductByURLHash,
  getProductLatestValidPriceFromHistory,
} from '../../../../../services/products'
import { addProductToUser } from '../../../../../services/users'
import { responseJSON } from '../../../../../lib/helpers'

const handler = async (req, res) => {
  if (!['POST', 'GET'].includes(req.method)) {
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

  let crawler

  try {
    crawler = getCrawlerByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'getCrawlerByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_CRAWLER_BY_TOKEN)
  }

  if (!crawler) {
    return responseJSON(res, 404, CRAWLER_DOES_NOT_EXIST)
  }

  const crawlerId = crawler.id

  const logArgs = {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
  }

  try {
    addCrawlerLog(crawler, logArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { crawler, logArgs })
      scope.setTag('section', 'addCrawlerLog')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_ADD_CRAWLER_LOG)
  }

  if (req.method === 'GET') {
    let products

    try {
      products = getOutdatedProducts()
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setTag('section', 'getOutdatedProducts')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_GET_PRODUCTS_WITH_OUTDATED_PRICE)
    }

    return responseJSON(res, 200, { products: products })
  }

  const {
    url_hash,
    shop,
    url,
    title,
    original_price,
    discount_price,
    in_stock,
    status,
    requested_by,
  } = req.body

  if (isEmptyString(requested_by)) {
    return responseJSON(res, 400, MISSING_REQUESTED_BY)
  }

  if (isEmptyString(url_hash)) {
    return responseJSON(res, 400, MISSING_URL_HASH)
  }

  if (isEmptyString(shop)) {
    return responseJSON(res, 400, MISSING_SHOP)
  }

  // TODO: Добавить проверку, что присланный магазин поддерживается (ozon, wildberries, etc.)

  if (isEmptyString(url)) {
    return responseJSON(res, 400, MISSING_URL)
  }

  if (isEmptyString(status)) {
    return responseJSON(res, 400, MISSING_STATUS)
  }

  // TODO: Добавить проверку на поддерживаемость конкретных статусов (ok, not_found, etc.)

  // Мы не будем обрабатывать товары, ссылки которых не открываются
  // на момент добавления в систему.
  if (status === 'not_found') {
    try {
      removeNewProductFromQueue(url_hash)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { url_hash })
        scope.setTag('section', 'removeNewProductFromQueue')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE)
    }

    return responseJSON(res, 200, {})
  }

  if (status === 'required_to_change_location') {
    try {
      moveProductFromQueueToChangeLocation(url_hash)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { url_hash })
        scope.setTag('section', 'moveProductFromQueueToChangeLocation')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(
        res,
        500,
        UNABLE_TO_MOVE_PRODUCT_FROM_QUEUE_TO_CHANGE_LOCATION
      )
    }

    return responseJSON(res, 200, {})
  }

  let user

  try {
    user = findUser(requested_by)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { requested_by })
      scope.setTag('section', 'findUser')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return responseJSON(res, 404, USER_DOES_NOT_EXIST)
  }

  let product

  try {
    product = findProductByURLHash(url_hash)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { url_hash })
      scope.setTag('section', 'findProductByURLHash')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_PRODUCT_BY_URL_HASH)
  }

  let productLatestPrice = null

  if (product) {
    try {
      productLatestPrice = getProductLatestValidPriceFromHistory(product.id)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { product })
        scope.setTag('section', 'getProductLatestValidPriceFromHistory')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(
        res,
        500,
        UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY
      )
    }
  } else {
    // Маловероятно, что будет ситуация, когда один и тот же товар решат добавить одновременно два человека.
    // Для этого здесь и присутствует этот код, чтобы _случайно_ не создать два одинаковых товара в системе.
    const productArgs = {
      shop,
      url_hash,
      url,
      title,
      original_price,
      discount_price,
      in_stock,
      status,
    }

    productLatestPrice = discount_price || original_price

    try {
      product = createProduct(productArgs)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', productArgs)
        scope.setTag('section', 'createProduct')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_CREATE_NEW_PRODUCT)
    }
  }

  try {
    removeNewProductFromQueue(url_hash)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { url_hash })
      scope.setTag('section', 'removeNewProductFromQueue')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE)
  }

  // Если нет никакой цены, то просто не добавлять его пользователю.
  if (productLatestPrice !== null && productLatestPrice > 0) {
    try {
      addProductToUser(user.id, product.id, productLatestPrice)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { user, product, productLatestPrice })
        scope.setTag('section', 'addProductToUser')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER)
    }
  }

  return responseJSON(res, 200, product)
}

export default withSentry(handler)
