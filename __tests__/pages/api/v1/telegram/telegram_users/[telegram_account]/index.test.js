import prisma from '../../../../../../../src/lib/prisma'

import {
  cleanDatabase,
  mockAuthorizedPOSTRequest,
} from '../../../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/telegram/telegram_users/[telegram_account]/products'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  BOT_DOES_NOT_EXIST,
  USER_DOES_NOT_EXIST,
  MISSING_TELEGRAM_ACCOUNT,
  MISSING_URL,
  INVALID_URL,
  SHOP_IS_NOT_SUPPORTED_YET,
  PRODUCT_ADDED_TO_QUEUE,
  REDIRECT_TO_PRODUCT_PAGE,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
  PRODUCT_ADDED_TO_USER,
} from '../../../../../../../src/lib/messages'
import { parseJSON } from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'

const ENDPOINT = '/api/v1/telegram/telegram_users/[telegram_account]/products'

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
    whenTokenNotFound(method, handler, 404, BOT_DOES_NOT_EXIST)
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
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`POST ${ENDPOINT}`, () => {
  whenNotAuthorized('POST')

  let bot

  beforeEach(async () => {
    bot = await prisma.bot.create({
      data: {
        location: 'somewhere',
      },
    })
  })

  describe('when missing telegram_account', () => {
    test('returns error', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(bot.token, {})

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_TELEGRAM_ACCOUNT)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when user does not exist', () => {
    test('returns error', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(bot.token, {
        telegram_account: 'qwe',
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(USER_DOES_NOT_EXIST)
      expect(res._getStatusCode()).toBe(404)
    })
  })

  describe('when missing url', () => {
    test('returns error', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: 'qwe',
        },
      })

      const { req, res } = mockAuthorizedPOSTRequest(bot.token, {
        telegram_account: user.telegram_account,
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_URL)
      expect(res._getStatusCode()).toBe(422)
    })
  })

  describe('when url is not a valid url', () => {
    test('returns error', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: 'qwe',
        },
      })

      const { req, res } = mockAuthorizedPOSTRequest(
        bot.token,
        {
          telegram_account: user.telegram_account,
        },
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
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: 'qwe',
        },
      })

      const { req, res } = mockAuthorizedPOSTRequest(
        bot.token,
        {
          telegram_account: user.telegram_account,
        },
        {
          url: 'https://domain.tld',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(SHOP_IS_NOT_SUPPORTED_YET)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when product does not exist', () => {
    test('adds new product to queue', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: 'qwe',
        },
      })

      const { req, res } = mockAuthorizedPOSTRequest(
        bot.token,
        {
          telegram_account: user.telegram_account,
        },
        {
          url: 'https://ozon.ru',
        }
      )

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      expect(parseJSON(res)).toEqual(PRODUCT_ADDED_TO_QUEUE)

      const productInQueue = await prisma.productQueue.findMany()
      expect(productInQueue.length).toEqual(1)
      expect(productInQueue[0].url).toEqual('https://ozon.ru/')
    })

    test('removes extra query args from url', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: 'qwe',
        },
      })

      const { req, res } = mockAuthorizedPOSTRequest(
        bot.token,
        {
          telegram_account: user.telegram_account,
        },
        {
          url: 'https://ozon.ru/?qwe=zxc',
        }
      )

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      expect(parseJSON(res)).toEqual(PRODUCT_ADDED_TO_QUEUE)

      const productInQueue = await prisma.productQueue.findMany()
      expect(productInQueue.length).toEqual(1)
      expect(productInQueue[0].url).toEqual('https://ozon.ru/')
    })
  })

  describe('when product exists', () => {
    describe('when user has this product', () => {
      test('does nothing', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
            telegram_account: 'qwe',
          },
        })

        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://ozon.ru',
            url_hash:
              '4d9bcf604a702d30b50ab1d0ac830209bfe7c5bfec95d0787fbbb4ca741129dc',
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
          bot.token,
          {
            telegram_account: user.telegram_account,
          },
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
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://ozon.ru',
            url_hash:
              '4d9bcf604a702d30b50ab1d0ac830209bfe7c5bfec95d0787fbbb4ca741129dc',
            shop: 'shop',
          },
        })

        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
            telegram_account: 'qwe',
          },
        })

        const { req, res } = mockAuthorizedPOSTRequest(
          bot.token,
          {
            telegram_account: user.telegram_account,
          },
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
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://ozon.ru',
            url_hash:
              '4d9bcf604a702d30b50ab1d0ac830209bfe7c5bfec95d0787fbbb4ca741129dc',
            shop: 'shop',
          },
        })

        const crawler = await prisma.crawler.create({
          data: { location: 'location' },
        })

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

        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
            telegram_account: 'qwe',
          },
        })

        const { req, res } = mockAuthorizedPOSTRequest(
          bot.token,
          {
            telegram_account: user.telegram_account,
          },
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
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://ozon.ru',
            url_hash:
              '4d9bcf604a702d30b50ab1d0ac830209bfe7c5bfec95d0787fbbb4ca741129dc',
            shop: 'shop',
          },
        })

        const crawler = await prisma.crawler.create({
          data: { location: 'location' },
        })

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

        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
            telegram_account: 'qwe',
          },
        })

        const { req, res } = mockAuthorizedPOSTRequest(
          bot.token,
          {
            telegram_account: user.telegram_account,
          },
          {
            url: product.url,
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)
        expect(parseJSON(res)).toEqual({
          ...PRODUCT_ADDED_TO_USER,
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
        const product = await prisma.product.create({
          data: {
            title: 'Product',
            url: 'https://ozon.ru',
            url_hash:
              '4d9bcf604a702d30b50ab1d0ac830209bfe7c5bfec95d0787fbbb4ca741129dc',
            shop: 'shop',
          },
        })

        const crawler = await prisma.crawler.create({
          data: { location: 'location' },
        })

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

        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
            telegram_account: 'qwe',
          },
        })

        const { req, res } = mockAuthorizedPOSTRequest(
          bot.token,
          {
            telegram_account: user.telegram_account,
          },
          {
            url: product.url,
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)
        expect(parseJSON(res)).toEqual({
          ...PRODUCT_ADDED_TO_USER,
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
    })
  })
})
