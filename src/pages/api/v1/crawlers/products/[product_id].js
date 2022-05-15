import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { getProduct, addProductHistory } from '../../../../../services'
import { isEmptyString, isNotDefined } from '../../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_GET_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
  UNABLE_TO_ADD_CRAWLER_LOG,
  MISSING_PRODUCT_ID,
  UNABLE_TO_GET_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_STATUS,
  MISSING_IN_STOCK,
  UNABLE_TO_ADD_PRODUCT_HISTORY,
} from '../../../../../lib/messages'
import {
  getCrawlerByToken,
  addCrawlerLog,
} from '../../../../../services/crawlers'

const handler = async (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).json(METHOD_NOT_ALLOWED)
  }

  const { authorization } = req.headers

  if (isEmptyString(authorization)) {
    return res.status(401).json(MISSING_AUTHORIZATION_HEADER)
  }

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json(MISSING_BEARER_KEY)
  }

  const token = authorization.replace(/^Bearer/, '').trim()

  if (token.length === 0) {
    return res.status(401).json(MISSING_TOKEN)
  }

  let crawler

  try {
    crawler = getCrawlerByToken(token)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'getCrawlerByToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_CRAWLER_BY_TOKEN)
  }

  if (!crawler) {
    return res.status(403).json(CRAWLER_DOES_NOT_EXIST)
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
    Sentry.withScope(function (scope) {
      scope.setContext('args', { crawler, logArgs })
      scope.setTag('section', 'addCrawlerLog')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_ADD_CRAWLER_LOG)
  }

  const { product_id: productId } = req.query

  if (isEmptyString(productId)) {
    return res.status(422).json(MISSING_PRODUCT_ID)
  }

  let product

  try {
    product = getProduct(productId)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'getProduct')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_PRODUCT_BY_ID)
  }

  if (!product) {
    return res.status(404).json(PRODUCT_DOES_NOT_EXIST)
  }

  const { original_price, discount_price, title, in_stock, status } = req.body

  if (isEmptyString(status)) {
    return res.status(422).json(MISSING_STATUS)
  }

  if (isNotDefined(in_stock)) {
    return res.status(422).json(MISSING_IN_STOCK)
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
    Sentry.withScope(function (scope) {
      scope.setContext('args', productArgs)
      scope.setTag('section', 'addProductHistory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_ADD_PRODUCT_HISTORY)
  }

  return res.status(200).json(history)
}

export default withSentry(handler)
