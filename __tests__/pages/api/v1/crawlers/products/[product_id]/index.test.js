import prisma from '../../../../../../../src/lib/prisma'
import {
  cleanDatabase,
  mockAuthorizedPUTRequest,
} from '../../../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/crawlers/products/[product_id]/index'
import { parseJSON } from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_STATUS,
  MISSING_PRODUCT_ID,
  INVALID_PRODUCT_UUID,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_IN_STOCK,
  MISSING_PRICES,
  MISSING_TITLE,
} from '../../../../../../../src/lib/messages'
const uuid = require('uuid')

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
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token, {
          product_id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token, {
          product_id: uuid.v4(),
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
            url_hash: 'hash',
            shop: 'ozon',
            url: 'https://domain.tld',
            title: 'Product',
          },
        })
      })

      describe('when missing status', () => {
        it('returns error', async () => {
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

          const productsHistory = await prisma.productHistory.findMany()
          expect(productsHistory).toEqual([])
        })
      })

      describe('when status === ok', () => {
        describe('when missing in_stock', () => {
          it('returns error', async () => {
            const { req, res } = mockAuthorizedPUTRequest(
              crawler.token,
              {
                product_id: product.id,
              },
              {
                status: 'ok',
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual(MISSING_IN_STOCK)
            expect(res._getStatusCode()).toBe(400)

            const productsHistory = await prisma.productHistory.findMany()
            expect(productsHistory).toEqual([])
          })
        })

        describe('when is in_stock', () => {
          describe('when missing title', () => {
            it('returns error', async () => {
              const { req, res } = mockAuthorizedPUTRequest(
                crawler.token,
                {
                  product_id: product.id,
                },
                {
                  status: 'ok',
                  in_stock: true,
                }
              )

              await handler(req, res)

              expect(parseJSON(res)).toEqual(MISSING_TITLE)
              expect(res._getStatusCode()).toBe(400)

              const productsHistory = await prisma.productHistory.findMany()
              expect(productsHistory).toEqual([])
            })
          })

          describe('when missing prices', () => {
            it('returns error', async () => {
              const { req, res } = mockAuthorizedPUTRequest(
                crawler.token,
                {
                  product_id: product.id,
                },
                {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                }
              )

              await handler(req, res)

              expect(parseJSON(res)).toEqual(MISSING_PRICES)
              expect(res._getStatusCode()).toBe(400)

              const productsHistory = await prisma.productHistory.findMany()
              expect(productsHistory).toEqual([])
            })
          })

          describe('with both prices', () => {
            let body

            describe('when price are positive', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: ' Product ',
                  original_price: 42,
                  discount_price: 35,
                }
              })

              describe('without history', () => {
                it('returns success', async () => {
                  const { req, res } = mockAuthorizedPUTRequest(
                    crawler.token,
                    {
                      product_id: product.id,
                    },
                    body
                  )

                  await handler(req, res)

                  const result = parseJSON(res)
                  expect(result.crawler_id).toEqual(crawler.id)
                  expect(result.product_id).toEqual(product.id)
                  expect(result.discount_price).toEqual(35)
                  expect(result.original_price).toEqual(42)
                  expect(result.in_stock).toEqual(true)
                  expect(result.title).toEqual('Product')
                  expect(result.status).toEqual('ok')
                  expect(result.created_at).not.toEqual('')
                  expect(result.id).not.toEqual('')

                  expect(res._getStatusCode()).toBe(200)
                })

                it('creates a record in product history', async () => {
                  const { req, res } = mockAuthorizedPUTRequest(
                    crawler.token,
                    {
                      product_id: product.id,
                    },
                    body
                  )

                  await handler(req, res)
                  expect(res._getStatusCode()).toBe(200)

                  const productsHistory = await prisma.productHistory.findMany()
                  expect(productsHistory.length).toEqual(1)

                  expect(productsHistory[0].crawler_id).toEqual(crawler.id)
                  expect(productsHistory[0].product_id).toEqual(product.id)
                  expect(productsHistory[0].discount_price).toEqual(35)
                  expect(productsHistory[0].original_price).toEqual(42)
                  expect(productsHistory[0].in_stock).toEqual(true)
                  expect(productsHistory[0].title).toEqual('Product')
                  expect(productsHistory[0].status).toEqual('ok')
                })
              })

              describe('with history', () => {
                it('returns success', async () => {
                  const { req, res } = mockAuthorizedPUTRequest(
                    crawler.token,
                    {
                      product_id: product.id,
                    },
                    body
                  )

                  await handler(req, res)

                  const result = parseJSON(res)
                  expect(result.crawler_id).toEqual(crawler.id)
                  expect(result.product_id).toEqual(product.id)
                  expect(result.discount_price).toEqual(35)
                  expect(result.original_price).toEqual(42)
                  expect(result.in_stock).toEqual(true)
                  expect(result.title).toEqual('Product')
                  expect(result.status).toEqual('ok')
                  expect(result.created_at).not.toEqual('')
                  expect(result.id).not.toEqual('')

                  expect(res._getStatusCode()).toBe(200)
                })

                it('creates a record in product history', async () => {
                  const { req, res } = mockAuthorizedPUTRequest(
                    crawler.token,
                    {
                      product_id: product.id,
                    },
                    body
                  )

                  await handler(req, res)
                  expect(res._getStatusCode()).toBe(200)

                  const productsHistory = await prisma.productHistory.findMany()
                  expect(productsHistory.length).toEqual(1)

                  expect(productsHistory[0].crawler_id).toEqual(crawler.id)
                  expect(productsHistory[0].product_id).toEqual(product.id)
                  expect(productsHistory[0].discount_price).toEqual(35)
                  expect(productsHistory[0].original_price).toEqual(42)
                  expect(productsHistory[0].in_stock).toEqual(true)
                  expect(productsHistory[0].title).toEqual('Product')
                  expect(productsHistory[0].status).toEqual('ok')
                })
              })
            })
          })
        })
      })
    })
  })
})
