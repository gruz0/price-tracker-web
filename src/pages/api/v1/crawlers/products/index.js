import { withSentry } from '@sentry/nextjs'
import { METHOD_NOT_ALLOWED } from '../../../../../lib/messages'
import { responseJSON } from '../../../../../lib/helpers'
import { authenticateCrawlerByTokenUseCase } from '../../../../../useCases/crawlers/authenticateCrawlerByTokenUseCase'
import { addNewProductUseCase } from '../../../../../useCases/crawlers/addNewProductUseCase'
import { getOutdatedProductsUseCase } from '../../../../../useCases/crawlers/getOutdatedProductsUseCase'

const handler = async (req, res) => {
  if (!['POST', 'GET'].includes(req.method)) {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const crawlerResult = await authenticateCrawlerByTokenUseCase(req.headers)

  if (typeof crawlerResult !== 'string') {
    return responseJSON(res, crawlerResult.status, crawlerResult.response)
  }

  const crawlerId = crawlerResult

  switch (req.method) {
    case 'GET': {
      const outdatedProductsResult = await getOutdatedProductsUseCase(crawlerId)

      return responseJSON(
        res,
        outdatedProductsResult.status,
        outdatedProductsResult.response
      )
    }

    case 'POST': {
      const addNewProductResult = await addNewProductUseCase(
        crawlerId,
        req.body
      )

      return responseJSON(
        res,
        addNewProductResult.status,
        addNewProductResult.response
      )
    }
  }
}

export default withSentry(handler)
