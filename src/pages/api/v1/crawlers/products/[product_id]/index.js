import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import {
  findProductById,
  getLastProductHistory,
} from '../../../../../../services/products'
import {
  isEmptyString,
  isNotDefined,
  isValidUUID,
} from '../../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  UNABLE_TO_FIND_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_PRODUCT_ID,
  INVALID_PRODUCT_UUID,
  UNABLE_TO_FIND_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_STATUS,
  MISSING_IN_STOCK,
  UNABLE_TO_ADD_PRODUCT_HISTORY,
  INVALID_PRODUCT_STATUS,
  UNABLE_TO_GET_LAST_PRODUCT_HISTORY,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
} from '../../../../../../lib/messages'
import {
  findCrawlerByToken,
  addProductHistory,
} from '../../../../../../services/crawlers'
import { sendMessageToTelegramThatProductIsInStock } from '../../../../../../services/telegram'
import { isStatusSupported, responseJSON } from '../../../../../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'PUT') {
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

  const { product_id: productId } = req.query

  if (isEmptyString(productId)) {
    return responseJSON(res, 400, MISSING_PRODUCT_ID)
  }

  if (!isValidUUID(productId)) {
    return responseJSON(res, 400, INVALID_PRODUCT_UUID)
  }

  let product

  try {
    product = await findProductById(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'findProductById')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_PRODUCT_BY_ID)
  }

  if (!product) {
    return responseJSON(res, 404, PRODUCT_DOES_NOT_EXIST)
  }

  const { original_price, discount_price, title, in_stock, status } = req.body

  if (isEmptyString(status)) {
    return responseJSON(res, 400, MISSING_STATUS)
  }

  if (isNotDefined(in_stock)) {
    return responseJSON(res, 400, MISSING_IN_STOCK)
  }

  if (!isStatusSupported(status)) {
    return responseJSON(res, 400, INVALID_PRODUCT_STATUS)
  }

  if (status === 'skip') {
    return responseJSON(res, 200, {})
  }

  const price = discount_price || original_price

  if (status === 'ok' && in_stock && price) {
    let lastProductHistory

    try {
      lastProductHistory = await getLastProductHistory(product.id)
    } catch (err) {
      console.error({ err })

      Sentry.withScope(function (scope) {
        scope.setContext('args', { product })
        scope.setTag('section', 'getLastProductHistory')
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(err)
      })

      return responseJSON(res, 500, UNABLE_TO_GET_LAST_PRODUCT_HISTORY)
    }

    if (lastProductHistory && !lastProductHistory.in_stock) {
      try {
        // FIXME: Надо подумать, как это запускать в фоне, чтобы быстрее освобождать браузер
        await sendMessageToTelegramThatProductIsInStock(product, price)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { product, price })
          scope.setTag('section', 'sendMessageToTelegramThatProductIsInStock')
          scope.setTag('crawler_id', crawlerId)
          Sentry.captureException(err)
        })

        // NOTE: Здесь мы не возвращаем ответ в JSON, как в остальных try/catch,
        // потому что нам важно записать историю, которая идёт ниже.
      }
    }
  }

  if (!isEmptyString(original_price) && original_price <= 0) {
    return responseJSON(res, 422, ORIGINAL_PRICE_MUST_BE_POSITIVE)
  }

  if (!isEmptyString(discount_price) && discount_price <= 0) {
    return responseJSON(res, 422, DISCOUNT_PRICE_MUST_BE_POSITIVE)
  }

  let history

  const productArgs = {
    originalPrice: original_price,
    discountPrice: discount_price,
    inStock: in_stock,
    status,
    title,
    crawlerId,
  }

  try {
    history = await addProductHistory(productId, productArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', productArgs)
      scope.setTag('section', 'addProductHistory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_ADD_PRODUCT_HISTORY)
  }

  return responseJSON(res, 200, history)
}

export default withSentry(handler)
