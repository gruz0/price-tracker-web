import prisma from '../../src/lib/prisma'

import { cleanDatabase } from '../helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('users', () => {
  let crawler1
  let product1
  let product2
  let product1History
  let product2History
  let user1
  let user2
  let user2ProductQueue
  let user1Product1
  let user2Product1
  let user2Product2
  let user2Product1Subscription
  let user2Product2Subscription
  let user1ProductsGroup1
  let user2ProductsGroup1
  let user2ProductsGroup1Item1
  let user2ProductsGroup1Item2

  const deleteUser1 = async () => {
    await prisma.user.delete({
      where: {
        id: user1.id,
      },
    })
  }

  beforeEach(async () => {
    crawler1 = await prisma.crawler.create({
      data: {
        location: 'somewhere',
      },
    })

    product1 = await prisma.product.create({
      data: {
        title: 'Product1',
        url: 'https://domain1.tld',
        url_hash: 'hash1',
        shop: 'shop',
      },
    })

    product2 = await prisma.product.create({
      data: {
        title: 'Product2',
        url: 'https://domain2.tld',
        url_hash: 'hash2',
        shop: 'shop',
      },
    })

    product1History = await prisma.productHistory.create({
      data: {
        product_id: product1.id,
        crawler_id: crawler1.id,
        status: 'not_found',
      },
    })

    product2History = await prisma.productHistory.create({
      data: {
        product_id: product2.id,
        crawler_id: crawler1.id,
        status: 'not_found',
      },
    })

    user1 = await prisma.user.create({
      data: {
        login: 'user1',
        password: 'password',
      },
    })

    user2 = await prisma.user.create({
      data: {
        login: 'user2',
        password: 'password',
      },
    })

    await prisma.productQueue.create({
      data: {
        url: 'https://domain3.tld',
        url_hash: 'hash3',
        requested_by_id: user1.id,
      },
    })

    user2ProductQueue = await prisma.productQueue.create({
      data: {
        url: 'https://domain4.tld',
        url_hash: 'hash4',
        requested_by_id: user2.id,
      },
    })

    user1Product1 = await prisma.userProduct.create({
      data: {
        user_id: user1.id,
        product_id: product1.id,
        price: 42,
        favorited: true,
      },
    })

    user2Product1 = await prisma.userProduct.create({
      data: {
        user_id: user2.id,
        product_id: product1.id,
        price: 42,
        favorited: true,
      },
    })

    user2Product2 = await prisma.userProduct.create({
      data: {
        user_id: user2.id,
        product_id: product2.id,
        price: 42,
        favorited: true,
      },
    })

    await prisma.userProductSubscription.create({
      data: {
        user_id: user1.id,
        product_id: product1.id,
        subscription_type: 'subscription1',
      },
    })

    user2Product1Subscription = await prisma.userProductSubscription.create({
      data: {
        user_id: user2.id,
        product_id: product1.id,
        subscription_type: 'subscription1',
      },
    })

    user2Product2Subscription = await prisma.userProductSubscription.create({
      data: {
        user_id: user2.id,
        product_id: product2.id,
        subscription_type: 'subscription1',
      },
    })

    user1ProductsGroup1 = await prisma.userProductsGroup.create({
      data: {
        user_id: user1.id,
        title: 'Products Group 1',
      },
    })

    user2ProductsGroup1 = await prisma.userProductsGroup.create({
      data: {
        user_id: user2.id,
        title: 'Products Group 2',
      },
    })

    await prisma.userProductsGroupItem.create({
      data: {
        user_id: user1.id,
        user_products_group_id: user1ProductsGroup1.id,
        user_product_id: user1Product1.id,
      },
    })

    user2ProductsGroup1Item1 = await prisma.userProductsGroupItem.create({
      data: {
        user_id: user2.id,
        user_products_group_id: user2ProductsGroup1.id,
        user_product_id: user2Product1.id,
      },
    })

    user2ProductsGroup1Item2 = await prisma.userProductsGroupItem.create({
      data: {
        user_id: user2.id,
        user_products_group_id: user2ProductsGroup1.id,
        user_product_id: user2Product2.id,
      },
    })
  })

  it('removes user1 related records from user_product_subscriptions', async () => {
    await deleteUser1()

    const result = await prisma.userProductSubscription.findMany()

    expect(result).toEqual([
      user2Product1Subscription,
      user2Product2Subscription,
    ])
  })

  it('removes user1 related records from user_products', async () => {
    await deleteUser1()

    const result = await prisma.userProduct.findMany()

    expect(result).toEqual([user2Product1, user2Product2])
  })

  it('removes user1 related records from products_queue', async () => {
    await deleteUser1()

    const result = await prisma.productQueue.findMany()

    expect(result).toEqual([user2ProductQueue])
  })

  it('removes user1 related records from user_products_groups', async () => {
    await deleteUser1()

    const result = await prisma.userProductsGroup.findMany()

    expect(result).toEqual([user2ProductsGroup1])
  })

  it('removes user1 related records from user_products_group_items', async () => {
    await deleteUser1()

    const result = await prisma.userProductsGroupItem.findMany()

    expect(result).toEqual([user2ProductsGroup1Item1, user2ProductsGroup1Item2])
  })

  it('does not remove product_history', async () => {
    await deleteUser1()

    const result = await prisma.productHistory.findMany()

    expect(result).toEqual([product1History, product2History])
  })

  it('does not remove products', async () => {
    await deleteUser1()

    const result = await prisma.product.findMany()

    expect(result).toEqual([product1, product2])
  })

  it('does not remove crawlers', async () => {
    await deleteUser1()

    const result = await prisma.crawler.findMany()

    expect(result).toEqual([crawler1])
  })
})
