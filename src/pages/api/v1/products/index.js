import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { checkToken } from '../../../../lib/auth'
import {
  isValidUrl,
  buildCleanURL,
  calculateHash,
} from '../../../../lib/helpers'

import {
  findProductByURLHash,
  addNewProductToQueue,
  getProductLatestValidPriceFromHistory,
} from '../../../../services/products'
import { getUserByToken } from '../../../../services/auth'
import {
  addProductToUser,
  getUserProductsWithActualState,
} from '../../../../services/users'

import {
  METHOD_NOT_ALLOWED,
  FORBIDDEN,
  REDIRECT_TO_PRODUCT_PAGE,
  UNABLE_TO_GET_USER_BY_TOKEN,
  UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES,
  INVALID_URL,
  UNABLE_TO_CLEAN_URL,
  UNABLE_TO_CALCULATE_URL_HASH,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  PRODUCT_ADDED_TO_QUEUE,
  UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
} from '../../../../lib/messages'

const handler = async (req, res) => {
  if (!['POST', 'GET'].includes(req.method)) {
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
    Sentry.withScope(function (scope) {
      scope.setContext('args', { token })
      scope.setTag('section', 'getUserByToken')
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_USER_BY_TOKEN)
  }

  if (!user) {
    return res.status(403).json(FORBIDDEN)
  }

  if (req.method === 'GET') {
    let products

    try {
      products = getUserProductsWithActualState(user.id)
    } catch (err) {
      Sentry.withScope(function (scope) {
        scope.setTag('section', 'getUserProductsWithActualState')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return res.status(400).json(UNABLE_TO_GET_USER_PRODUCTS_WITH_PRICES)
    }

    return res.status(200).json({ products: products })
  }

  const { url } = req.body

  if (!isValidUrl(url)) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { url })
      scope.setTag('section', 'isValidUrl')
      scope.setUser({ user })
      Sentry.captureException(
        new Error(
          'Пользователь отправил некорректный URL через форму добавления товара'
        )
      )
    })

    return res.status(422).json(INVALID_URL)
  }

  let cleanURL

  try {
    cleanURL = buildCleanURL(url)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { url })
      scope.setTag('section', 'buildCleanURL')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_CLEAN_URL)
  }

  let urlHash

  try {
    urlHash = calculateHash(cleanURL)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { cleanURL })
      scope.setTag('section', 'calculateHash')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_CALCULATE_URL_HASH)
  }

  let product

  try {
    product = findProductByURLHash(urlHash)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { urlHash })
      scope.setTag('section', 'findProductByURLHash')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_FIND_PRODUCT_BY_URL_HASH)
  }

  if (!product) {
    const newProductArgs = {
      url_hash: urlHash,
      url: cleanURL,
      requested_by: user.id,
    }

    try {
      addNewProductToQueue(newProductArgs)
    } catch (err) {
      Sentry.withScope(function (scope) {
        scope.setContext('args', { newProductArgs })
        scope.setTag('section', 'addNewProductToQueue')
        scope.setUser({ user })
        Sentry.captureException(err)
      })

      return res.status(400).json(UNABLE_TO_ADD_NEW_PRODUCT_TO_QUEUE)
    }

    return res.status(201).json(PRODUCT_ADDED_TO_QUEUE)
  }

  let productLatestPrice = null

  try {
    productLatestPrice = getProductLatestValidPriceFromHistory(product.id)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { product })
      scope.setTag('section', 'getProductLatestValidPriceFromHistory')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_GET_PRODUCT_LATEST_PRICE_FROM_HISTORY)
  }

  if (!productLatestPrice || productLatestPrice === 0) {
    return res
      .status(400)
      .json(UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE)
  }

  try {
    addProductToUser(user.id, product.id, productLatestPrice)
  } catch (err) {
    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product })
      scope.setTag('section', 'addProductToUser')
      scope.setUser({ user })
      Sentry.captureException(err)
    })

    return res.status(400).json(UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER)
  }

  return res.status(201).json({
    ...REDIRECT_TO_PRODUCT_PAGE,
    location: '/products/' + product.id,
  })
}

export default withSentry(handler)
