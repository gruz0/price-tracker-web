import * as Sentry from '@sentry/nextjs'
import nextConnect from 'next-connect'
import { tmpdir } from 'os'
import multer from 'multer'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  UNABLE_TO_GET_CRAWLER_BY_TOKEN,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_PRODUCT_ID,
  UNABLE_TO_GET_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  UNABLE_TO_MOVE_PRODUCT_IMAGE_TO_UPLOADS_DIRECTORY,
  UNABLE_TO_UPDATE_PRODUCT_IMAGE,
} from '../../../../../../lib/messages'
import { responseJSON } from '../../../../../../lib/helpers'
import { isEmptyString } from '../../../../../../lib/validators'
import { getProduct } from '../../../../../../services/products'
import {
  getCrawlerByToken,
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
  onError(error, req, res) {
    console.error({ error })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'upload_product_image_error')
      scope.setTag('crawler_id', req.crawlerId)
      Sentry.captureException(error)
    })

    responseJSON(res, 500, {
      status: 'unable_to_upload_product_image',
      message: error.message,
    })
  },
  onNoMatch(_req, res) {
    responseJSON(res, 405, METHOD_NOT_ALLOWED)
  },
})

apiRoute.use((req, res, next) => {
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

  let crawler

  try {
    crawler = getCrawlerByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'getCrawlerByToken')
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_CRAWLER_BY_TOKEN)
  }

  if (!crawler) {
    return responseJSON(res, 404, CRAWLER_DOES_NOT_EXIST)
  }

  const crawlerId = crawler.id

  const { product_id: productId } = req.query

  if (isEmptyString(productId)) {
    return responseJSON(res, 400, MISSING_PRODUCT_ID)
  }

  let product

  try {
    product = getProduct(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'getProduct')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return responseJSON(res, 500, UNABLE_TO_GET_PRODUCT_BY_ID)
  }

  if (!product) {
    return responseJSON(res, 404, PRODUCT_DOES_NOT_EXIST)
  }

  req.crawlerId = crawlerId
  req.productId = productId

  next()
})

apiRoute.use(upload.single('image'))

apiRoute.post((req, res) => {
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
    product = updateProductImage(productId, tmpFilename)
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
