import * as Sentry from '@sentry/nextjs'
import { getNewProductsQueue } from '../../../services/crawlers'
import { UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS } from '../../../lib/messages'

// TODO: Добавить тесты
export const getNewProductsUseCase = async (crawlerId) => {
  try {
    const products = await getNewProductsQueue(crawlerId)

    return {
      status: 200,
      response: { products },
    }
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'getNewProductsQueue')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_GET_NEW_PRODUCTS_REQUESTS,
    }
  }
}
