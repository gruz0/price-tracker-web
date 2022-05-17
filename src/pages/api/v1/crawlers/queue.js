import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { isEmptyString } from '../../../../lib/validators'
import {
  CRAWLER_DOES_NOT_EXIST,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_ADD_CRAWLER_LOG,
  UNABLE_TO_GET_CRAWLER_BY_TOKEN,
  UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS,
} from '../../../../lib/messages'
import {
  addCrawlerLog,
  getCrawlerByToken,
  getNewProductsQueue,
} from '../../../../services/crawlers'

const handler = async (req, res) => {
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

  let products

  try {
    products = getNewProductsQueue()
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setTag('section', 'getNewProductsQueue')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS)
  }

  return res.status(200).json({ products: products })
}

export default withSentry(handler)
