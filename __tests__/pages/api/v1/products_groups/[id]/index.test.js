import prisma from '../../../../../../src/lib/prisma'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../src/pages/api/v1/products_groups/[id]'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
  PRODUCTS_GROUP_DOES_NOT_EXIST,
  INVALID_PRODUCTS_GROUP_UUID,
  MISSING_PRODUCTS_GROUP_ID,
  MISSING_USER_PRODUCT_ID,
  INVALID_USER_PRODUCT_UUID,
  USER_PRODUCT_DOES_NOT_EXIST,
  USER_PRODUCT_ALREADY_EXISTS_IN_PRODUCTS_GROUP,
  USER_PRODUCT_HAS_BEEN_ADDED_TO_PRODUCTS_GROUP,
  USER_PRODUCTS_GROUP_DELETED,
} from '../../../../../../src/lib/messages'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
  mockAuthorizedDELETERequest,
  mockAuthorizedGETRequest,
  mockAuthorizedPOSTRequest,
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

const ENDPOINT = '/api/v1/products_groups/[id]'

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

    describe('when id missing', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCTS_GROUP_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when id is not a valid UUID', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCTS_GROUP_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when products group does not exist', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCTS_GROUP_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when products group exists', () => {
      let product1
      let product2
      let product3
      let product1LastHistory
      let product2LastHistory
      let userProduct3
      let userProductsGroup1

      beforeEach(async () => {
        const crawler = await prisma.crawler.create({
          data: { location: 'location' },
        })

        product1 = await prisma.product.create({
          data: {
            title: 'Product 1',
            url: 'https://domain1.tld',
            url_hash: 'hash1',
            shop: 'shop',
          },
        })

        await prisma.productHistory.create({
          data: {
            product_id: product1.id,
            original_price: 42,
            discount_price: 39,
            in_stock: false,
            crawler_id: crawler.id,
            status: 'ok',
          },
        })

        product1LastHistory = await prisma.productHistory.create({
          data: {
            product_id: product1.id,
            original_price: 42,
            discount_price: 40,
            in_stock: true,
            crawler_id: crawler.id,
            status: 'ok',
          },
        })

        product2 = await prisma.product.create({
          data: {
            title: 'Product 2',
            url: 'https://domain2.tld',
            url_hash: 'hash2',
            shop: 'shop',
          },
        })

        await prisma.productHistory.create({
          data: {
            product_id: product2.id,
            original_price: 42,
            discount_price: 39,
            in_stock: true,
            crawler_id: crawler.id,
            status: 'ok',
          },
        })

        product2LastHistory = await prisma.productHistory.create({
          data: {
            product_id: product2.id,
            original_price: 41,
            discount_price: null,
            in_stock: false,
            crawler_id: crawler.id,
            status: 'ok',
          },
        })

        product3 = await prisma.product.create({
          data: {
            title: 'Product 3',
            url: 'https://domain3.tld',
            url_hash: 'hash3',
            shop: 'shop',
          },
        })

        const userProduct1 = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product1.id,
            price: 42.2,
          },
        })

        const userProduct2 = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product2.id,
            price: 99.9,
          },
        })

        userProduct3 = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product3.id,
            price: 100.1,
          },
        })

        userProductsGroup1 = await prisma.userProductsGroup.create({
          data: {
            user_id: user.id,
            title: 'Group Title 1',
            image: 'image.png',
          },
        })

        await prisma.userProductsGroupItem.create({
          data: {
            user_id: user.id,
            user_products_group_id: userProductsGroup1.id,
            user_product_id: userProduct1.id,
          },
        })

        await prisma.userProductsGroupItem.create({
          data: {
            user_id: user.id,
            user_products_group_id: userProductsGroup1.id,
            user_product_id: userProduct2.id,
          },
        })

        await prisma.userProductsGroup.create({
          data: {
            user_id: user.id,
            title: 'Group Title 2',
          },
        })

        const user2 = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
          },
        })

        const product4 = await prisma.product.create({
          data: {
            title: 'Product 4',
            url: 'https://domain4.tld',
            url_hash: 'hash4',
            shop: 'shop',
          },
        })

        await prisma.userProduct.create({
          data: {
            user_id: user2.id,
            product_id: product1.id,
            price: 100,
          },
        })

        await prisma.userProduct.create({
          data: {
            user_id: user2.id,
            product_id: product4.id,
            price: 100,
          },
        })
      })

      it('returns result', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: userProductsGroup1.id,
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        expect(parseJSON(res)).toEqual({
          products_group: {
            id: userProductsGroup1.id,
            title: userProductsGroup1.title,
            image: userProductsGroup1.image,
            created_at: userProductsGroup1.created_at.toISOString(),
            products_count: 2,
          },
          products_group_items: [
            {
              product_id: product1.id,
              product_title: product1.title,
              product_url: product1.url,
              product_shop: product1.shop,
              history_min_price: 40,
              history_in_stock: true,
              history_updated_at: product1LastHistory.created_at.toISOString(),
              product_exists: true,
            },
            {
              product_id: product2.id,
              product_title: product2.title,
              product_url: product2.url,
              product_shop: product2.shop,
              history_min_price: 41,
              history_in_stock: false,
              history_updated_at: product2LastHistory.created_at.toISOString(),
              product_exists: true,
            },
          ],
          user_products: [
            {
              product_id: product3.id,
              title: product3.title,
              user_product_id: userProduct3.id,
            },
          ],
        })
      })

      it('updates last_activity_at', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token, {
          id: userProductsGroup1.id,
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        await ensureUserLastActivityHasBeenUpdated(user)
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

    describe('when id missing', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCTS_GROUP_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when id is not a valid UUID', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCTS_GROUP_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when products group does not exist', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.token, {
          id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCTS_GROUP_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when products group exists', () => {
      describe('when user_product_id is missing', () => {
        it('returns error', async () => {
          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(user.token, {
            id: userProductsGroup.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(MISSING_USER_PRODUCT_ID)
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when user_product_id is empty', () => {
        it('returns error', async () => {
          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {
              id: userProductsGroup.id,
            },
            {
              user_product_id: ' ',
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(MISSING_USER_PRODUCT_ID)
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when user_product_id is not a valid UUID', () => {
        it('returns error', async () => {
          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {
              id: userProductsGroup.id,
            },
            {
              user_product_id: 'qwe',
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(INVALID_USER_PRODUCT_UUID)
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when user does not have product', () => {
        it('returns error', async () => {
          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {
              id: userProductsGroup.id,
            },
            {
              user_product_id: uuid.v4(),
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(USER_PRODUCT_DOES_NOT_EXIST)
          expect(res._getStatusCode()).toBe(404)
        })
      })

      describe('when user has product', () => {
        let userProductsGroup
        let userProduct

        beforeEach(async () => {
          userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })

          const product = await prisma.product.create({
            data: {
              title: 'Product 1',
              url: 'https://domain1.tld',
              url_hash: 'hash1',
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

        describe('when item is in products group', () => {
          it('returns error', async () => {
            await prisma.userProductsGroupItem.create({
              data: {
                user_id: user.id,
                user_products_group_id: userProductsGroup.id,
                user_product_id: userProduct.id,
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              user.token,
              {
                id: userProductsGroup.id,
              },
              {
                user_product_id: userProduct.id,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual(
              USER_PRODUCT_ALREADY_EXISTS_IN_PRODUCTS_GROUP
            )
            expect(res._getStatusCode()).toBe(409)
          })
        })

        describe('when item is not in products group', () => {
          it('adds item to products group', async () => {
            const { req, res } = mockAuthorizedPOSTRequest(
              user.token,
              {
                id: userProductsGroup.id,
              },
              {
                user_product_id: userProduct.id,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual(
              USER_PRODUCT_HAS_BEEN_ADDED_TO_PRODUCTS_GROUP
            )
            expect(res._getStatusCode()).toBe(201)

            const groupItems = await prisma.userProductsGroupItem.findMany()
            expect(groupItems.length).toEqual(1)
            expect(groupItems[0].user_id).toEqual(user.id)
            expect(groupItems[0].user_products_group_id).toEqual(
              userProductsGroup.id
            )
            expect(groupItems[0].user_product_id).toEqual(userProduct.id)
          })

          it('updates last_activity_at', async () => {
            const { req, res } = mockAuthorizedPOSTRequest(
              user.token,
              {
                id: userProductsGroup.id,
              },
              {
                user_product_id: userProduct.id,
              }
            )

            await handler(req, res)

            expect(res._getStatusCode()).toBe(201)

            await ensureUserLastActivityHasBeenUpdated(user)
          })
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

    describe('when id missing', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCTS_GROUP_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when id is not a valid UUID', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCTS_GROUP_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when products group does not exist', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedDELETERequest(user.token, {
          id: uuid.v4(),
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCTS_GROUP_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when products group exists', () => {
      let userProductsGroup

      beforeEach(async () => {
        userProductsGroup = await prisma.userProductsGroup.create({
          data: {
            user_id: user.id,
            title: 'Products Group',
          },
        })
      })

      describe('without items in products group', () => {
        it('removes only specific products group', async () => {
          const userProductsGroup2 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group 2',
            },
          })

          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: userProductsGroup.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(USER_PRODUCTS_GROUP_DELETED)
          expect(res._getStatusCode()).toBe(200)

          const userProductsGroups = await prisma.userProductsGroup.findMany()
          expect(userProductsGroups).toEqual([userProductsGroup2])
        })
      })

      describe('with items in products group', () => {
        let productsGroup2Item

        beforeEach(async () => {
          const product = await prisma.product.create({
            data: {
              title: 'Product 1',
              url: 'https://domain1.tld',
              url_hash: 'hash1',
              shop: 'shop',
            },
          })

          const userProduct = await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })

          await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: userProductsGroup.id,
              user_product_id: userProduct.id,
            },
          })

          const userProductsGroup2 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group 2',
            },
          })

          const product2 = await prisma.product.create({
            data: {
              title: 'Product 2',
              url: 'https://domain2.tld',
              url_hash: 'hash2',
              shop: 'shop',
            },
          })

          const userProduct2 = await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product2.id,
              price: 42,
            },
          })

          productsGroup2Item = await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: userProductsGroup2.id,
              user_product_id: userProduct2.id,
            },
          })
        })

        it('removes items related to products group', async () => {
          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: userProductsGroup.id,
          })

          await handler(req, res)

          expect(parseJSON(res)).toEqual(USER_PRODUCTS_GROUP_DELETED)
          expect(res._getStatusCode()).toBe(200)

          const userProductsGroupItems =
            await prisma.userProductsGroupItem.findMany()
          expect(userProductsGroupItems).toEqual([productsGroup2Item])
        })

        it('updates last_activity_at', async () => {
          const { req, res } = mockAuthorizedDELETERequest(user.token, {
            id: userProductsGroup.id,
          })

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)

          await ensureUserLastActivityHasBeenUpdated(user)
        })
      })
    })
  })
})
