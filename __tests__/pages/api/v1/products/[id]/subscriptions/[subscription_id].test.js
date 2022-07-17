import prisma from '../../../../../../../src/lib/prisma'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/products/[id]/subscriptions/[subscription_id]'
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
  MISSING_SUBSCRIPTION_ID,
  USER_DOES_NOT_HAVE_PRODUCT_SUBSCRIPTION,
  INVALID_PRODUCT_UUID,
  INVALID_SUBSCRIPTION_UUID,
} from '../../../../../../../src/lib/messages'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
  mockAuthorizedDELETERequest,
  parseJSON,
} from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'
const uuid = require('uuid')

const ENDPOINT = '/api/v1/products/[id]/subscriptions/[subscription_id]'

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

ensureMethodNotAllowed('GET', ENDPOINT)
ensureMethodNotAllowed('POST', ENDPOINT)
ensureMethodNotAllowed('PUT', ENDPOINT)

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

    describe('when product exists', () => {
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
      })

      describe('when user does not have product', () => {
        test('returns error', async () => {
          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(USER_DOES_NOT_HAVE_PRODUCT)
          expect(res._getStatusCode()).toBe(404)
        })
      })

      describe('when subscription_id missing', () => {
        test('returns error', async () => {
          await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })

          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(MISSING_SUBSCRIPTION_ID)
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when subscription_id is not a valid UUID', () => {
        test('returns error', async () => {
          await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })

          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
            subscription_id: 'qwe',
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(INVALID_SUBSCRIPTION_UUID)
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when subscription_id does not exist', () => {
        test('returns error', async () => {
          await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })

          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
            subscription_id: uuid.v4(),
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(
            USER_DOES_NOT_HAVE_PRODUCT_SUBSCRIPTION
          )
          expect(res._getStatusCode()).toBe(404)
        })
      })

      describe('when user has product subscription', () => {
        test('removes subscription', async () => {
          await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })

          const userProductSubscription1 =
            await prisma.userProductSubscription.create({
              data: {
                user_id: user.id,
                product_id: product.id,
                subscription_type: 'subscription1',
              },
            })

          await prisma.userProductSubscription.create({
            data: {
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
            subscription_id: userProductSubscription1.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual({})
          expect(res._getStatusCode()).toBe(200)

          const subscription1 = await prisma.userProductSubscription.findUnique(
            {
              where: {
                user_id_product_id_subscription_type: {
                  user_id: user.id,
                  product_id: product.id,
                  subscription_type: 'subscription1',
                },
              },
            }
          )

          expect(subscription1).toBeNull()

          const subscription2 = await prisma.userProductSubscription.findUnique(
            {
              where: {
                user_id_product_id_subscription_type: {
                  user_id: user.id,
                  product_id: product.id,
                  subscription_type: 'subscription2',
                },
              },
            }
          )

          expect(subscription2).not.toBeNull()
        })

        test('updates last_activity_at', async () => {
          await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })

          const userProductSubscription1 =
            await prisma.userProductSubscription.create({
              data: {
                user_id: user.id,
                product_id: product.id,
                subscription_type: 'subscription1',
              },
            })

          await prisma.userProductSubscription.create({
            data: {
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
            subscription_id: userProductSubscription1.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)

          await ensureUserLastActivityHasBeenUpdated(user)
        })
      })
    })
  })
})
