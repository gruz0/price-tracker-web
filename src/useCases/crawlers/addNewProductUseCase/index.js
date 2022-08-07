import * as Sentry from '@sentry/nextjs'
import {
  isEmptyString,
  isNumber,
  isPositiveFloat,
  isValidUUID,
} from '../../../lib/validators'
import { findUserById } from '../../../services/auth'
import {
  addProductHistory,
  createProduct,
  findProductQueueForUser,
  removeNewProductFromQueue,
  skipQueuedProductForCrawler,
} from '../../../services/crawlers'
import { findProductByURLHash } from '../../../services/products'
import { addProductToUser } from '../../../services/users'
import { isStatusSupported } from '../../../lib/helpers'
import {
  DISCOUNT_PRICE_MUST_BE_A_NUMBER,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  INVALID_PRODUCT_STATUS,
  INVALID_USER_UUID,
  MISSING_IN_STOCK,
  MISSING_PRICES,
  MISSING_REQUESTED_BY,
  MISSING_SHOP,
  MISSING_STATUS,
  MISSING_TITLE,
  MISSING_URL,
  MISSING_URL_HASH,
  ORIGINAL_PRICE_MUST_BE_A_NUMBER,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  PRODUCT_ALREADY_EXISTS,
  PRODUCT_QUEUE_DOES_NOT_EXIST,
  UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
  UNABLE_TO_ADD_PRODUCT_HISTORY,
  UNABLE_TO_CREATE_NEW_PRODUCT,
  UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
  UNABLE_TO_FIND_PRODUCT_QUEUE_BY_URL_HASH,
  UNABLE_TO_FIND_USER,
  UNABLE_TO_MOVE_PRODUCT_FROM_QUEUE_TO_CHANGE_LOCATION,
  UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE,
  USER_DOES_NOT_EXIST,
} from '../../../lib/messages'

