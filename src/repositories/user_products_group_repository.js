import prisma from '../lib/prisma'

export const UserProductsGroupRepository = {
  getItems: async (userId, productsGroupId) => {
    // Порядок сортировки результатов:
    // 1. Страницы товаров существуют
    // 2. Товары в наличии
    // 3. По цене от меньшей к большей
    return await prisma.$queryRaw`
      SELECT *
      FROM (
        SELECT DISTINCT ON (ph.product_id) product_id
          , LEAST(ph.discount_price, ph.original_price) AS history_min_price
          , ph.in_stock AS history_in_stock
          , ph.created_at AS history_updated_at
          , products.title AS product_title
          , products.url AS product_url
          , products.shop AS product_shop
          , CASE WHEN ph.status = 'ok' THEN true ELSE false END AS product_exists
        FROM product_history ph
        JOIN (
          SELECT p.id AS upgi_product_id
          FROM user_products_group_items upgi
          JOIN user_products up ON up.id = upgi.user_product_id
          JOIN products p ON p.id = up.product_id
          WHERE upgi.user_id = ${userId}::UUID
            AND upgi.user_products_group_id = ${productsGroupId}::UUID
        ) d ON d.upgi_product_id = ph.product_id
        JOIN products ON products.id = d.upgi_product_id
        WHERE ph.status IN ('ok', 'not_found')
        ORDER BY ph.product_id, ph.created_at DESC
      ) AS r
      ORDER BY product_exists::INTEGER DESC, history_in_stock::INTEGER DESC, history_min_price ASC
    `
  },

  findItem: async (userId, productsGroupId, userProductId) => {
    return await prisma.userProductsGroupItem.findUnique({
      where: {
        user_id_user_products_group_id_user_product_id: {
          user_id: userId,
          user_products_group_id: productsGroupId,
          user_product_id: userProductId,
        },
      },
    })
  },

  addItem: async (userId, productsGroupId, userProductId) => {
    return await prisma.userProductsGroupItem.create({
      data: {
        user_id: userId,
        user_products_group_id: productsGroupId,
        user_product_id: userProductId,
      },
    })
  },
}
