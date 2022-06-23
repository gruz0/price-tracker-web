import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { isEmptyString, isValidUUID } from '../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  UNABLE_TO_GET_PRODUCTS_WITH_OUTDATED_PRICE,
  UNABLE_TO_FIND_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_REQUESTED_BY,
  INVALID_USER_UUID,
  MISSING_URL_HASH,
  MISSING_SHOP,
  MISSING_URL,
  MISSING_STATUS,
  UNABLE_TO_FIND_USER,
  USER_DOES_NOT_EXIST,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  UNABLE_TO_CREATE_NEW_PRODUCT,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE,
  UNABLE_TO_MOVE_PRODUCT_FROM_QUEUE_TO_CHANGE_LOCATION,
  INVALID_PRODUCT_STATUS,
  UNABLE_TO_FIND_PRODUCT_QUEUE_BY_URL_HASH,
  PRODUCT_QUEUE_DOES_NOT_EXIST,
  MISSING_TITLE,
  MISSING_IN_STOCK,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  MISSING_PRICES,
  UNABLE_TO_ADD_PRODUCT_HISTORY,
} from '../../../../../lib/messages'
import {
  findCrawlerByToken,
  getOutdatedProducts,
  removeNewProductFromQueue,
  createProduct,
  skipQueuedProductForCrawler,
  findProductQueueForUser,
  addProductHistory,
} from '../../../../../services/crawlers'
import { findUserById } from '../../../../../services/auth'
import { findProductByURLHash } from '../../../../../services/products'
import { addProductToUser } from '../../../../../services/users'
import { responseJSON, isStatusSupported } from '../../../../../lib/helpers'

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

  if (!isValidUUID(token)) {
    return responseJSON(res, 400, INVALID_TOKEN_UUID)
  }

  let crawler

  try {
    crawler = await findCrawlerByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'findCrawlerByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_CRAWLER_BY_TOKEN)
  }

  if (!crawler) {
    return responseJSON(res, 404, CRAWLER_DOES_NOT_EXIST)
  }

  const crawlerId = crawler.id

  if (req.method === 'GET') {
    let products

    try {
      products = await getOutdatedProducts()
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

  if (!isValidUUID(requested_by)) {
    return responseJSON(res, 400, INVALID_USER_UUID)
  }

  if (isEmptyString(url_hash)) {
    return responseJSON(res, 400, MISSING_URL_HASH)
  }

  if (isEmptyString(shop)) {
    return responseJSON(res, 400, MISSING_SHOP)
  }

  if (isEmptyString(url)) {
    return responseJSON(res, 400, MISSING_URL)
  }

  if (isEmptyString(status)) {
    return responseJSON(res, 400, MISSING_STATUS)
  }

  if (!isStatusSupported(status)) {
    return responseJSON(res, 400, INVALID_PRODUCT_STATUS)
  }

  let user

  try {
    user = await findUserById(requested_by)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { requested_by })
      scope.setTag('section', 'findUserById')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_USER)
  }

  if (!user) {
    return responseJSON(res, 404, USER_DOES_NOT_EXIST)
  }

  let productQueue

  try {
    productQueue = await findProductQueueForUser(url, url_hash, user.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { url, url_hash, user })
      scope.setTag('section', 'findProductQueueForUser')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_PRODUCT_QUEUE_BY_URL_HASH)
  }

  if (!productQueue) {
    return responseJSON(res, 404, PRODUCT_QUEUE_DOES_NOT_EXIST)
  }

  let product

  try {
    product = await findProductByURLHash(url_hash)
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

  if (!product) {
    switch (status) {
      // Мы не будем обрабатывать товары, ссылки которых не открываются на момент добавления в систему.
      case 'not_found': {
        try {
          await removeNewProductFromQueue(url_hash)
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

      case 'required_to_change_location': {
        try {
          await skipQueuedProductForCrawler(url_hash, crawlerId)
        } catch (err) {
          console.error({ err })

          Sentry.withScope(function (scope) {
            scope.setContext('args', { url_hash, crawlerId })
            scope.setTag('section', 'skipQueuedProductForCrawler')
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

      default: {
        if (isEmptyString(title)) {
          return responseJSON(res, 400, MISSING_TITLE)
        }

        if (isEmptyString(in_stock)) {
          return responseJSON(res, 400, MISSING_IN_STOCK)
        }

        try {
          product = await createProduct({
            shop,
            urlHash: url_hash,
            url,
            title,
          })
        } catch (err) {
          console.error({ err })

          Sentry.withScope(function (scope) {
            scope.setContext('args', { shop, url_hash, url, title })
            scope.setTag('section', 'createProduct')
            scope.setTag('crawler_id', crawlerId)
            Sentry.captureException(err)
          })

          return responseJSON(res, 500, UNABLE_TO_CREATE_NEW_PRODUCT)
        }
      }
    }
  }

  if (isEmptyString(original_price) && isEmptyString(discount_price)) {
    return responseJSON(res, 400, MISSING_PRICES)
  }

  if (!isEmptyString(original_price) && original_price <= 0) {
    return responseJSON(res, 422, ORIGINAL_PRICE_MUST_BE_POSITIVE)
  }

  if (!isEmptyString(discount_price) && discount_price <= 0) {
    return responseJSON(res, 422, DISCOUNT_PRICE_MUST_BE_POSITIVE)
  }

  let productLatestPrice = discount_price || original_price

  const productArgs = {
    shop,
    urlHash: url_hash,
    url,
    title,
    originalPrice: original_price,
    discountPrice: discount_price,
    inStock: in_stock,
    status,
    crawlerId: crawler.id,
  }

  try {
    await addProductHistory(product.id, productArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { product, productArgs })
      scope.setTag('section', 'addProductHistory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_ADD_PRODUCT_HISTORY)
  }

  try {
    await addProductToUser(user.id, product.id, productLatestPrice)
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

  try {
    await removeNewProductFromQueue(url_hash)
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

  return responseJSON(res, 201, product)
}

export default withSentry(handler)