// TODO: Добавить тесты
export const addNewProductUseCase = async (crawlerId, body = {}) => {
  const {
    url_hash,
    shop,
    url,
    title,
    original_price,
    discount_price,
    in_stock,
    status,
    requested_by,
  } = body

  if (isEmptyString(requested_by)) {
    return {
      status: 400,
      response: MISSING_REQUESTED_BY,
    }
  }

  if (!isValidUUID(requested_by)) {
    return {
      status: 400,
      response: INVALID_USER_UUID,
    }
  }

  if (isEmptyString(url_hash)) {
    return {
      status: 400,
      response: MISSING_URL_HASH,
    }
  }

  if (isEmptyString(shop)) {
    return {
      status: 400,
      response: MISSING_SHOP,
    }
  }

  if (isEmptyString(url)) {
    return {
      status: 400,
      response: MISSING_URL,
    }
  }

  if (isEmptyString(status)) {
    return {
      status: 400,
      response: MISSING_STATUS,
    }
  }

  if (!isStatusSupported(status)) {
    return {
      status: 400,
      response: INVALID_PRODUCT_STATUS,
    }
  }

  let user

  try {
    user = await findUserById(requested_by)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { requested_by })
      scope.setTag('section', 'findUserById')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_FIND_USER,
    }
  }

  if (!user) {
    return {
      status: 404,
      response: USER_DOES_NOT_EXIST,
    }
  }

  let productQueue

  try {
    productQueue = await findProductQueueForUser(url, url_hash, user.id)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { url, url_hash, user })
      scope.setTag('section', 'findProductQueueForUser')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_FIND_PRODUCT_QUEUE_BY_URL_HASH,
    }
  }

  if (!productQueue) {
    return {
      status: 404,
      response: PRODUCT_QUEUE_DOES_NOT_EXIST,
    }
  }

  let product

  try {
    product = await findProductByURLHash(url_hash)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { url_hash })
      scope.setTag('section', 'findProductByURLHash')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_FIND_PRODUCT_BY_URL_HASH,
    }
  }

  if (product) {
    return {
      status: 409,
      response: PRODUCT_ALREADY_EXISTS,
    }
  }

  let productLatestPrice
  let discountPrice
  let originalPrice

  if (!isEmptyString(discount_price)) {
    if (!isNumber(discount_price)) {
      return {
        status: 422,
        response: DISCOUNT_PRICE_MUST_BE_A_NUMBER,
      }
    }

    if (!isPositiveFloat(discount_price)) {
      return {
        status: 422,
        response: DISCOUNT_PRICE_MUST_BE_POSITIVE,
      }
    }

    discountPrice = parseFloat(discount_price)
  }

  if (!isEmptyString(original_price)) {
    if (!isNumber(original_price)) {
      return {
        status: 422,
        response: ORIGINAL_PRICE_MUST_BE_A_NUMBER,
      }
    }

    if (!isPositiveFloat(original_price)) {
      return {
        status: 422,
        response: ORIGINAL_PRICE_MUST_BE_POSITIVE,
      }
    }

    originalPrice = parseFloat(original_price)
  }

  // FIXME: Вынести в функцию
  if (discountPrice && originalPrice) {
    productLatestPrice =
      discountPrice < originalPrice ? discountPrice : originalPrice
  } else {
    if (discountPrice) {
      if (!originalPrice) {
        productLatestPrice = discountPrice
      } else {
        productLatestPrice = originalPrice
      }
    } else if (originalPrice) {
      productLatestPrice = originalPrice
    } else {
      productLatestPrice = 0
    }
  }

  // Если товар в наличии, то мы должны проверить наличие хотя бы одной цены
  if (in_stock === true && productLatestPrice === 0) {
    return {
      status: 400,
      response: MISSING_PRICES,
    }
  }

  switch (status) {
    case 'skip':
      Sentry.withScope(function (scope) {
        scope.setContext('args', { body: body })
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(
          new Error(
            'Получен status === skip для нового товара, требуется ручной запуск другого краулера new_products_parser'
          )
        )
      })

      return {
        status: 200,
        response: {},
      }

    // Мы не будем обрабатывать товары, ссылки которых не открываются на момент добавления в систему.
    case 'age_restriction':
    case 'not_found': {
      try {
        await removeNewProductFromQueue(url_hash)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { url_hash })
          scope.setTag('section', 'removeNewProductFromQueue')
          scope.setTag('crawler_id', crawlerId)
          Sentry.captureException(err)
        })

        return {
          status: 500,
          response: UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE,
        }
      }

      return {
        status: 200,
        response: {},
      }
    }

    case 'required_to_change_location': {
      try {
        await skipQueuedProductForCrawler(url_hash, crawlerId)
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { url_hash, crawlerId })
          scope.setTag('section', 'skipQueuedProductForCrawler')
          scope.setTag('crawler_id', crawlerId)
          Sentry.captureException(err)
        })

        return {
          status: 500,
          response: UNABLE_TO_MOVE_PRODUCT_FROM_QUEUE_TO_CHANGE_LOCATION,
        }
      }

      Sentry.withScope(function (scope) {
        scope.setContext('args', { body: body })
        scope.setTag('crawler_id', crawlerId)
        Sentry.captureException(
          new Error(
            'Получен status === required_to_change_location для нового товара, требуется ручной запуск другого краулера new_products_parser'
          )
        )
      })

      return {
        status: 200,
        response: {},
      }
    }

    default: {
      if (isEmptyString(title)) {
        return {
          status: 400,
          response: MISSING_TITLE,
        }
      }

      if (isEmptyString(in_stock)) {
        return {
          status: 400,
          response: MISSING_IN_STOCK,
        }
      }

      try {
        product = await createProduct({
          shop,
          urlHash: url_hash,
          url,
          title,
        })
      } catch (err) {
        console.error({ err })

        Sentry.withScope(function (scope) {
          scope.setContext('args', { shop, url_hash, url, title })
          scope.setTag('section', 'createProduct')
          scope.setTag('crawler_id', crawlerId)
          Sentry.captureException(err)
        })

        return {
          status: 500,
          response: UNABLE_TO_CREATE_NEW_PRODUCT,
        }
      }
    }
  }

  const productArgs = {
    shop,
    urlHash: url_hash,
    url,
    title,
    originalPrice,
    discountPrice,
    inStock: in_stock,
    status,
    crawlerId,
  }

  try {
    await addProductHistory(product.id, productArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { product, productArgs })
      scope.setTag('section', 'addProductHistory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_ADD_PRODUCT_HISTORY,
    }
  }

  try {
    await addProductToUser(user.id, product.id, productLatestPrice)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { user, product, productLatestPrice })
      scope.setTag('section', 'addProductToUser')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_ADD_EXISTING_PRODUCT_TO_USER,
    }
  }

  try {
    await removeNewProductFromQueue(url_hash)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { url_hash })
      scope.setTag('section', 'removeNewProductFromQueue')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_REMOVE_PRODUCT_FROM_QUEUE,
    }
  }

  return {
    status: 201,
    response: product,
  }
}
