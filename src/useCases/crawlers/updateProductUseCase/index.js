import * as Sentry from '@sentry/nextjs'
import {
  isEmptyString,
  isNotDefined,
  isNumber,
  isPositiveFloat,
  isValidUUID,
} from '../../../lib/validators'
import { addProductHistory } from '../../../services/crawlers'
import { isStatusSupported } from '../../../lib/helpers'
import { ProductsService } from '../../../services/products_service'
import { TelegramService } from '../../../services/telegram_service'
import { UserProductsService } from '../../../services/user_products_service'
import {
  DISCOUNT_PRICE_MUST_BE_A_NUMBER,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  INVALID_PRODUCT_STATUS,
  INVALID_PRODUCT_UUID,
  MISSING_IN_STOCK,
  MISSING_PRICES,
  MISSING_PRODUCT_ID,
  MISSING_STATUS,
  MISSING_TITLE,
  ORIGINAL_PRICE_MUST_BE_A_NUMBER,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  PRODUCT_DOES_NOT_EXIST,
  UNABLE_TO_ADD_PRODUCT_HISTORY,
  UNABLE_TO_FIND_PRODUCT_WITH_RECENT_HISTORY,
  UNABLE_TO_UPDATE_USER_PRODUCTS_PRICE,
} from '../../../lib/messages'

export const updateProductUseCase = async (crawlerId, productId, body = {}) => {
  if (isEmptyString(productId)) {
    return {
      status: 400,
      response: MISSING_PRODUCT_ID,
    }
  }

  if (!isValidUUID(productId)) {
    return {
      status: 400,
      response: INVALID_PRODUCT_UUID,
    }
  }

  let product

  try {
    product = await ProductsService.getProductWithRecentHistory(productId)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', { productId })
      scope.setTag('section', 'ProductsService.getProductWithRecentHistory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_FIND_PRODUCT_WITH_RECENT_HISTORY,
    }
  }

  if (!product) {
    return {
      status: 404,
      response: PRODUCT_DOES_NOT_EXIST,
    }
  }

  const { original_price, discount_price, title, in_stock, status } = body

  if (isEmptyString(status)) {
    return {
      status: 400,
      response: MISSING_STATUS,
    }
  }

  if (!isStatusSupported(status)) {
    return {
      status: 422,
      response: INVALID_PRODUCT_STATUS,
    }
  }

  let newDiscountPrice
  let newOriginalPrice
  let newTitle
  let newInStock

  switch (status) {
    case 'ok': {
      if (isNotDefined(in_stock)) {
        return {
          status: 400,
          response: MISSING_IN_STOCK,
        }
      }

      // TODO: Проверять, что in_stock булево поле
      newInStock = in_stock

      if (isEmptyString(title)) {
        return {
          status: 400,
          response: MISSING_TITLE,
        }
      }

      newTitle = title.trim().slice(0, 512)

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

        newDiscountPrice = parseFloat(discount_price)
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

        newOriginalPrice = parseFloat(original_price)
      }

      let price

      // FIXME: Вынести в функцию
      if (newDiscountPrice && newOriginalPrice) {
        price =
          newDiscountPrice < newOriginalPrice
            ? newDiscountPrice
            : newOriginalPrice
      } else {
        if (newDiscountPrice) {
          if (!newOriginalPrice) {
            price = newDiscountPrice
          } else {
            price = newOriginalPrice
          }
        } else if (newOriginalPrice) {
          price = newOriginalPrice
        } else {
          price = 0
        }
      }

      if (newInStock) {
        // Если товар в наличии, у него должна быть хоть какая-то цена
        if (price === 0) {
          return {
            status: 400,
            response: MISSING_PRICES,
          }
        }

        if (!product.has_history) {
          break
        }

        if (!product.has_users) {
          break
        }

        if (!product.was_in_stock) {
          try {
            // FIXME: Надо подумать, как это запускать в фоне, чтобы быстрее освобождать браузер
            await TelegramService.productFirstTimeIsInStock(product, price)
          } catch (err) {
            console.error({ err })

            Sentry.withScope(function (scope) {
              scope.setContext('args', { product, price })
              scope.setTag(
                'section',
                'TelegramService.productFirstTimeIsInStock'
              )
              scope.setTag('crawler_id', crawlerId)
              Sentry.captureException(err)
            })
          }

          try {
            await UserProductsService.updateProductPriceForUsers(
              productId,
              price
            )
          } catch (err) {
            console.error({ err })

            Sentry.withScope(function (scope) {
              scope.setContext('args', { productId, price })
              scope.setTag(
                'section',
                'UserProductsService.updateProductPriceForUsers'
              )
              scope.setTag('crawler_id', crawlerId)
              Sentry.captureException(err)
            })

            return {
              status: 500,
              response: UNABLE_TO_UPDATE_USER_PRODUCTS_PRICE,
            }
          }

          break
        }

        if (product.recent_in_stock) {
          break
        }

        try {
          await TelegramService.productIsInStock(product, price)
        } catch (err) {
          console.error({ err })

          Sentry.withScope(function (scope) {
            scope.setContext('args', { product, price })
            scope.setTag('section', 'TelegramService.productIsInStock')
            scope.setTag('crawler_id', crawlerId)
            Sentry.captureException(err)
          })
        }
      }

      break
    }

    // NOTE: Этот статус пока присылает только парсер Озон в случае,
    // когда нас забанили, либо вылезла каптча, либо возникла внутренняя ошибка в Озоне.
    case 'skip': {
      return {
        status: 200,
        response: {},
      }
    }

    case 'required_to_change_location':
    case 'age_restriction':
    case 'not_found': {
      newOriginalPrice = null
      newDiscountPrice = null
      newTitle = null
    }
  }

  let history

  const productArgs = {
    originalPrice: newOriginalPrice,
    discountPrice: newDiscountPrice,
    inStock: newInStock,
    status,
    title: newTitle,
    crawlerId,
  }

  try {
    history = await addProductHistory(productId, productArgs)
  } catch (err) {
    console.error({ err })

    Sentry.withScope(function (scope) {
      scope.setContext('args', productArgs)
      scope.setTag('section', 'addProductHistory')
      scope.setTag('crawler_id', crawlerId)
      Sentry.captureException(err)
    })

    return {
      status: 500,
      response: UNABLE_TO_ADD_PRODUCT_HISTORY,
    }
  }

  return {
    status: 200,
    response: history,
  }
}
