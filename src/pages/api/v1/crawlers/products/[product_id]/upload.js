import * as Sentry from '@sentry/nextjs'
import nextConnect from 'next-connect'
import { tmpdir } from 'os'
import multer from 'multer'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  UNABLE_TO_FIND_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
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
  findCrawlerByToken,
  moveProductImageToUploadsDirectory,
  updateProductImage,
} from '../../../../../../services/crawlers'

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
