import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { getProduct } from '../../../../../services/products'
import { isEmptyString, isNotDefined } from '../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_GET_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_PRODUCT_ID,
  UNABLE_TO_GET_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_STATUS,
  MISSING_IN_STOCK,
  UNABLE_TO_ADD_PRODUCT_HISTORY,
} from '../../../../../lib/messages'
import {
  getCrawlerByToken,
  addProductHistory,
} from '../../../../../services/crawlers'
import { sendMessageToTelegramThatProductIsInStock } from '../../../../../services/telegram'
import { responseJSON } from '../../../../../lib/helpers'

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

  const { product_id: productId } = req.query

  if (isEmptyString(productId)) {
    return responseJSON(res, 400, MISSING_PRODUCT_ID)
  }

  let product

  try {
    product = getProduct(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'getProduct')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_PRODUCT_BY_ID)
  }

  if (!product) {
    return responseJSON(res, 404, PRODUCT_DOES_NOT_EXIST)
  }

  const { original_price, discount_price, title, in_stock, status } = req.body

  if (isEmptyString(status)) {
    return responseJSON(res, 400, MISSING_STATUS)
  }

  // TODO: Check only supported statuses (ok, not_found, required_to_change_location, etc.)

  if (isNotDefined(in_stock)) {
    return responseJSON(res, 400, MISSING_IN_STOCK)
  }

  const telegramArgs = {
    product,
    status,
    price: discount_price || original_price,
    in_stock,
  }

  try {
    sendMessageToTelegramThatProductIsInStock(telegramArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', telegramArgs)
      scope.setTag('section', 'sendMessageToTelegramThatProductIsInStock')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    // NOTE: Здесь мы не возвращаем ответ в JSON, как в остальных try/catch,
    // потому что нам важно записать историю, которая идёт ниже.
  }

  let history

  const productArgs = {
    original_price,
    discount_price,
    in_stock,
    status,
    title,
    crawler_id: crawlerId,
  }

  try {
    history = addProductHistory(productId, productArgs)
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

  return responseJSON(res, 201, history)
}

export default withSentry(handler)
