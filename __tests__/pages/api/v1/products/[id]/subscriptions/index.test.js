import prisma from '../../../../../../../src/lib/prisma'
const uuid = require('uuid')

import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/products/[id]/subscriptions'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_PRODUCT_ID,
  USER_DOES_NOT_HAVE_PRODUCT,
  USER_DOES_NOT_HAVE_LINKED_TELEGRAM_ACCOUNT,
  MISSING_SUBSCRIPTION_TYPE,
  SUBSCRIPTION_TYPE_IS_NOT_VALID,
  USER_ALREADY_SUBSCRIBED_TO_SUBSCRIPTION_TYPE,
  INVALID_PRODUCT_UUID,
} from '../../../../../../../src/lib/messages'
import {
  cleanDatabase,
  mockAuthorizedDELETERequest,
  mockAuthorizedGETRequest,
  mockAuthorizedPOSTRequest,
  parseJSON,
} from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'

const ENDPOINT = '/api/v1/products/[id]/subscriptions'

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

    describe('when user does not have product subscriptions', () => {
      test('returns empty response', async () => {
        const product = await prisma.product.create({
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

        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual({})
        expect(res._getStatusCode()).toBe(200)
      })
    })

    describe('when user has product subscriptions', () => {
      test('returns response', async () => {
        const product = await prisma.product.create({
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

        const firstSubscription = await prisma.userProductSubscription.create({
          data: {
            id: uuid.v4(),
            user_id: user.id,
            product_id: product.id,
            subscription_type: 'subscription1',
          },
        })

        const secondSubscription = await prisma.userProductSubscription.create({
          data: {
            id: uuid.v4(),
            user_id: user.id,
            product_id: product.id,
            subscription_type: 'subscription2',
            payload: {
              some: 'content',
            },
          },
        })

        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual({
          subscription1: {
            id: firstSubscription.id,
            payload: null,
          },
          subscription2: {
            id: secondSubscription.id,
            payload: {
              some: 'content',
            },
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
        const { req, res } = mockAuthorizedDELETERequest(user.token, {})

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

    describe('when user has product subscriptions', () => {
      test('removes subscriptions', async () => {
        const product = await prisma.product.create({
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

        await prisma.userProductSubscription.create({
          data: {
            id: uuid.v4(),
            user_id: user.id,
            product_id: product.id,
            subscription_type: 'subscription1',
          },
        })

        await prisma.userProductSubscription.create({
          data: {
            id: uuid.v4(),
            user_id: user.id,
            product_id: product.id,
            subscription_type: 'subscription2',
            payload: {
              some: 'content',
            },
          },
        })

        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual({})
        expect(res._getStatusCode()).toBe(200)

        const subscription1 = await prisma.userProductSubscription.findUnique({
          where: {
            user_id_product_id_subscription_type: {
              user_id: user.id,
              product_id: product.id,
              subscription_type: 'subscription1',
            },
          },
        })

        expect(subscription1).toBeNull()

        const subscription2 = await prisma.userProductSubscription.findUnique({
          where: {
            user_id_product_id_subscription_type: {
              user_id: user.id,
              product_id: product.id,
              subscription_type: 'subscription2',
            },
          },
        })

        expect(subscription2).toBeNull()
      })
    })
  })
})

describe(`POST ${ENDPOINT}`, () => {
  whenNotAuthorized('POST')

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
        const { req, res } = mockAuthorizedDELETERequest(user.token, {})

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
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

    describe('when user does not have telegram account', () => {
      test('returns error', async () => {
        const product = await prisma.product.create({
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

        const { req, res } = mockAuthorizedPOSTRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(
          USER_DOES_NOT_HAVE_LINKED_TELEGRAM_ACCOUNT
        )
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when subscription_type missing', () => {
      test('returns error', async () => {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            telegram_account: 'qwe',
          },
        })

        const product = await prisma.product.create({
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

        const { req, res } = mockAuthorizedPOSTRequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_SUBSCRIPTION_TYPE)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when subscription_type is not supported', () => {
      test('returns error', async () => {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            telegram_account: 'qwe',
          },
        })

        const product = await prisma.product.create({
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

        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {
            id: product.id,
          },
          {
            subscription_type: 'unknown',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(SUBSCRIPTION_TYPE_IS_NOT_VALID)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when user has subscription for the product', () => {
      test('does nothing', async () => {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            telegram_account: 'qwe',
          },
        })

        const product = await prisma.product.create({
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

        await prisma.userProductSubscription.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            subscription_type: 'on_change_status_to_in_stock',
          },
        })

        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {
            id: product.id,
          },
          {
            subscription_type: 'on_change_status_to_in_stock',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(
          USER_ALREADY_SUBSCRIBED_TO_SUBSCRIPTION_TYPE
        )
        expect(res._getStatusCode()).toBe(200)
      })
    })

    describe('when user does not have subscription for the product', () => {
      test('returns response', async () => {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            telegram_account: 'qwe',
          },
        })

        const product = await prisma.product.create({
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

        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {
            id: product.id,
          },
          {
            subscription_type: 'on_change_status_to_in_stock',
          }
        )

        await handler(req, res)

        const response = parseJSON(res)
        expect(response.id).not.toBeNull()
        expect(response.subscription_type).toEqual(
          'on_change_status_to_in_stock'
        )
        expect(response.user_id).toEqual(user.id)
        expect(response.product_id).toEqual(product.id)
        expect(response.payload).toEqual({})

        expect(res._getStatusCode()).toBe(201)
      })

      test('adds subscription', async () => {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            telegram_account: 'qwe',
          },
        })

        const product = await prisma.product.create({
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

        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {
            id: product.id,
          },
          {
            subscription_type: 'on_change_status_to_in_stock',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)

        const createdSubscription =
          await prisma.userProductSubscription.findUnique({
            where: {
              user_id_product_id_subscription_type: {
                product_id: product.id,
                user_id: user.id,
                subscription_type: 'on_change_status_to_in_stock',
              },
            },
          })

        expect(createdSubscription).not.toBeNull()
      })
    })
  })
})
