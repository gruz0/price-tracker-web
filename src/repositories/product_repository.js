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
}
