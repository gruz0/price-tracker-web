import { withSentry } from '@sentry/nextjs'
import { METHOD_NOT_ALLOWED } from '../../../../lib/messages'
import { responseJSON } from '../../../../lib/helpers'
import { authenticateCrawlerByTokenUseCase } from '../../../../useCases/crawlers/authenticateCrawlerByTokenUseCase'
import { getNewProductsUseCase } from '../../../../useCases/crawlers/getNewProductsUseCase'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const crawlerResult = await authenticateCrawlerByTokenUseCase(req.headers)

  if (typeof crawlerResult !== 'string') {
    return responseJSON(res, crawlerResult.status, crawlerResult.response)
  }

  const crawlerId = crawlerResult

  const getNewProductsResult = await getNewProductsUseCase(crawlerId)

  return responseJSON(
    res,
    getNewProductsResult.status,
    getNewProductsResult.response
  )
}

export default withSentry(handler)
