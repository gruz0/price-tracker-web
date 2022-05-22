import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { checkToken } from '../../../../lib/auth'
import { getUserByToken } from '../../../../services/auth'
import { isProductExists } from '../../../../services/products'
import { getUserProduct } from '../../../../services/users'

import {
  METHOD_NOT_ALLOWED,
  UNABLE_TO_GET_USER_BY_TOKEN,
  FORBIDDEN,
  UNABLE_TO_GET_PRODUCT_BY_ID,
  PRODUCT_DOES_NOT_EXIST,
  UNABLE_TO_GET_USER_PRODUCT,
  USER_DOES_NOT_HAVE_PRODUCT,
} from '../../../../lib/messages'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json(METHOD_NOT_ALLOWED)
  }

  const token = checkToken(req, res)

  if (!token) {
    return
  }

  let user

  try {
    user = getUserByToken(token)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setTag('section', 'getUserByToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_BY_TOKEN)
  }

  if (!user) {
    return res.status(403).json(FORBIDDEN)
  }

  const productId = req.query.id

  let exists

  try {
    exists = isProductExists(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'isProductExists')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_PRODUCT_BY_ID)
  }

  if (!exists) {
    return res.status(404).json(PRODUCT_DOES_NOT_EXIST)
  }

  let userProduct

  try {
    userProduct = getUserProduct(user.id, productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, productId })
      scope.setTag('section', 'getUserProduct')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_PRODUCT)
  }

  if (!userProduct) {
    return res.status(404).json(USER_DOES_NOT_HAVE_PRODUCT)
  }

  return res.status(200).json({ product: userProduct })
}

export default withSentry(handler)
