import {
  validateProductId,
  validateUserId,
  validateUserProductId,
} from '../lib/validators'
import { UserProductsRepository as repo } from '../repositories/user_products_repository'

export const UserProductsService = {
  all: async (userId) => {
    validateUserId(userId)

    return await repo.all(userId)
  },

  getByUserIdAndProductId: async (userId, productId) => {
    validateUserId(userId)
    validateProductId(productId)

    const userProduct = await repo.getByUserIdAndProductId(userId, productId)

    if (!userProduct) {
      return null
    }

    return {
      user_product_id: userProduct.id,
      id: userProduct.product_id,
      price: userProduct.price,
      created_at: userProduct.created_at,
      favorited: userProduct.favorited,
      title: userProduct.product.title,
      shop: userProduct.product.shop,
      url: userProduct.product.url,
    }
  },

  findForUser: async (userId, userProductId) => {
    validateUserId(userId)
    validateUserProductId(userProductId)

    return await repo.getByUserIdAndUserProductId(userId, userProductId)
  },

  findAllProductsGroups: async (userId, userProductId) => {
    validateUserId(userId)
    validateUserProductId(userProductId)

    return await repo.findAllProductsGroups(userId, userProductId)
  },
}
