import {
  isEmptyString,
  validateUserId,
  validateProductsGroupId,
} from '../lib/validators'
import { UserProductsGroupsRepository as repo } from '../repositories/user_products_groups_repository'
import { UserRepository } from '../repositories/user_repository'

const ensureUserExists = async (userId) => {
  const user = await UserRepository.getUserById(userId)

  if (!user) {
    throw new Error('Пользователь не существует')
  }
}

const ensureProductsGroupExists = async (userId, productsGroupId) => {
  const productsGroup = await repo.find(userId, productsGroupId)

  if (!productsGroup) {
    throw new Error('Группа товаров не существует')
  }
}

const buildProductsGroup = (productsGroup) => {
  return {
    id: productsGroup.id,
    title: productsGroup.title.trim(),
    image: productsGroup.image,
    products_count: productsGroup.products_count,
    created_at: productsGroup.created_at.toISOString(),
  }
}

export const UserProductsGroupsService = {
  all: async (userId) => {
    validateUserId(userId)
    await ensureUserExists(userId)

    const productsGroups = await repo.all(userId)

    return productsGroups.map((productsGroup) =>
      buildProductsGroup(productsGroup)
    )
  },

  find: async (userId, productsGroupId) => {
    validateUserId(userId)
    validateProductsGroupId(productsGroupId)
    await ensureUserExists(userId)

    const productsGroup = await repo.find(userId, productsGroupId)

    if (!productsGroup) {
      return null
    }

    return buildProductsGroup(productsGroup)
  },

  create: async (userId, title) => {
    validateUserId(userId)

    if (isEmptyString(title)) {
      throw new Error('Не заполнен title')
    }

    await ensureUserExists(userId)

    return await repo.create(userId, title.toString().trim())
  },

  delete: async (userId, productsGroupId) => {
    validateUserId(userId)
    validateProductsGroupId(productsGroupId)
    await ensureUserExists(userId)
    await ensureProductsGroupExists(userId, productsGroupId)

    return await repo.delete(userId, productsGroupId)
  },
}
