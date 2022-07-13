import prisma from '../lib/prisma'

export const UserProductsRepository = {
  all: async (userId) => {
    return await prisma.$queryRaw`
      SELECT p.id AS product_id, up.id AS user_product_id, p.title
      FROM user_products up
      JOIN products p ON p.id = up.product_id
      WHERE up.user_id = ${userId}::UUID
      ORDER BY p.title ASC
    `
  },

  getByUserIdAndUserProductId: async (userId, userProductId) => {
    return await prisma.userProduct.findFirst({
      where: {
        user_id: userId,
        id: userProductId,
      },
    })
  },

  getByUserIdAndProductId: async (userId, productId) => {
    return await prisma.userProduct.findFirst({
      where: {
        product_id: productId,
        user_id: userId,
      },
      include: {
        product: {
          select: {
            title: true,
            shop: true,
          },
        },
      },
    })
  },

  findAllProductsGroups: async (userId, userProductId) => {
    const productsGroups = await prisma.userProductsGroupItem.findMany({
      where: {
        user_id: userId,
        user_product_id: userProductId,
      },
      select: {
        user_products_group_id: true,
      },
    })

    if (productsGroups.length === 0) {
      return []
    }

    const productsGroupIds = productsGroups.map((p) => p.user_products_group_id)

    return await prisma.userProductsGroup.findMany({
      where: {
        id: {
          in: productsGroupIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    })
  },
}
