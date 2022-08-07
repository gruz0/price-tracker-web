import * as Sentry from '@sentry/nextjs'
import { validateBearerToken } from '../../../lib/auth_helpers'
import { findCrawlerByToken } from '../../../services/crawlers'
import {
  CRAWLER_DOES_NOT_EXIST,
  UNABLE_TO_FIND_CRAWLER_BY_TOKEN,
} from '../../../lib/messages'

// TODO: Добавить тесты
export const authenticateCrawlerByTokenUseCase = async ({ authorization }) => {
  const tokenResult = validateBearerToken({ authorization })

  if (typeof tokenResult !== 'string') {
    return {
      status: tokenResult.code,
      response: tokenResult.error,
    }
  }

  const token = tokenResult

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

    return {
      status: 500,
      response: UNABLE_TO_FIND_CRAWLER_BY_TOKEN,
    }
  }

  if (!crawler) {
    return {
      status: 404,
      response: CRAWLER_DOES_NOT_EXIST,
    }
  }

  return crawler.id
}
