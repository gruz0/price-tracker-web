import { withSentry } from '@sentry/nextjs'
import { METHOD_NOT_ALLOWED } from '../../../../../../lib/messages'
import { responseJSON } from '../../../../../../lib/helpers'
import { authenticateCrawlerByTokenUseCase } from '../../../../../../useCases/crawlers/authenticateCrawlerByTokenUseCase'
import { updateProductUseCase } from '../../../../../../useCases/crawlers/updateProductUseCase'

const handler = async (req, res) => {
  if (req.method !== 'PUT') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const crawlerResult = await authenticateCrawlerByTokenUseCase(req.headers)

  if (typeof crawlerResult !== 'string') {
    return responseJSON(res, crawlerResult.status, crawlerResult.response)
  }

  const crawlerId = crawlerResult

  const { product_id: productId } = req.query

  const updateProductUseCaseResult = await updateProductUseCase(
    crawlerId,
    productId,
    req.body
  )

  return responseJSON(
    res,
    updateProductUseCaseResult.status,
    updateProductUseCaseResult.response
  )
}

export default withSentry(handler)
