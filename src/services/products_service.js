import { validateProductId } from '../lib/validators'
import { ProductRepository as repo } from '../repositories/product_repository'

export const ProductsService = {
  isOwnedByUsers: async (productId) => {
    validateProductId(productId)

    const ownedByUsers = await repo.ownedByUsers(productId)

    return ownedByUsers.length > 0
  },

  moveToHold: async (productId) => {
    validateProductId(productId)

    return await repo.changeStatusTo(productId, 'hold')
  },

  moveToActive: async (productId) => {
    validateProductId(productId)

    return await repo.changeStatusTo(productId, 'active')
  },

  getProductWithRecentHistory: async (productId) => {
    validateProductId(productId)

    return await repo.getProductWithRecentHistory(productId)
  },

  getRecentHistory: async (productId) => {
    validateProductId(productId)

    const history = await repo.getRecentHistory(productId)

    if (!history) {
      return null
    }

    const {
      status,
      discount_price: discountPrice,
      original_price: originalPrice,
      in_stock,
    } = history

    let price = 0

    if (status === 'ok') {
      if (discountPrice && originalPrice) {
        price = discountPrice < originalPrice ? discountPrice : originalPrice
      } else {
        if (discountPrice) {
          price = discountPrice
        }

        if (originalPrice) {
          price = originalPrice
        }
      }
    }

    return {
      status,
      in_stock,
      price,
    }
  },
}
