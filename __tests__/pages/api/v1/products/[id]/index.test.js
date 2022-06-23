import prisma from '../../../../../../src/lib/prisma'
const uuid = require('uuid')

import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../src/pages/api/v1/products/[id]'
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
  mockAuthorizedDELETERequest,
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

const ENDPOINT = '/api/v1/products/[id]'

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

    describe('when all is good', () => {
      test('returns response', async () => {
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
          },
        })

        const userProduct = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42,
            favorited: true,
            created_at: new Date('2022-06-11 12:34:56'),
          },
        })

        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual({
          product: {
            id: product.id,
            price: userProduct.price,
            title: product.title,
            favorited: true,
            created_at: '2022-06-11T09:34:56.000Z',
          },
        })
        expect(res._getStatusCode()).toBe(200)
      })
    })
  })
})

describe(`DELETE ${ENDPOINT}`, () => {
  whenNotAuthorized('DELETE')

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
        const { req, res } = mockAuthorizedDELETERequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
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

        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(USER_DOES_NOT_HAVE_PRODUCT)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when all is good', () => {
      let product

      beforeEach(async () => {
        product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
          },
        })

        await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42,
          },
        })
      })

      test('does not remove product', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        expect(parseJSON(res)).toEqual({})

        const existedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        })

        expect(existedProduct).not.toBeNull()
      })

      test('removes product from user', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        expect(parseJSON(res)).toEqual({})

        const existedUserProduct = await prisma.userProduct.findUnique({
          where: {
            user_id_product_id: { user_id: user.id, product_id: product.id },
          },
        })

        expect(existedUserProduct).toBeNull()
      })

      describe('when user has product subscriptions', () => {
        test('removes product subscriptions', async () => {
          await prisma.userProductSubscription.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              subscription_type: 'unknown',
            },
          })

          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)
          expect(parseJSON(res)).toEqual({})

          const existedUserProductSubscription =
            await prisma.userProductSubscription.findUnique({
              where: {
                user_id_product_id_subscription_type: {
                  user_id: user.id,
                  product_id: product.id,
                  subscription_type: 'unknown',
                },
              },
            })

          expect(existedUserProductSubscription).toBeNull()
        })
      })
    })
  })
})
