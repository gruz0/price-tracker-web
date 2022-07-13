import {
  validateUserId,
  validateProductsGroupId,
  validateUserProductId,
} from '../lib/validators'
import { UserProductsGroupRepository as repo } from '../repositories/user_products_group_repository'
import { UserProductsGroupsRepository } from '../repositories/user_products_groups_repository'
import { UserProductsRepository } from '../repositories/user_products_repository'
import { UserRepository } from '../repositories/user_repository'

export const UserProductsGroupService = {
  getProductsInGroup: async (userId, productsGroupId) => {
    validateUserId(userId)
    validateProductsGroupId(productsGroupId)

    const groupItems = await repo.getItems(userId, productsGroupId)

    return groupItems.map((groupItem) => {
      return {
        ...groupItem,
        history_updated_at: groupItem.history_updated_at.toISOString(),
      }
    })
  },

  isItemExists: async (userId, productsGroupId, userProductId) => {
    validateUserId(userId)
    validateProductsGroupId(productsGroupId)
    validateUserProductId(userProductId)

    const item = await repo.findItem(userId, productsGroupId, userProductId)

    return item !== null
  },

  addItem: async (userId, productsGroupId, userProductId) => {
    validateUserId(userId)
    validateProductsGroupId(productsGroupId)
    validateUserProductId(userProductId)

    const user = await UserRepository.getUserById(userId)

    if (!user) {
      throw new Error('Пользователь не существует')
    }

    const userProduct =
      await UserProductsRepository.getByUserIdAndUserProductId(
        userId,
        userProductId
      )

    if (!userProduct) {
      throw new Error('Товара нет у пользователя')
    }

    const userProductsGroup = await UserProductsGroupsRepository.find(
      userId,
      productsGroupId
    )

    if (!userProductsGroup) {
      throw new Error('Группа товаров не существует')
    }

    const item = await repo.findItem(userId, productsGroupId, userProductId)

    if (item) {
      throw new Error('Товар уже имеется в группе товаров пользователя')
    }

    return await repo.addItem(userId, productsGroupId, userProductId)
  },
}
