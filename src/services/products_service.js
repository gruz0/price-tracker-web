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
}
