import prisma from '../../src/lib/prisma'
import { getProductHistoryGroupedByLastRecordByDate } from '../../src/services/products'
import { cleanDatabase } from '../helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('getProductHistoryGroupedByLastRecordByDate', () => {
  it('returns only valid records', async () => {
    const crawler = await prisma.crawler.create({
      data: {
        location: 'Somewhere',
      },
    })

    const product = await prisma.product.create({
      data: {
        title: 'Product',
        url: 'https://domain.tld',
        url_hash: 'hash',
        shop: 'shop',
        created_at: new Date('2022-06-12 12:34:56'),
      },
    })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: product.id,
          crawler_id: crawler.id,
          status: 'not_found',
          created_at: new Date('2022-06-10 13:00:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          status: 'not_found',
          created_at: new Date('2022-06-11 13:00:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          status: 'not_found',
          created_at: new Date('2022-06-12 13:00:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          status: 'skip',
          created_at: new Date('2022-06-12 13:01:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          status: 'required_to_change_location',
          created_at: new Date('2022-06-12 13:02:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          original_price: 49,
          discount_price: 37,
          in_stock: false,
          status: 'ok',
          created_at: new Date('2022-06-12 13:00:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          original_price: 50,
          discount_price: 38,
          in_stock: true,
          status: 'ok',
          created_at: new Date('2022-06-12 13:01:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          original_price: 50,
          discount_price: 38,
          in_stock: true,
          status: 'ok',
          created_at: new Date('2022-06-13 11:59:00'),
        },
        {
          product_id: product.id,
          crawler_id: crawler.id,
          status: 'not_found',
          created_at: new Date('2022-06-13 12:00:00'),
        },
      ],
    })

    const skippedProduct = await prisma.product.create({
      data: {
        title: 'Product2',
        url: 'https://domain2.tld',
        url_hash: 'hash2',
        shop: 'shop',
        created_at: new Date('2022-06-13 12:34:56'),
      },
    })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: skippedProduct.id,
          crawler_id: crawler.id,
          original_price: 49,
          discount_price: 37,
          in_stock: false,
          status: 'ok',
          created_at: new Date('2022-06-13 12:00:00'),
        },
      ],
    })

    const result = await getProductHistoryGroupedByLastRecordByDate(
      product.id,
      3
    )

    expect(result).toEqual([
      {
        original_price: null,
        discount_price: null,
        in_stock: false,
        status: 'not_found',
        created_at: '2022-06-13T09:00:00.000Z',
      },
      {
        original_price: 50,
        discount_price: 38,
        in_stock: true,
        status: 'ok',
        created_at: '2022-06-12T10:01:00.000Z',
      },
      {
        original_price: null,
        discount_price: null,
        in_stock: false,
        status: 'not_found',
        created_at: '2022-06-11T10:00:00.000Z',
      },
    ])
  })
})
