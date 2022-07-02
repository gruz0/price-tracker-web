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
  let user2product1
  let user2product2
  let user2product1Subscription
  let user2product2Subscription

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

    await prisma.userProduct.create({
      data: {
        user_id: user1.id,
        product_id: product1.id,
        price: 42,
        favorited: true,
      },
    })

    user2product1 = await prisma.userProduct.create({
      data: {
        user_id: user2.id,
        product_id: product1.id,
        price: 42,
        favorited: true,
      },
    })

    user2product2 = await prisma.userProduct.create({
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

    user2product1Subscription = await prisma.userProductSubscription.create({
      data: {
        user_id: user2.id,
        product_id: product1.id,
        subscription_type: 'subscription1',
      },
    })

    user2product2Subscription = await prisma.userProductSubscription.create({
      data: {
        user_id: user2.id,
        product_id: product2.id,
        subscription_type: 'subscription1',
      },
    })
  })

  test('removes user1 related records from user_product_subscriptions', async () => {
    await deleteUser1()

    const userProductSubscriptions =
      await prisma.userProductSubscription.findMany()

    expect(userProductSubscriptions.length).toEqual(2)
    expect(userProductSubscriptions[0].id).toEqual(user2product1Subscription.id)
    expect(userProductSubscriptions[1].id).toEqual(user2product2Subscription.id)
  })

  test('removes user1 related records from user_products', async () => {
    await deleteUser1()

    const userProducts = await prisma.userProduct.findMany()

    expect(userProducts.length).toEqual(2)
    expect(userProducts[0].id).toEqual(user2product1.id)
    expect(userProducts[1].id).toEqual(user2product2.id)
  })

  test('removes user1 related records from products_queue', async () => {
    await deleteUser1()

    const queuedProducts = await prisma.productQueue.findMany()

    expect(queuedProducts.length).toEqual(1)
    expect(queuedProducts[0].id).toEqual(user2ProductQueue.id)
  })

  test('does not remove product_history', async () => {
    await deleteUser1()

    const productHistories = await prisma.productHistory.findMany()

    expect(productHistories.length).toEqual(2)
    expect(productHistories[0].id).toEqual(product1History.id)
    expect(productHistories[1].id).toEqual(product2History.id)
  })

  test('does not remove products', async () => {
    await deleteUser1()

    const products = await prisma.product.findMany()

    expect(products.length).toEqual(2)
    expect(products[0].id).toEqual(product1.id)
    expect(products[1].id).toEqual(product2.id)
  })

  test('does not remove crawlers', async () => {
    await deleteUser1()

    const crawlers = await prisma.crawler.findMany()

    expect(crawlers.length).toEqual(1)
    expect(crawlers[0].id).toEqual(crawler1.id)
  })
})
