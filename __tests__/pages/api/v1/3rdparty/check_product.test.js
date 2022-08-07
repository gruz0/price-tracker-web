import prisma from '../../../../../src/lib/prisma'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../src/pages/api/v1/3rdparty/check_product'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  API_KEY_DOES_NOT_EXIST,
  MISSING_URL,
  INVALID_URL,
  SHOP_IS_NOT_SUPPORTED_YET,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  URL_IS_SUPPORTED_AND_CAN_BE_ADDED_TO_YOUR_LIST,
  PRODUCT_EXISTS_AND_CAN_BE_ADDED_TO_YOUR_LIST,
  YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
} from '../../../../../src/lib/messages'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
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

const ENDPOINT = '/api/v1/3rdparty/check_product'

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
    whenTokenNotFound(method, handler, 403, API_KEY_DOES_NOT_EXIST)
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
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

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
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.api_key, {})

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_URL)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when url is not a valid url', () => {
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
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
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
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
      it('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
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
      it('returns status', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
          {},
          {
            url: 'https://ozon.ru/product/42',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(
          URL_IS_SUPPORTED_AND_CAN_BE_ADDED_TO_YOUR_LIST
        )
        expect(res._getStatusCode()).toBe(200)
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

      describe('when user does not have product', () => {
        it('returns status', async () => {
          const { req, res } = mockAuthorizedPOSTRequest(
            user.api_key,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(
            PRODUCT_EXISTS_AND_CAN_BE_ADDED_TO_YOUR_LIST
          )
          expect(res._getStatusCode()).toBe(200)
        })

        it('updates last_activity_at', async () => {
          const { req, res } = mockAuthorizedPOSTRequest(
            user.api_key,
            {},
            {
              url: product.url,
            }
          )

          await handler(req, res)

          expect(res._getStatusCode()).toBe(200)

          await ensureUserLastActivityHasBeenUpdated(user)
        })
      })

      describe('when user has this product', () => {
        describe('when product has history', () => {
          it('returns actual product status', async () => {
            await prisma.userProduct.create({
              data: {
                user_id: user.id,
                product_id: product.id,
                price: 41,
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

            const { req, res } = mockAuthorizedPOSTRequest(
              user.api_key,
              {},
              {
                url: product.url,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual({
              ...YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
              product: {
                latest_price: 35,
                my_price: 41,
                has_discount: true,
                my_benefit: 6,
                location: `/products/${product.id}`,
              },
            })
            expect(res._getStatusCode()).toBe(200)
          })
        })

        describe('when product does not have history', () => {
          it('returns actual product status', async () => {
            await prisma.userProduct.create({
              data: {
                user_id: user.id,
                product_id: product.id,
                price: 0,
              },
            })

            const { req, res } = mockAuthorizedPOSTRequest(
              user.api_key,
              {},
              {
                url: product.url,
              }
            )

            await handler(req, res)

            expect(parseJSON(res)).toEqual({
              ...YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
              product: {
                latest_price: 0,
                my_price: 0,
                has_discount: false,
                my_benefit: 0,
                location: `/products/${product.id}`,
              },
            })
            expect(res._getStatusCode()).toBe(200)
          })
        })
      })
    })
  })
})
