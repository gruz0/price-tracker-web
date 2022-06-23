import prisma from '../../../../../../../src/lib/prisma'
const uuid = require('uuid')

import {
  cleanDatabase,
  mockAuthorizedPUTRequest,
} from '../../../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/crawlers/products/[product_id]/index'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_STATUS,
  INVALID_PRODUCT_STATUS,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  MISSING_PRODUCT_ID,
  INVALID_PRODUCT_UUID,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_IN_STOCK,
} from '../../../../../../../src/lib/messages'
import { parseJSON } from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'

const ENDPOINT = '/api/v1/crawlers/products/[product_id]'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

const whenNotAuthorized = (method) => {
  describe('when not authorized', () => {
    whenMissingAuthorizationHeader(
      method,
      handler,
      MISSING_AUTHORIZATION_HEADER
    )

    whenMissingBearer(method, handler, MISSING_BEARER_KEY)
    whenMissingToken(method, handler, MISSING_TOKEN)
    whenTokenIsNotUUID(method, handler, 400, INVALID_TOKEN_UUID)
    whenTokenNotFound(method, handler, 404, CRAWLER_DOES_NOT_EXIST)
  })
}

const ensureMethodNotAllowed = (method, url) => {
  describe(`${method} ${url}`, () => {
    test('returns error', async () => {
      const { req, res } = createMocks({
        method: method,
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(METHOD_NOT_ALLOWED)
      expect(res._getStatusCode()).toBe(405)
    })
  })
}

ensureMethodNotAllowed('GET', ENDPOINT)
ensureMethodNotAllowed('POST', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`PUT ${ENDPOINT}`, () => {
  whenNotAuthorized('PUT')

  describe('when authorized', () => {
    let crawler

    beforeEach(async () => {
      crawler = await prisma.crawler.create({
        data: {
          location: 'somewhere',
        },
      })
    })

    describe('when missing product_id in query', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token, {
          product_id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token, {
          product_id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCT_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when missing status', () => {
      test('returns error', async () => {
        const product = await prisma.product.create({
          data: {
            url_hash: 'hash',
            shop: 'ozon',
            url: 'https://domain.tld',
            title: 'Product',
          },
        })

        const { req, res } = mockAuthorizedPUTRequest(
          crawler.token,
          {
            product_id: product.id,
          },
          {}
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_STATUS)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when missing in_stock', () => {
      test('returns error', async () => {
        const product = await prisma.product.create({
          data: {
            url_hash: 'hash',
            shop: 'ozon',
            url: 'https://domain.tld',
            title: 'Product',
          },
        })

        const { req, res } = mockAuthorizedPUTRequest(
          crawler.token,
          {
            product_id: product.id,
          },
          {
            status: 'qwe',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_IN_STOCK)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when status is not supported', () => {
      test('returns error', async () => {
        const product = await prisma.product.create({
          data: {
            url_hash: 'hash',
            shop: 'ozon',
            url: 'https://domain.tld',
            title: 'Product',
          },
        })

        const { req, res } = mockAuthorizedPUTRequest(
          crawler.token,
          {
            product_id: product.id,
          },
          {
            status: 'qwe',
            in_stock: true,
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_STATUS)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when status === skip', () => {
      test.todo('It does nothing')
    })

    describe('when only original_price is set', () => {
      describe('when price is negative', () => {
        test('returns error', async () => {
          const product = await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'ok',
              in_stock: true,
              title: 'New Title',
              original_price: -1,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(ORIGINAL_PRICE_MUST_BE_POSITIVE)
          expect(res._getStatusCode()).toBe(422)
        })
      })

      describe('when price is zero', () => {
        test('returns error', async () => {
          const product = await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'ok',
              in_stock: true,
              title: 'New Title',
              original_price: 0,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(ORIGINAL_PRICE_MUST_BE_POSITIVE)
          expect(res._getStatusCode()).toBe(422)
        })
      })
    })

    describe('when only discount_price is set', () => {
      describe('when price is negative', () => {
        test('returns error', async () => {
          const product = await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'ok',
              in_stock: true,
              title: 'New Title',
              discount_price: -1,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(DISCOUNT_PRICE_MUST_BE_POSITIVE)
          expect(res._getStatusCode()).toBe(422)
        })
      })

      describe('when price is zero', () => {
        test('returns error', async () => {
          const product = await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'ok',
              in_stock: true,
              title: 'New Title',
              discount_price: 0,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(DISCOUNT_PRICE_MUST_BE_POSITIVE)
          expect(res._getStatusCode()).toBe(422)
        })
      })
    })

    describe('when all fields are set', () => {
      test('adds product history', async () => {
        const product = await prisma.product.create({
          data: {
            url_hash: 'hash',
            shop: 'ozon',
            url: 'https://domain.tld',
            title: 'Product',
          },
        })

        const { req, res } = mockAuthorizedPUTRequest(
          crawler.token,
          {
            product_id: product.id,
          },
          {
            status: 'ok',
            in_stock: true,
            original_price: 42,
            discount_price: 35,
            title: 'New Title',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const productHistory = await prisma.productHistory.findMany({
          where: { product_id: product.id },
        })

        expect(productHistory.length).toEqual(1)

        expect(productHistory[0].title).toEqual('New Title')
        expect(productHistory[0].original_price).toEqual(42)
        expect(productHistory[0].discount_price).toEqual(35)
        expect(productHistory[0].in_stock).toEqual(true)
        expect(productHistory[0].status).toEqual('ok')
        expect(productHistory[0].crawler_id).toEqual(crawler.id)
      })

      test.todo('It sends message to Telegram')
    })
  })
})
