import prisma from '../../../../../../src/lib/prisma'
const uuid = require('uuid')

import {
  cleanDatabase,
  mockAuthorizedGETRequest,
  mockAuthorizedPOSTRequest,
} from '../../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../src/pages/api/v1/crawlers/products'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_REQUESTED_BY,
  INVALID_USER_UUID,
  MISSING_URL_HASH,
  MISSING_SHOP,
  MISSING_URL,
  MISSING_STATUS,
  INVALID_PRODUCT_STATUS,
  USER_DOES_NOT_EXIST,
  PRODUCT_QUEUE_DOES_NOT_EXIST,
  MISSING_PRICES,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
} from '../../../../../../src/lib/messages'
import { parseJSON, hourInMilliseconds } from '../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../matchers'

const ENDPOINT = '/api/v1/crawlers/products'

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

ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`GET ${ENDPOINT}`, () => {
  whenNotAuthorized('GET')

  describe('when authorized', () => {
    let crawler

    beforeEach(async () => {
      crawler = await prisma.crawler.create({
        data: {
          location: 'somewhere',
        },
      })
    })

    describe('without products', () => {
      test('returns empty response', async () => {
        const { req, res } = mockAuthorizedGETRequest(crawler.token)

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const products = json.products

        expect(products.length).toEqual(0)
      })
    })

    describe('with products', () => {
      test('returns products', async () => {
        const { req, res } = mockAuthorizedGETRequest(crawler.token)

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

        await prisma.product.create({
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

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const products = json.products

        expect(products.length).toEqual(1)
        expect(products[0].id).toEqual(product7.id)
      })
    })
  })
})

describe(`POST ${ENDPOINT}`, () => {
  whenNotAuthorized('POST')

  describe('when authorized', () => {
    let user, crawler

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      crawler = await prisma.crawler.create({
        data: {
          location: 'somewhere',
        },
      })
    })

    describe('when missing requested_by', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(crawler.token, {})

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_REQUESTED_BY)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when requested_by is not a valid UUID', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: 'qwe',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_USER_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when missing url_hash', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: uuid.v4(),
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_URL_HASH)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when missing shop', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: uuid.v4(),
            url_hash: 'zxc',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_SHOP)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when missing url', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: uuid.v4(),
            url_hash: 'zxc',
            shop: 'ozon',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_URL)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when missing status', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: uuid.v4(),
            url_hash: 'zxc',
            shop: 'ozon',
            url: 'https://domain.tld',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_STATUS)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when status is not supported', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: uuid.v4(),
            url_hash: 'zxc',
            shop: 'ozon',
            url: 'https://domain.tld',
            status: 'unknown',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_STATUS)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when user does not exist', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: uuid.v4(),
            url_hash: 'zxc',
            shop: 'ozon',
            url: 'https://domain.tld',
            status: 'ok',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(USER_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when product queue does not exist', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          crawler.token,
          {},
          {
            requested_by: user.id,
            url_hash: 'zxc',
            shop: 'ozon',
            url: 'https://domain.tld',
            status: 'ok',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(PRODUCT_QUEUE_DOES_NOT_EXIST)
        expect(res._getStatusCode()).toBe(404)
      })
    })

    describe('when product does not exist', () => {
      describe('when status === not_found', () => {
        test('removes product from queue', async () => {
          await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'not_found',
            }
          )

          const productsInQueueBefore = await prisma.productQueue.findMany()
          expect(productsInQueueBefore.length).toEqual(1)

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)
          expect(parseJSON(res)).toEqual({})

          const productsInQueueAfter = await prisma.productQueue.findMany()
          expect(productsInQueueAfter.length).toEqual(0)
        })
      })

      describe('when status === required_to_change_location', () => {
        test('skips crawler for this product', async () => {
          const productQueue = await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'required_to_change_location',
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)
          expect(parseJSON(res)).toEqual({})

          const updatedProductQueue = await prisma.productQueue.findUnique({
            where: {
              url_url_hash_requested_by_id: {
                url: productQueue.url,
                url_hash: productQueue.url_hash,
                requested_by_id: productQueue.requested_by_id,
              },
            },
          })

          expect(updatedProductQueue.skip_for_crawler_id).toEqual(crawler.id)
        })
      })

      describe('when status === ok', () => {
        test('creates a new product', async () => {
          await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'ok',
              title: 'Product',
              in_stock: true,
              original_price: 42,
              discount_price: 35,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)

          const createdProduct = parseJSON(res)
          expect(createdProduct.shop).toEqual('ozon')
          expect(createdProduct.url).toEqual('https://domain.tld')
          expect(createdProduct.url_hash).toEqual('hash')
          expect(createdProduct.title).toEqual('Product')

          const productHistory = await prisma.productHistory.findMany({
            where: { product_id: createdProduct.id },
          })

          expect(productHistory.length).toEqual(1)

          expect(productHistory[0].title).toEqual('Product')
          expect(productHistory[0].original_price).toEqual(42)
          expect(productHistory[0].discount_price).toEqual(35)
          expect(productHistory[0].in_stock).toEqual(true)
          expect(productHistory[0].status).toEqual('ok')
          expect(productHistory[0].crawler_id).toEqual(crawler.id)
        })

        test('removes product from queue', async () => {
          await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'ok',
              title: 'Product',
              in_stock: true,
              original_price: 42,
              discount_price: 35,
            }
          )

          const productsInQueueBefore = await prisma.productQueue.findMany()
          expect(productsInQueueBefore.length).toEqual(1)

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)

          const productsInQueueAfter = await prisma.productQueue.findMany()
          expect(productsInQueueAfter.length).toEqual(0)
        })

        describe('when prices are missing', () => {
          test('returns error', async () => {
            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual(MISSING_PRICES)
            expect(res._getStatusCode()).toBe(400)
          })
        })

        describe('when only discount is set', () => {
          describe('when price is negative', () => {
            test('returns error', async () => {
              await prisma.productQueue.create({
                data: {
                  requested_by_id: user.id,
                  url_hash: 'hash',
                  url: 'https://domain.tld',
                },
              })

              const { req, res } = mockAuthorizedPOSTRequest(
                crawler.token,
                {},
                {
                  requested_by: user.id,
                  url_hash: 'hash',
                  shop: 'ozon',
                  url: 'https://domain.tld',
                  status: 'ok',
                  title: 'Product',
                  in_stock: true,
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
              await prisma.productQueue.create({
                data: {
                  requested_by_id: user.id,
                  url_hash: 'hash',
                  url: 'https://domain.tld',
                },
              })

              const { req, res } = mockAuthorizedPOSTRequest(
                crawler.token,
                {},
                {
                  requested_by: user.id,
                  url_hash: 'hash',
                  shop: 'ozon',
                  url: 'https://domain.tld',
                  status: 'ok',
                  title: 'Product',
                  in_stock: true,
                  discount_price: 0,
                }
              )

              await handler(req, res)

              expect(parseJSON(res)).toEqual(DISCOUNT_PRICE_MUST_BE_POSITIVE)
              expect(res._getStatusCode()).toBe(422)
            })
          })

          describe('when price is positive', () => {
            test('adds product to user with discount_price', async () => {
              await prisma.productQueue.create({
                data: {
                  requested_by_id: user.id,
                  url_hash: 'hash',
                  url: 'https://domain.tld',
                },
              })

              const { req, res } = mockAuthorizedPOSTRequest(
                crawler.token,
                {},
                {
                  requested_by: user.id,
                  url_hash: 'hash',
                  shop: 'ozon',
                  url: 'https://domain.tld',
                  status: 'ok',
                  title: 'Product',
                  in_stock: true,
                  discount_price: 35,
                }
              )

              await handler(req, res)

              expect(res._getStatusCode()).toBe(201)

              const createdProduct = parseJSON(res)

              const userProducts = await prisma.userProduct.findMany({
                where: { user_id: user.id },
              })
              expect(userProducts.length).toEqual(1)
              expect(userProducts[0].product_id).toEqual(createdProduct.id)
              expect(userProducts[0].price).toEqual(35)
            })
          })
        })

        describe('when only original_price is set', () => {
          describe('when price is negative', () => {
            test('returns error', async () => {
              await prisma.productQueue.create({
                data: {
                  requested_by_id: user.id,
                  url_hash: 'hash',
                  url: 'https://domain.tld',
                },
              })

              const { req, res } = mockAuthorizedPOSTRequest(
                crawler.token,
                {},
                {
                  requested_by: user.id,
                  url_hash: 'hash',
                  shop: 'ozon',
                  url: 'https://domain.tld',
                  status: 'ok',
                  title: 'Product',
                  in_stock: true,
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
              await prisma.productQueue.create({
                data: {
                  requested_by_id: user.id,
                  url_hash: 'hash',
                  url: 'https://domain.tld',
                },
              })

              const { req, res } = mockAuthorizedPOSTRequest(
                crawler.token,
                {},
                {
                  requested_by: user.id,
                  url_hash: 'hash',
                  shop: 'ozon',
                  url: 'https://domain.tld',
                  status: 'ok',
                  title: 'Product',
                  in_stock: true,
                  original_price: 0,
                }
              )

              await handler(req, res)

              expect(parseJSON(res)).toEqual(ORIGINAL_PRICE_MUST_BE_POSITIVE)
              expect(res._getStatusCode()).toBe(422)
            })
          })

          describe('when price is positive', () => {
            test('adds product to user with original_price', async () => {
              await prisma.productQueue.create({
                data: {
                  requested_by_id: user.id,
                  url_hash: 'hash',
                  url: 'https://domain.tld',
                },
              })

              const { req, res } = mockAuthorizedPOSTRequest(
                crawler.token,
                {},
                {
                  requested_by: user.id,
                  url_hash: 'hash',
                  shop: 'ozon',
                  url: 'https://domain.tld',
                  status: 'ok',
                  title: 'Product',
                  in_stock: true,
                  original_price: 42,
                }
              )

              await handler(req, res)

              expect(res._getStatusCode()).toBe(201)

              const createdProduct = parseJSON(res)

              const userProducts = await prisma.userProduct.findMany({
                where: { user_id: user.id },
              })
              expect(userProducts.length).toEqual(1)
              expect(userProducts[0].product_id).toEqual(createdProduct.id)
              expect(userProducts[0].price).toEqual(42)
            })
          })
        })

        describe('when both prices are set', () => {
          test('adds product to user with discount_price', async () => {
            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
                original_price: 42,
                discount_price: 35,
              }
            )

            await handler(req, res)

            expect(res._getStatusCode()).toBe(201)

            const createdProduct = parseJSON(res)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })
            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(createdProduct.id)
            expect(userProducts[0].price).toEqual(35)
          })
        })
      })
    })

    describe('when product exists', () => {
      describe('when prices are missing', () => {
        test('returns error', async () => {
          await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'ok',
              title: 'Product',
              in_stock: true,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(MISSING_PRICES)
          expect(res._getStatusCode()).toBe(400)
        })
      })

      describe('when only discount is set', () => {
        describe('when price is negative', () => {
          test('returns error', async () => {
            await prisma.product.create({
              data: {
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                title: 'Product',
              },
            })

            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
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
            await prisma.product.create({
              data: {
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                title: 'Product',
              },
            })

            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
                discount_price: 0,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual(DISCOUNT_PRICE_MUST_BE_POSITIVE)
            expect(res._getStatusCode()).toBe(422)
          })
        })

        describe('when price is positive', () => {
          test('adds product to user with discount_price', async () => {
            await prisma.product.create({
              data: {
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                title: 'Product',
              },
            })

            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
                discount_price: 35,
              }
            )

            await handler(req, res)

            expect(res._getStatusCode()).toBe(201)

            const createdProduct = parseJSON(res)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })
            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(createdProduct.id)
            expect(userProducts[0].price).toEqual(35)
          })
        })
      })

      describe('when only original_price is set', () => {
        describe('when price is negative', () => {
          test('returns error', async () => {
            await prisma.product.create({
              data: {
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                title: 'Product',
              },
            })

            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
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
            await prisma.product.create({
              data: {
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                title: 'Product',
              },
            })

            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
                original_price: 0,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual(ORIGINAL_PRICE_MUST_BE_POSITIVE)
            expect(res._getStatusCode()).toBe(422)
          })
        })

        describe('when price is positive', () => {
          test('adds product to user with original_price', async () => {
            await prisma.product.create({
              data: {
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                title: 'Product',
              },
            })

            await prisma.productQueue.create({
              data: {
                requested_by_id: user.id,
                url_hash: 'hash',
                url: 'https://domain.tld',
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              crawler.token,
              {},
              {
                requested_by: user.id,
                url_hash: 'hash',
                shop: 'ozon',
                url: 'https://domain.tld',
                status: 'ok',
                title: 'Product',
                in_stock: true,
                original_price: 42,
              }
            )

            await handler(req, res)

            expect(res._getStatusCode()).toBe(201)

            const createdProduct = parseJSON(res)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })
            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(createdProduct.id)
            expect(userProducts[0].price).toEqual(42)
          })
        })
      })

      describe('when both prices are set', () => {
        test('adds parsed prices to product history', async () => {
          await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'ok',
              title: 'Product',
              in_stock: true,
              original_price: 42,
              discount_price: 35,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)

          const createdProduct = parseJSON(res)

          const productHistory = await prisma.productHistory.findMany({
            where: { product_id: createdProduct.id },
          })

          expect(productHistory.length).toEqual(1)

          expect(productHistory[0].title).toEqual('Product')
          expect(productHistory[0].original_price).toEqual(42)
          expect(productHistory[0].discount_price).toEqual(35)
          expect(productHistory[0].in_stock).toEqual(true)
          expect(productHistory[0].status).toEqual('ok')
          expect(productHistory[0].crawler_id).toEqual(crawler.id)
        })

        test('adds product to user with discount_price', async () => {
          await prisma.product.create({
            data: {
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              title: 'Product',
            },
          })

          await prisma.productQueue.create({
            data: {
              requested_by_id: user.id,
              url_hash: 'hash',
              url: 'https://domain.tld',
            },
          })

          const { req, res } = mockAuthorizedPOSTRequest(
            crawler.token,
            {},
            {
              requested_by: user.id,
              url_hash: 'hash',
              shop: 'ozon',
              url: 'https://domain.tld',
              status: 'ok',
              title: 'Product',
              in_stock: true,
              original_price: 42,
              discount_price: 35,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(201)

          const createdProduct = parseJSON(res)

          const userProducts = await prisma.userProduct.findMany({
            where: { user_id: user.id },
          })
          expect(userProducts.length).toEqual(1)
          expect(userProducts[0].product_id).toEqual(createdProduct.id)
          expect(userProducts[0].price).toEqual(35)
        })
      })
    })
  })
})
