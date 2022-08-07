import prisma from '../lib/prisma'

const findProductBy = async (condition) => {
  return await prisma.product.findUnique({
    where: condition,
  })
}

export const findProductById = async (id) => {
  return await findProductBy({ id: id })
}

export const findProductByURLHash = async (urlHash) => {
  return await findProductBy({ url_hash: urlHash })
}

export const getProductHistoryGroupedByLastRecordByDate = async (
  productId,
  limit = 30
) => {
  const history = await prisma.$queryRaw`
    SELECT ph.created_at
      , in_stock
      , status
      , original_price
      , discount_price
    FROM product_history ph
    INNER JOIN (
      SELECT MAX(created_at) AS created_at
      FROM product_history
      WHERE product_id = ${productId}::UUID AND status IN ('ok', 'not_found')
      GROUP BY DATE(created_at)
      ORDER BY created_at DESC
      LIMIT ${limit}
    ) sub ON sub.created_at = ph.created_at
    WHERE ph.product_id = ${productId}::UUID AND status IN ('ok', 'not_found')
    ORDER BY ph.created_at DESC
  `

  return history.map((h) => {
    return {
      ...h,
      created_at: new Date(h.created_at).toISOString(),
    }
  })
}

export const getProductSubscriptions = async (productId) => {
  return await prisma.userProductSubscription.findMany({
    where: {
      product_id: productId,
    },
  })
}

export const getTelegramAccountsSubscribedToProductChangeStatusToInStock =
  async (productId) => {
    return await prisma.$queryRaw`
      select distinct(u.telegram_account) as telegram_account, u.id
      from users u
      join user_product_subscriptions ups on ups.user_id = u.id
      join (
        select distinct on (product_id) product_id, in_stock
        from product_history
        order by product_id, created_at desc
      ) ph on ph.product_id = ups.product_id
      where u.telegram_account is not null
        and u.telegram_account <> ''
        and ups.subscription_type = 'on_change_status_to_in_stock'
        and ph.in_stock = false
        and ups.product_id = ${productId}::UUID
    `
  }

export const getUserProductSubscriptions = async (userId, productId) => {
  return await prisma.userProductSubscription.findMany({
    where: {
      product_id: productId,
      user_id: userId,
    },
    select: {
      id: true,
      subscription_type: true,
      payload: true,
    },
  })
}

export const getUserProductSubscription = async (
  userId,
  productId,
  subscriptionId
) => {
  return await prisma.userProductSubscription.findFirst({
    where: {
      id: subscriptionId,
      product_id: productId,
      user_id: userId,
    },
  })
}

export const getUserProductSubscriptionByType = async (
  userId,
  productId,
  subscriptionType
) => {
  return await prisma.userProductSubscription.findFirst({
    where: {
      product_id: productId,
      user_id: userId,
      subscription_type: subscriptionType,
    },
  })
}

export const removeUserProductSubscription = async (
  userId,
  productId,
  subscriptionId
) => {
  return await prisma.userProductSubscription.deleteMany({
    where: {
      id: subscriptionId,
      user_id: userId,
      product_id: productId,
    },
  })
}

export const removeUserProductSubscriptions = async (userId, productId) => {
  return await prisma.userProductSubscription.deleteMany({
    where: {
      user_id: userId,
      product_id: productId,
    },
  })
}

export const addProductSubscription = async (
  productId,
  userId,
  subscriptionType,
  payload = {}
) => {
  return prisma.userProductSubscription.create({
    data: {
      product_id: productId,
      user_id: userId,
      subscription_type: subscriptionType,
      payload: payload,
    },
  })
}

export const addNewProductToQueue = async ({ url_hash, url, requested_by }) => {
  const productQueue = await prisma.productQueue.findFirst({
    where: {
      url_hash: url_hash,
      requested_by_id: requested_by,
    },
  })

  if (productQueue) {
    return productQueue
  }

  return await prisma.productQueue.create({
    data: {
      url_hash: url_hash,
      url: url,
      requested_by_id: requested_by,
    },
  })
}
