import * as Sentry from '@sentry/nextjs'
import nextConnect from 'next-connect'
import { tmpdir } from 'os'
import multer from 'multer'
import {
  METHOD_NOT_ALLOWED,
  MISSING_PRODUCT_ID,
  UNABLE_TO_FIND_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  UNABLE_TO_MOVE_PRODUCT_IMAGE_TO_UPLOADS_DIRECTORY,
  UNABLE_TO_UPDATE_PRODUCT_IMAGE,
  INVALID_PRODUCT_UUID,
} from '../../../../../../lib/messages'
import { responseJSON } from '../../../../../../lib/helpers'
import { isEmptyString, isValidUUID } from '../../../../../../lib/validators'
import { findProductById } from '../../../../../../services/products'
import {
  moveProductImageToUploadsDirectory,
  updateProductImage,
} from '../../../../../../services/crawlers'
import { authenticateCrawlerByTokenUseCase } from '../../../../../../useCases/crawlers/authenticateCrawlerByTokenUseCase'

const upload = multer({
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, file, cb) => cb(null, file.originalname),
  }),
})

const apiRoute = nextConnect({
  onError(err, req, res) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'upload_product_image_error')
      scope.setTag('crawler_id', req.crawlerId)
      Sentry.captureException(err)
    })

    responseJSON(res, 500, {
      status: 'unable_to_upload_product_image',
      message: err.message,
    })
  },
  onNoMatch(_req, res) {
    responseJSON(res, 405, METHOD_NOT_ALLOWED)
  },
})

apiRoute.use(async (req, res, next) => {
  if (req.method !== 'POST') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const crawlerResult = await authenticateCrawlerByTokenUseCase(req.headers)

  if (typeof crawlerResult !== 'string') {
    return responseJSON(res, crawlerResult.status, crawlerResult.response)
  }

  const crawlerId = crawlerResult

  const { product_id: productId } = req.query

  if (isEmptyString(productId)) {
    return responseJSON(res, 400, MISSING_PRODUCT_ID)
  }

  if (!isValidUUID(productId)) {
    return responseJSON(res, 400, INVALID_PRODUCT_UUID)
  }

  let product

  try {
    product = await findProductById(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'findProductById')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_FIND_PRODUCT_BY_ID)
  }

  if (!product) {
    return responseJSON(res, 404, PRODUCT_DOES_NOT_EXIST)
  }

  req.crawlerId = crawlerId
  req.productId = productId

  next()
})

apiRoute.use(upload.single('image'))

apiRoute.post(async (req, res) => {
  const file = req.file
  const tmpFilename = file.filename
  const tmpFilePath = file.path

  const productId = req.productId
  const crawlerId = req.crawlerId

  try {
    moveProductImageToUploadsDirectory(tmpFilePath, tmpFilename)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'moveProductImageToUploadsDirectory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(
      res,
      500,
      UNABLE_TO_MOVE_PRODUCT_IMAGE_TO_UPLOADS_DIRECTORY
    )
  }

  let product

  try {
    product = await updateProductImage(productId, tmpFilename)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId, tmpFilename })
      scope.setTag('section', 'updateProductImage')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_UPDATE_PRODUCT_IMAGE)
  }

  res.status(200).json(product)
})

export default apiRoute

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
}
