import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { isEmptyString, isValidUUID } from '../../../../lib/validators'
import {
  METHOD_NOT_ALLOWED,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  UNABLE_TO_FIND_CRAWLER_BY_TOKEN,
  UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS,
} from '../../../../lib/messages'
import {
  findCrawlerByToken,
  getNewProductsQueue,
} from '../../../../services/crawlers'
import { responseJSON } from '../../../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
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

  let products

  try {
    products = await getNewProductsQueue(crawlerId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'getNewProductsQueue')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS)
  }

  return responseJSON(res, 200, { products: products })
}

export default withSentry(handler)
