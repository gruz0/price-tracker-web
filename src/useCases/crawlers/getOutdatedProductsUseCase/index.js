import * as Sentry from '@sentry/nextjs'
import { CrawlersService } from '../../../services/crawlers_service'
import { UNABLE_TO_GET_PRODUCTS_WITH_OUTDATED_PRICE } from '../../../lib/messages'

// TODO: Добавить тесты
export const getOutdatedProductsUseCase = async (crawlerId) => {
  let products

  try {
    products = await CrawlersService.getOutdatedProducts()
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'CrawlersService.getOutdatedProducts')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_GET_PRODUCTS_WITH_OUTDATED_PRICE,
    }
  }

  return {
    status: 200,
    response: { products },
  }
}
