import prisma from '../../src/lib/prisma'
import { CrawlersService as service } from '../../src/services/crawlers_service'
import { cleanDatabase, hourInMilliseconds } from '../helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('getOutdatedProducts', () => {
  const execution = async (lastUpdateInHours, productsLimit) => {
    return await service.getOutdatedProducts(lastUpdateInHours, productsLimit)
  }

  it('returns only matched products', async () => {
    const crawler = await prisma.crawler.create({
      data: {
        location: 'somewhere',
      },
    })

    await prisma.product.create({
      data: {
        url_hash: 'hash1',
        shop: 'ozon',
        url: 'https://domain1.tld',
        title: 'Product 1',
      },
    })

    await prisma.product.create({
      data: {
        url_hash: 'hash2',
        shop: 'ozon',
        url: 'https://domain2.tld',
        title: 'Product 2',
        history: {
          create: [
            {
              original_price: 1.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 2',
              crawler_id: crawler.id,
            },
          ],
        },
      },
    })

    await prisma.product.create({
      data: {
        url_hash: 'hash3',
        shop: 'ozon',
        url: 'https://domain3.tld',
        title: 'Product 3',
        history: {
          create: [
            {
              original_price: 1.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 3',
              crawler_id: crawler.id,
              created_at: new Date(Date.now() - 60 * 1000), // 1 minute ago
            },
          ],
        },
      },
    })

    await prisma.product.create({
      data: {
        url_hash: 'hash4',
        shop: 'ozon',
        url: 'https://domain4.tld',
        title: 'Product 4',
        history: {
          create: [
            {
              original_price: 3.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 4',
              crawler_id: crawler.id,
              created_at: new Date(Date.now() - hourInMilliseconds), // 1 hour ago
            },
          ],
        },
      },
    })

    await prisma.product.create({
      data: {
        url_hash: 'hash5',
        shop: 'ozon',
        url: 'https://domain5.tld',
        title: 'Product 5',
        history: {
          create: [
            {
              original_price: 1.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 5',
              crawler_id: crawler.id,
              created_at: new Date(Date.now() - hourInMilliseconds * 2), // 2 hours ago
            },
          ],
        },
      },
    })

    const product6 = await prisma.product.create({
      data: {
        url_hash: 'hash6',
        shop: 'ozon',
        url: 'https://domain6.tld',
        title: 'Product 6',
        history: {
          create: [
            {
              original_price: 1.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 6',
              crawler_id: crawler.id,
              created_at: new Date(Date.now() - hourInMilliseconds * 3), // 3 hours ago
            },
          ],
        },
      },
    })

    const product7 = await prisma.product.create({
      data: {
        url_hash: 'hash7',
        shop: 'ozon',
        url: 'https://domain7.tld',
        title: 'Product 7',
        history: {
          create: [
            {
              original_price: 1.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 7',
              crawler_id: crawler.id,
              created_at: new Date(Date.now() - hourInMilliseconds * 4), // 4 hours ago
            },
          ],
        },
      },
    })

    // Product is on hold
    await prisma.product.create({
      data: {
        url_hash: 'hash8',
        shop: 'ozon',
        url: 'https://domain8.tld',
        title: 'Product 8',
        status: 'hold',
        history: {
          create: [
            {
              original_price: 1.0,
              in_stock: true,
              status: 'ok',
              title: 'Product 8',
              crawler_id: crawler.id,
              created_at: new Date(Date.now() - hourInMilliseconds * 4), // 4 hours ago
            },
          ],
        },
      },
    })

    // Updated 2 hours ago and returns only 3 records
    const outdatedProducts = await execution(2, 3)

    expect(outdatedProducts[0].id).toEqual(product7.id)
    expect(outdatedProducts[1].id).toEqual(product6.id)
  })
})
