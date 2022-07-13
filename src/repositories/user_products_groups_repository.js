import prisma from '../lib/prisma'

export const UserProductsGroupsRepository = {
  all: async (userId) => {
    return await prisma.$queryRaw`
      SELECT DISTINCT upg.id AS id
        , upg.user_id
        , upg.title
        , upg.image
        , upg.created_at
        , upg.updated_at
        , COUNT(upgi.id)::INTEGER AS products_count
      FROM user_products_groups upg
      LEFT JOIN user_products_group_items upgi ON upgi.user_products_group_id = upg.id
      WHERE upg.user_id = ${userId}::UUID
      GROUP BY upg.id
      ORDER BY upg.created_at DESC
    `
  },

  find: async (userId, productsGroupId) => {
    const productsGroups = await prisma.$queryRaw`
      SELECT DISTINCT upg.id AS id
        , upg.user_id
        , upg.title
        , upg.image
        , upg.created_at
        , upg.updated_at
        , COUNT(upgi.id)::INTEGER AS products_count
      FROM user_products_groups upg
      LEFT JOIN user_products_group_items upgi ON upgi.user_products_group_id = upg.id
      WHERE upg.user_id = ${userId}::UUID AND upg.id = ${productsGroupId}::UUID
      GROUP BY upg.id
      ORDER BY upg.title ASC
      LIMIT 1
    `

    if (productsGroups.length === 0) {
      return null
    }

    return productsGroups[0]
  },

  create: async (userId, title) => {
    return await prisma.userProductsGroup.create({
      data: {
        user_id: userId,
        title: title,
      },
    })
  },

  delete: async (userId, productsGroupId) => {
    return await prisma.userProductsGroup.deleteMany({
      where: {
        user_id: userId,
        id: productsGroupId,
      },
    })
  },
}
