import prisma from '../../../../../../src/lib/prisma'
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
  ensureUserLastActivityHasBeenUpdated,
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
const uuid = require('uuid')

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
    it('returns error', async () => {
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
      it('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCT_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when user does not have product', () => {
      it('returns error', async () => {
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
      let product
      let userProduct

      beforeEach(async () => {
        product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
          },
        })

        userProduct = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42,
            favorited: true,
            created_at: new Date('2022-06-11 12:34:56'),
          },
        })
      })

      describe('when product is not in groups', () => {
        it('returns products with shops', async () => {
          const { req, res } = mockAuthorizedGETRequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual({
            product: {
              id: product.id,
              user_product_id: userProduct.id,
              price: userProduct.price,
              title: product.title,
              favorited: true,
              created_at: '2022-06-11T09:34:56.000Z',
              shop: 'shop',
              url: product.url,
            },
            groups: [],
            shops: {
              goldapple: {
                domain: 'goldapple.ru',
                name: 'goldapple',
                search_path: '/catalogsearch/result?q=',
              },
              lamoda: {
                domain: 'www.lamoda.ru',
                name: 'lamoda',
                search_path: '/catalogsearch/result/?q=',
              },
              ozon: {
                domain: 'www.ozon.ru',
                name: 'ozon',
                search_path: '/search?text=',
              },
              sbermegamarket: {
                domain: 'sbermegamarket.ru',
                name: 'sbermegamarket',
                search_path: '/catalog/?q=',
              },
              store77: {
                domain: 'store77.net',
                name: 'store77',
                search_path: '/search/?q=',
              },
              wildberries: {
                domain: 'www.wildberries.ru',
                name: 'wildberries',
                search_path: '/catalog/0/search.aspx?sort=popular&search=',
              },
            },
          })
          expect(res._getStatusCode()).toBe(200)
        })

        it('updates last_activity_at', async () => {
          const { req, res } = mockAuthorizedGETRequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)

          await ensureUserLastActivityHasBeenUpdated(user)
        })
      })

      describe('when product is in groups', () => {
        it('returns products with shops and groups', async () => {
          const userProductGroup1 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Product Group 1',
            },
          })

          const userProductGroup2 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Product Group 2',
            },
          })

          await prisma.userProductsGroupItem.createMany({
            data: [
              {
                user_id: user.id,
                user_products_group_id: userProductGroup1.id,
                user_product_id: userProduct.id,
              },
              {
                user_id: user.id,
                user_products_group_id: userProductGroup2.id,
                user_product_id: userProduct.id,
              },
            ],
          })

          const { req, res } = mockAuthorizedGETRequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual({
            product: {
              id: product.id,
              user_product_id: userProduct.id,
              price: userProduct.price,
              title: product.title,
              favorited: true,
              created_at: '2022-06-11T09:34:56.000Z',
              shop: 'shop',
              url: product.url,
            },
            groups: [
              {
                id: userProductGroup1.id,
                title: userProductGroup1.title,
              },
              {
                id: userProductGroup2.id,
                title: userProductGroup2.title,
              },
            ],
            shops: {
              goldapple: {
                domain: 'goldapple.ru',
                name: 'goldapple',
                search_path: '/catalogsearch/result?q=',
              },
              lamoda: {
                domain: 'www.lamoda.ru',
                name: 'lamoda',
                search_path: '/catalogsearch/result/?q=',
              },
              ozon: {
                domain: 'www.ozon.ru',
                name: 'ozon',
                search_path: '/search?text=',
              },
              sbermegamarket: {
                domain: 'sbermegamarket.ru',
                name: 'sbermegamarket',
                search_path: '/catalog/?q=',
              },
              store77: {
                domain: 'store77.net',
                name: 'store77',
                search_path: '/search/?q=',
              },
              wildberries: {
                domain: 'www.wildberries.ru',
                name: 'wildberries',
                search_path: '/catalog/0/search.aspx?sort=popular&search=',
              },
            },
          })
          expect(res._getStatusCode()).toBe(200)
        })
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
      it('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCT_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when user does not have product', () => {
      it('returns error', async () => {
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
      let userProduct

      beforeEach(async () => {
        product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
          },
        })

        userProduct = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42,
          },
        })
      })

      it('does not remove product', async () => {
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

      it('updates product status to hold', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const existedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        })

        expect(existedProduct.status).toEqual('hold')
      })

      describe('when other people have this product', () => {
        it('keeps product status as active', async () => {
          const user2 = await prisma.user.create({
            data: {
              login: 'user2',
              password: 'password',
            },
          })

          await prisma.userProduct.create({
            data: {
              user_id: user2.id,
              product_id: product.id,
              price: 42,
            },
          })

          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)

          const existedProduct = await prisma.product.findUnique({
            where: { id: product.id },
          })

          expect(existedProduct.status).toEqual('active')
        })
      })

      it('removes product from user', async () => {
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

      it('updates last_activity_at', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: product.id,
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        await ensureUserLastActivityHasBeenUpdated(user)
      })

      describe('when user has product subscriptions', () => {
        it('removes product subscriptions', async () => {
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

      describe('when user product is in group', () => {
        let userProductsGroup
        let userProduct2
        let userProductsGroupItem2

        beforeEach(async () => {
          userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title',
            },
          })

          await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: userProductsGroup.id,
              user_product_id: userProduct.id,
            },
          })

          const product2 = await prisma.product.create({
            data: {
              title: 'Product2',
              url: 'https://domain2.tld',
              url_hash: 'hash2',
              shop: 'shop',
            },
          })

          userProduct2 = await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product2.id,
              price: 35,
            },
          })

          userProductsGroupItem2 = await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: userProductsGroup.id,
              user_product_id: userProduct2.id,
            },
          })
        })

        it('removes product from items', async () => {
          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)
          expect(parseJSON(res)).toEqual({})

          const existedUserProductsGroupItems =
            await prisma.userProductsGroupItem.findMany()

          expect(existedUserProductsGroupItems).toEqual([
            userProductsGroupItem2,
          ])
        })

        it('does not remove user products group', async () => {
          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: product.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)
          expect(parseJSON(res)).toEqual({})

          const existedUserProductsGroups =
            await prisma.userProductsGroup.findMany()

          expect(existedUserProductsGroups).toEqual([userProductsGroup])
        })
      })
    })
  })
})
