import prisma from '../../../../../src/lib/prisma'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../src/pages/api/v1/products/index'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
  MISSING_URL,
  INVALID_URL,
  SHOP_IS_NOT_SUPPORTED_YET,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  PRODUCT_ADDED_TO_QUEUE,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
  REDIRECT_TO_PRODUCT_PAGE,
} from '../../../../../src/lib/messages'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
  mockAuthorizedGETRequest,
  mockAuthorizedPOSTRequest,
  parseJSON,
} from '../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../matchers'

const ENDPOINT = '/api/v1/products'

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

    describe('without products', () => {
      test('returns empty response', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const products = json.products

        expect(products.length).toEqual(0)
      })

      test('updates last_activity_at', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        await ensureUserLastActivityHasBeenUpdated(user)
      })
    })

    describe('with products', () => {
      test('returns products', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        const crawler = await prisma.crawler.create({
          data: { location: 'location' },
        })

        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain.tld',
            url_hash: 'hash',
            shop: 'shop',
          },
        })

        await prisma.productHistory.create({
          data: {
            product_id: product.id,
            original_price: 42,
            discount_price: 35,
            in_stock: true,
            status: 'ok',
            title: 'Title',
            crawler_id: crawler.id,
          },
        })

        const productWithoutHistory = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain3.tld',
            url_hash: 'hash3',
            shop: 'shop',
          },
        })

        await prisma.userProduct.createMany({
          data: [
            {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
            {
              user_id: user.id,
              product_id: productWithoutHistory.id,
              price: 42,
            },
          ],
        })

        const anotherProduct = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://domain2.tld',
            url_hash: 'hash2',
            shop: 'shop',
          },
        })

        const anotherUser = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
          },
        })

        await prisma.userProduct.create({
          data: {
            user_id: anotherUser.id,
            product_id: anotherProduct.id,
            price: 42,
          },
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const products = json.products

        expect(products.length).toEqual(1)

        expect(products[0].id).toEqual(product.id)
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

    describe('when missing url', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.token, {})

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_URL)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when url is not a valid url', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            url: 'domain.tld',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_URL)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when shop is not supported', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            url: 'https://domain.tld',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(SHOP_IS_NOT_SUPPORTED_YET)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when URL is not a single product URL', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            url: 'https://www.ozon.ru/category/protsessory-15726/',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(IT_IS_NOT_A_SINGLE_PRODUCT_URL)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when product does not exist', () => {
      describe('when used alternate domain', () => {
        test('adds new product to queue', async () => {
          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: 'https://m.ozon.ru/product/42',
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)
          expect(parseJSON(res)).toEqual(PRODUCT_ADDED_TO_QUEUE)

          const productInQueue = await prisma.productQueue.findMany()
          expect(productInQueue.length).toEqual(1)
          expect(productInQueue[0].url).toEqual(
            'https://www.ozon.ru/product/42'
          )
          expect(productInQueue[0].url_hash).toEqual(
            '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
          )
        })
      })

      test('adds new product to queue', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            url: 'https://ozon.ru/product/42',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)
        expect(parseJSON(res)).toEqual(PRODUCT_ADDED_TO_QUEUE)

        const productInQueue = await prisma.productQueue.findMany()
        expect(productInQueue.length).toEqual(1)
        expect(productInQueue[0].url).toEqual('https://www.ozon.ru/product/42')
        expect(productInQueue[0].url_hash).toEqual(
          '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
        )
      })

      test('removes extra query args from url', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            url: 'https://ozon.ru/product/42?qwe=zxc',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)
        expect(parseJSON(res)).toEqual(PRODUCT_ADDED_TO_QUEUE)

        const productInQueue = await prisma.productQueue.findMany()
        expect(productInQueue.length).toEqual(1)
        expect(productInQueue[0].url).toEqual('https://www.ozon.ru/product/42')
        expect(productInQueue[0].url_hash).toEqual(
          '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
        )
      })
    })

    describe('when product exists', () => {
      let product
      let crawler

      beforeEach(async () => {
        product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://www.ozon.ru/product/42',
            url_hash:
              '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f',
            shop: 'shop',
          },
        })

        crawler = await prisma.crawler.create({
          data: { location: 'location' },
        })
      })

      describe('when user has this product', () => {
        beforeEach(async () => {
          await prisma.userProduct.create({
            data: {
              user_id: user.id,
              product_id: product.id,
              price: 42,
            },
          })
        })

        describe('when used alternate url', () => {
          test('does nothing', async () => {
            const { req, res } = mockAuthorizedPOSTRequest(
              user.token,
              {},
              {
                url: 'https://m.ozon.ru/product/42',
              }
            )

            await handler(req, res)

            expect(res._getStatusCode()).toBe(200)
            expect(parseJSON(res)).toEqual({
              ...REDIRECT_TO_PRODUCT_PAGE,
              location: '/products/' + product.id,
            })
          })
        })

        test('does nothing', async () => {
          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)
          expect(parseJSON(res)).toEqual({
            ...REDIRECT_TO_PRODUCT_PAGE,
            location: '/products/' + product.id,
          })
        })
      })

      describe('without history', () => {
        test('returns error', async () => {
          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(
            UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE
          )
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when there is only one record in history with status not ok', () => {
        test('returns error', async () => {
          await prisma.productHistory.create({
            data: {
              product_id: product.id,
              original_price: 42,
              discount_price: 35,
              in_stock: true,
              status: 'not_found',
              title: 'Title',
              crawler_id: crawler.id,
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(
            UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE
          )
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('with valid history', () => {
        test('adds product to user with discount price', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                original_price: 42,
                discount_price: 35,
                in_stock: true,
                status: 'not_found',
                title: 'Title',
                crawler_id: crawler.id,
              },
              {
                product_id: product.id,
                original_price: 99,
                discount_price: 87,
                in_stock: true,
                status: 'ok',
                title: 'Title',
                crawler_id: crawler.id,
                created_at: new Date('2021-01-01'),
              },
            ],
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)
          expect(parseJSON(res)).toEqual({
            ...REDIRECT_TO_PRODUCT_PAGE,
            location: '/products/' + product.id,
          })

          const userProducts = await prisma.userProduct.findMany({
            where: {
              user_id: user.id,
            },
          })

          expect(userProducts.length).toEqual(1)
          expect(userProducts[0].product_id).toEqual(product.id)
          expect(userProducts[0].price).toEqual(87)
        })

        test('adds product to user with original price', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                original_price: 42,
                discount_price: 35,
                in_stock: true,
                status: 'not_found',
                title: 'Title',
                crawler_id: crawler.id,
              },
              {
                product_id: product.id,
                original_price: 99,
                in_stock: true,
                status: 'ok',
                title: 'Title',
                crawler_id: crawler.id,
                created_at: new Date('2021-01-01'),
              },
            ],
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)
          expect(parseJSON(res)).toEqual({
            ...REDIRECT_TO_PRODUCT_PAGE,
            location: '/products/' + product.id,
          })

          const userProducts = await prisma.userProduct.findMany({
            where: {
              user_id: user.id,
            },
          })

          expect(userProducts.length).toEqual(1)
          expect(userProducts[0].product_id).toEqual(product.id)
          expect(userProducts[0].price).toEqual(99)
        })

        test('updates last_activity_at', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                original_price: 42,
                discount_price: 35,
                in_stock: true,
                status: 'not_found',
                title: 'Title',
                crawler_id: crawler.id,
              },
              {
                product_id: product.id,
                original_price: 99,
                in_stock: true,
                status: 'ok',
                title: 'Title',
                crawler_id: crawler.id,
                created_at: new Date('2021-01-01'),
              },
            ],
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            user.token,
            {},
            {
              url: product.url,
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
