import prisma from '../lib/prisma'

import { getProductHistoryGroupedByLastRecordByDate } from './products'

export const getUserProductWithActualStateAndHistory = async (
  userId,
  productId
) => {
  const productHistory = await getProductHistoryGroupedByLastRecordByDate(
    productId
  )

  // FIXME: Вынести в отдельную функцию
  const productActualState = await prisma.$queryRaw`select p.id as id
      , p.shop
      , p.url
      , p.title
      , p.image
      , last_product_history.price as last_price
      , last_product_history.in_stock
      , last_product_history.created_at as price_updated_at
      , products_history.min_price as lowest_price_ever
      , products_history.max_price as highest_price_ever
      , p.created_at as product_created_at
      , up.created_at as user_added_product_at
      , up.favorited
      , up.price as my_price
      , (up.price - last_product_history.price) as my_benefit
      , case when last_product_history.in_stock and up.price > last_product_history.price then true else false end as has_discount
    from user_products up
    join products p on p.id = up.product_id
    left join (
      select product_id,
        min(min_price) as min_price,
        max(max_price) as max_price
      from (
        select distinct(product_history.product_id) as product_id
          , least(product_history.discount_price, product_history.original_price) as min_price
          , greatest(product_history.discount_price, product_history.original_price) as max_price
        from product_history
        where status = 'ok'
        group by product_id, min_price, max_price
      ) products_history
      group by product_id
    ) products_history on products_history.product_id = up.product_id
    left join (
      select distinct on (product_id) product_id
        , coalesce(discount_price, original_price) as price
        , created_at
        , in_stock
      from product_history
      where status = 'ok'
      order by product_id, created_at desc
    ) last_product_history on last_product_history.product_id = up.product_id
    where up.user_id = ${userId} and up.product_id = ${productId}
    order by price_updated_at DESC
  `

  return {
    product: productActualState[0],
    history: productHistory,
  }
}

export const getUserProductsWithActualState = async (userId) => {
  const userProducts = await prisma.$queryRaw`select p.id as id
      , p.shop
      , p.url
      , p.title
      , p.image
      , last_product_history.price as last_price
      , last_product_history.in_stock
      , last_product_history.created_at as price_updated_at
      , products_history.min_price as lowest_price_ever
      , products_history.max_price as highest_price_ever
      , p.created_at as product_created_at
      , up.favorited
      , up.price as my_price
      , (up.price - last_product_history.price) as my_benefit
      , case when last_product_history.in_stock and up.price > last_product_history.price then true else false end as has_discount
    from user_products up
    join products p on p.id = up.product_id
    left join (
      select product_id,
        min(min_price) as min_price,
        max(max_price) as max_price
      from (
        select distinct(product_history.product_id) as product_id
          , least(product_history.discount_price, product_history.original_price) as min_price
          , greatest(product_history.discount_price, product_history.original_price) as max_price
        from product_history
        group by product_id, min_price, max_price
      ) products_history
      group by product_id
    ) products_history on products_history.product_id = up.product_id
    join (
      select distinct on (product_id) product_id
        , coalesce(discount_price, original_price) as price
        , created_at
        , in_stock
      from product_history
      order by product_id, created_at desc
    ) last_product_history on last_product_history.product_id = up.product_id
    where up.user_id = ${userId}
    order by price_updated_at DESC
  `

  return userProducts
}

export const addProductToUser = async (userId, productId, productPrice) => {
  return await prisma.userProduct.create({
    data: {
      user_id: userId,
      product_id: productId,
      price: productPrice,
      favorited: false,
    },
  })
}

export const getUserProduct = async (userId, productId) => {
  const userProduct = await prisma.userProduct.findFirst({
    where: {
      product_id: productId,
      user_id: userId,
    },
    include: {
      product: {
        select: {
          title: true,
        },
      },
    },
  })

  if (!userProduct) {
    return null
  }

  return {
    id: userProduct.product_id,
    price: userProduct.price,
    created_at: userProduct.created_at,
    favorited: userProduct.favorited,
    title: userProduct.product.title,
  }
}

export const removeProductWithSubscriptionsFromUser = async (
  userId,
  productId
) => {
  await prisma.$transaction([
    prisma.userProductSubscription.deleteMany({
      where: {
        user_id: userId,
        product_id: productId,
      },
    }),

    prisma.userProduct.deleteMany({
      where: {
        user_id: userId,
        product_id: productId,
      },
    }),
  ])
}
