import prisma from '../../../../../../src/lib/prisma'
const uuid = require('uuid')

import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../src/pages/api/v1/products/[id]/history'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
  MISSING_PRODUCT_ID,
  INVALID_PRODUCT_UUID,
  PRODUCT_DOES_NOT_EXIST,
  USER_DOES_NOT_HAVE_PRODUCT,
} from '../../../../../../src/lib/messages'
import {
  cleanDatabase,
  mockAuthorizedGETRequest,
  parseJSON,
} from '../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../matchers'

const ENDPOINT = '/api/v1/products/[id]/history'

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
    whenTokenNotFound(method, handler, 403, FORBIDDEN)
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

ensureMethodNotAllowed('POST', ENDPOINT)
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`GET ${ENDPOINT}`, () => {
  whenNotAuthorized('GET')

  describe('when authorized', () => {
    let user

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })
    })

    describe('when product_id missing', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCT_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when user does not have product', () => {
      test('returns error', async () => {
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
          },
        })

        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(USER_DOES_NOT_HAVE_PRODUCT)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('without product history', () => {
      test('returns response', async () => {
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
            created_at: new Date('2022-06-12 12:34:56'),
          },
        })

        const userProduct = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42,
            favorited: true,
            created_at: new Date('2022-06-13 12:34:56'),
          },
        })

        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual({
          history: [],
          product: {
            id: product.id,
            title: product.title,
            shop: product.shop,
            url: product.url,
            image: null,
            favorited: true,
            has_discount: false,
            in_stock: null,
            last_price: null,
            my_price: userProduct.price,
            highest_price_ever: null,
            lowest_price_ever: null,
            my_benefit: null,
            price_updated_at: null,
            product_created_at: '2022-06-12T09:34:56+00:00',
            user_added_product_at: '2022-06-13T09:34:56+00:00',
          },
        })
        expect(res._getStatusCode()).toBe(200)
      })
    })

    describe('with product history', () => {
      describe('when no valid history records', () => {
        test('returns response', async () => {
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
                created_at: new Date('2022-06-12 13:00:00'),
              },
            ],
          })

          const userProduct = await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
              favorited: true,
              created_at: new Date('2022-06-13 12:34:56'),
            },
          })

          const { req, res } = mockAuthorizedGETRequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual({
            history: [
              {
                original_price: null,
                discount_price: null,
                in_stock: false,
                status: 'not_found',
                created_at: '2022-06-12T10:00:00.000Z',
              },
            ],
            product: {
              id: product.id,
              title: product.title,
              shop: product.shop,
              url: product.url,
              image: null,
              favorited: true,
              has_discount: false,
              in_stock: null,
              last_price: null,
              my_price: userProduct.price,
              highest_price_ever: null,
              lowest_price_ever: null,
              my_benefit: null,
              price_updated_at: null,
              product_created_at: '2022-06-12T09:34:56+00:00',
              user_added_product_at: '2022-06-13T09:34:56+00:00',
            },
          })
          expect(res._getStatusCode()).toBe(200)
        })
      })

      describe('with valid history records', () => {
        test('returns response', async () => {
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
            ],
          })

          const userProduct = await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
              favorited: true,
              created_at: new Date('2022-06-13 12:34:56'),
            },
          })

          const { req, res } = mockAuthorizedGETRequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual({
            history: [
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
                created_at: '2022-06-12T10:00:00.000Z',
              },
            ],
            product: {
              id: product.id,
              title: product.title,
              shop: product.shop,
              url: product.url,
              image: null,
              favorited: true,
              has_discount: true,
              in_stock: true,
              last_price: 38,
              my_price: userProduct.price,
              highest_price_ever: 50,
              lowest_price_ever: 38,
              my_benefit: 4,
              price_updated_at: '2022-06-12T10:01:00+00:00',
              product_created_at: '2022-06-12T09:34:56+00:00',
              user_added_product_at: '2022-06-13T09:34:56+00:00',
            },
          })
          expect(res._getStatusCode()).toBe(200)
        })
      })
    })
  })
})
