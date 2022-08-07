import prisma from '../lib/prisma'

export const ProductRepository = {
  getOutdatedProducts: async (lastUpdateInHours = 3, productsLimit = 20) => {
    return await prisma.$queryRaw`
      SELECT p.id, p.url, p.image
      FROM products p
      JOIN (
        SELECT DISTINCT ON (product_id) product_id
          , ABS(DATE_PART('day', NOW() - created_at) * 24 - DATE_PART('hour', NOW() - created_at)) AS updated_hours_ago
          , created_at
        FROM product_history
        ORDER BY product_id, updated_hours_ago ASC
      ) ph ON ph.product_id = p.id
      WHERE ph.updated_hours_ago > ${lastUpdateInHours}::INTEGER
        AND p.status = 'active'
      ORDER BY ph.updated_hours_ago DESC
      LIMIT ${productsLimit}
    `
  },

  ownedByUsers: async (productId) => {
    return await prisma.userProduct.findMany({
      where: {
        product_id: productId,
      },
      select: {
        user_id: true,
      },
    })
  },

  changeStatusTo: async (productId, status) => {
    return await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        status: status,
      },
    })
  },

  getProductWithRecentHistory: async (productId) => {
    const products = await prisma.$queryRaw`
      SELECT p.id
        , p.title
        , p.url
        , COALESCE((SELECT in_stock FROM product_history WHERE product_id = ${productId}::UUID ORDER BY created_at DESC LIMIT 1), false) AS recent_in_stock
        , COALESCE((SELECT true FROM product_history WHERE product_id = ${productId}::UUID AND in_stock = TRUE), false) AS was_in_stock
        , COALESCE((SELECT true FROM product_history WHERE product_id = ${productId}::UUID LIMIT 1), false) AS has_history
        , COALESCE((SELECT true FROM user_products WHERE product_id = ${productId}::UUID LIMIT 1), false) AS has_users
      FROM products p
      WHERE p.id = ${productId}::UUID
    `

    if (products.length === 0) {
      return null
    }

    return products[0]
  },

  getRecentHistory: async (productId) => {
    const productHistory = await prisma.productHistory.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
      take: 1,
    })

    if (productHistory.length === 0) {
      return null
    }

    const lastProductHistory = productHistory[0]

    return lastProductHistory
  },
}
