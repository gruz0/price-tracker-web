import prisma from '../../../../../../../src/lib/prisma'
import {
  cleanDatabase,
  mockAuthorizedPUTRequest,
} from '../../../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/crawlers/products/[product_id]/index'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  CRAWLER_DOES_NOT_EXIST,
  MISSING_STATUS,
  INVALID_PRODUCT_STATUS,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  MISSING_PRODUCT_ID,
  INVALID_PRODUCT_UUID,
  PRODUCT_DOES_NOT_EXIST,
  MISSING_IN_STOCK,
  MISSING_PRICES,
  DISCOUNT_PRICE_MUST_BE_A_NUMBER,
  MISSING_TITLE,
  ORIGINAL_PRICE_MUST_BE_A_NUMBER,
} from '../../../../../../../src/lib/messages'
import { parseJSON } from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'
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
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token)

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_PRODUCT_ID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product_id is not a valid UUID', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPUTRequest(crawler.token, {
          product_id: 'qwe',
        })

        await handler(req, res)

        expect(parseJSON(res)).toEqual(INVALID_PRODUCT_UUID)
        expect(res._getStatusCode()).toBe(400)
      })
    })

    describe('when product does not exist', () => {
      test('returns error', async () => {
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
        test('returns error', async () => {
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

      describe('when status is not supported', () => {
        test('returns error', async () => {
          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'qwe',
              in_stock: true,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(INVALID_PRODUCT_STATUS)
          expect(res._getStatusCode()).toBe(422)

          const productsHistory = await prisma.productHistory.findMany()
          expect(productsHistory).toEqual([])
        })
      })

      describe('when missing in_stock', () => {
        test('returns error', async () => {
          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'not_found',
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual(MISSING_IN_STOCK)
          expect(res._getStatusCode()).toBe(400)

          const productsHistory = await prisma.productHistory.findMany()
          expect(productsHistory).toEqual([])
        })
      })

      describe('when status === skip', () => {
        test('does nothing', async () => {
          const { req, res } = mockAuthorizedPUTRequest(
            crawler.token,
            {
              product_id: product.id,
            },
            {
              status: 'skip',
              in_stock: false,
            }
          )

          await handler(req, res)

          expect(parseJSON(res)).toEqual({})
          expect(res._getStatusCode()).toBe(200)

          const productsHistory = await prisma.productHistory.findMany()
          expect(productsHistory).toEqual([])
        })
      })

      describe('when status === ok', () => {
        describe('when is in_stock', () => {
          describe('when missing prices', () => {
            test('returns error', async () => {
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

              expect(parseJSON(res)).toEqual(MISSING_PRICES)
              expect(res._getStatusCode()).toBe(400)

              const productsHistory = await prisma.productHistory.findMany()
              expect(productsHistory).toEqual([])
            })
          })

          describe('when missing title', () => {
            test('returns error', async () => {
              const { req, res } = mockAuthorizedPUTRequest(
                crawler.token,
                {
                  product_id: product.id,
                },
                {
                  status: 'ok',
                  in_stock: true,
                  discount_price: 35,
                }
              )

              await handler(req, res)

              expect(parseJSON(res)).toEqual(MISSING_TITLE)
              expect(res._getStatusCode()).toBe(400)

              const productsHistory = await prisma.productHistory.findMany()
              expect(productsHistory).toEqual([])
            })
          })

          describe('with discount price only', () => {
            let body

            describe('when price is not a number', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  discount_price: '1.1a',
                }
              })

              test('returns error', async () => {
                const { req, res } = mockAuthorizedPUTRequest(
                  crawler.token,
                  {
                    product_id: product.id,
                  },
                  body
                )

                await handler(req, res)

                expect(parseJSON(res)).toEqual(DISCOUNT_PRICE_MUST_BE_A_NUMBER)
                expect(res._getStatusCode()).toBe(422)
              })
            })

            describe('when price is negative', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  discount_price: -1,
                }
              })

              test('returns error', async () => {
                const { req, res } = mockAuthorizedPUTRequest(
                  crawler.token,
                  {
                    product_id: product.id,
                  },
                  body
                )

                await handler(req, res)

                expect(parseJSON(res)).toEqual(DISCOUNT_PRICE_MUST_BE_POSITIVE)
                expect(res._getStatusCode()).toBe(422)
              })
            })

            describe('when price is positive number', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  discount_price: 35,
                }
              })

              describe('without history', () => {
                test('returns success', async () => {
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
                  expect(result.original_price).toBeNull()
                  expect(result.in_stock).toEqual(true)
                  expect(result.title).toEqual('Product')
                  expect(result.status).toEqual('ok')
                  expect(result.created_at).not.toEqual('')
                  expect(result.id).not.toEqual('')

                  expect(res._getStatusCode()).toBe(200)
                })

                test('creates a record in product history', async () => {
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
                  expect(productsHistory[0].original_price).toBeNull()
                  expect(productsHistory[0].in_stock).toEqual(true)
                  expect(productsHistory[0].title).toEqual('Product')
                  expect(productsHistory[0].status).toEqual('ok')
                })
              })

              describe('with history', () => {
                describe('with users', () => {
                  let user

                  beforeEach(async () => {
                    user = await prisma.user.create({
                      data: {
                        login: 'user1',
                        password: 'password',
                      },
                    })

                    await prisma.userProduct.create({
                      data: {
                        user_id: user.id,
                        product_id: product.id,
                        price: 0,
                      },
                    })
                  })

                  describe('when product was not in stock', () => {
                    beforeEach(async () => {
                      await prisma.productHistory.create({
                        data: {
                          product_id: product.id,
                          crawler_id: crawler.id,
                          status: 'not_found',
                          in_stock: false,
                        },
                      })
                    })

                    describe('when user does not have telegram_account', () => {
                      test('does not add message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages).toEqual([])
                      })
                    })

                    describe('when user has telegram_account', () => {
                      beforeEach(async () => {
                        await prisma.user.update({
                          where: {
                            id: user.id,
                          },
                          data: {
                            telegram_account: '123',
                          },
                        })
                      })

                      test('adds price to users who do not have price for this product', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const userProducts = await prisma.userProduct.findMany({
                          where: {
                            user_id: user.id,
                          },
                        })

                        expect(userProducts.length).toEqual(1)
                        expect(userProducts[0].price).toEqual(35)
                      })

                      test('adds message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages.length).toEqual(1)
                        expect(telegramMessages[0].user_id).toEqual(user.id)
                        expect(telegramMessages[0].message).toEqual(
                          `Добавленный вами товар [${product.title}](${product.url}) первый раз появился в наличии!\n\n` +
                            `Текущая цена товара: 35.\n` +
                            `[Карточка товара в Chartik](http://localhost:3000/products/${product.id}).`
                        )
                      })
                    })
                  })

                  describe('when product was in stock', () => {
                    beforeEach(async () => {
                      await prisma.productHistory.create({
                        data: {
                          product_id: product.id,
                          crawler_id: crawler.id,
                          status: 'ok',
                          in_stock: true,
                          created_at: new Date('2022-01-01'),
                        },
                      })
                    })

                    describe('when recent history is in stock', () => {
                      test('does not add message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages).toEqual([])
                      })
                    })

                    describe('when recent history is not in stock', () => {
                      beforeEach(async () => {
                        await prisma.productHistory.create({
                          data: {
                            product_id: product.id,
                            crawler_id: crawler.id,
                            status: 'ok',
                            in_stock: false,
                          },
                        })
                      })

                      describe('when user does not have telegram_account', () => {
                        test('does not add message to telegram_messages', async () => {
                          const { req, res } = mockAuthorizedPUTRequest(
                            crawler.token,
                            {
                              product_id: product.id,
                            },
                            body
                          )

                          await handler(req, res)
                          expect(res._getStatusCode()).toBe(200)

                          const telegramMessages =
                            await prisma.telegramMessage.findMany()

                          expect(telegramMessages).toEqual([])
                        })
                      })

                      describe('when user has telegram_account', () => {
                        beforeEach(async () => {
                          await prisma.user.update({
                            where: {
                              id: user.id,
                            },
                            data: {
                              telegram_account: '123',
                            },
                          })
                        })

                        describe('when user does not have product subscription', () => {
                          test('does not add message to telegram_messages', async () => {
                            const { req, res } = mockAuthorizedPUTRequest(
                              crawler.token,
                              {
                                product_id: product.id,
                              },
                              body
                            )

                            await handler(req, res)
                            expect(res._getStatusCode()).toBe(200)

                            const telegramMessages =
                              await prisma.telegramMessage.findMany()

                            expect(telegramMessages).toEqual([])
                          })
                        })

                        describe('when user has product subscription', () => {
                          beforeEach(async () => {
                            await prisma.userProductSubscription.create({
                              data: {
                                user_id: user.id,
                                product_id: product.id,
                                subscription_type:
                                  'on_change_status_to_in_stock',
                              },
                            })
                          })

                          test('adds message to telegram_messages', async () => {
                            const { req, res } = mockAuthorizedPUTRequest(
                              crawler.token,
                              {
                                product_id: product.id,
                              },
                              body
                            )

                            await handler(req, res)
                            expect(res._getStatusCode()).toBe(200)

                            const telegramMessages =
                              await prisma.telegramMessage.findMany()

                            expect(telegramMessages.length).toEqual(1)
                            expect(telegramMessages[0].user_id).toEqual(user.id)
                            expect(telegramMessages[0].message).toEqual(
                              `Добавленный вами товар [${product.title}](${product.url}) появился в наличии!\n\n` +
                                `Текущая цена товара: 35.\n` +
                                `[Карточка товара в Chartik](http://localhost:3000/products/${product.id}).`
                            )
                          })
                        })
                      })
                    })
                  })
                })

                test('returns success', async () => {
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
                  expect(result.original_price).toBeNull()
                  expect(result.in_stock).toEqual(true)
                  expect(result.title).toEqual('Product')
                  expect(result.status).toEqual('ok')
                  expect(result.created_at).not.toEqual('')
                  expect(result.id).not.toEqual('')

                  expect(res._getStatusCode()).toBe(200)
                })

                test('creates a record in product history', async () => {
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
                  expect(productsHistory[0].original_price).toBeNull()
                  expect(productsHistory[0].in_stock).toEqual(true)
                  expect(productsHistory[0].title).toEqual('Product')
                  expect(productsHistory[0].status).toEqual('ok')
                })
              })
            })
          })

          describe('with original price only', () => {
            let body

            describe('when price is not a number', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  original_price: '1.1a',
                }
              })

              test('returns error', async () => {
                const { req, res } = mockAuthorizedPUTRequest(
                  crawler.token,
                  {
                    product_id: product.id,
                  },
                  body
                )

                await handler(req, res)

                expect(parseJSON(res)).toEqual(ORIGINAL_PRICE_MUST_BE_A_NUMBER)
                expect(res._getStatusCode()).toBe(422)
              })
            })

            describe('when price is negative', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  original_price: -1,
                }
              })

              test('returns error', async () => {
                const { req, res } = mockAuthorizedPUTRequest(
                  crawler.token,
                  {
                    product_id: product.id,
                  },
                  body
                )

                await handler(req, res)

                expect(parseJSON(res)).toEqual(ORIGINAL_PRICE_MUST_BE_POSITIVE)
                expect(res._getStatusCode()).toBe(422)
              })
            })

            describe('when price is positive number', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  original_price: 42,
                }
              })

              describe('without history', () => {
                test('returns success', async () => {
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
                  expect(result.discount_price).toBeNull()
                  expect(result.original_price).toEqual(42)
                  expect(result.in_stock).toEqual(true)
                  expect(result.title).toEqual('Product')
                  expect(result.status).toEqual('ok')
                  expect(result.created_at).not.toEqual('')
                  expect(result.id).not.toEqual('')

                  expect(res._getStatusCode()).toBe(200)
                })

                test('creates a record in product history', async () => {
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
                  expect(productsHistory[0].discount_price).toBeNull()
                  expect(productsHistory[0].original_price).toEqual(42)
                  expect(productsHistory[0].in_stock).toEqual(true)
                  expect(productsHistory[0].title).toEqual('Product')
                  expect(productsHistory[0].status).toEqual('ok')
                })
              })

              describe('with history', () => {
                describe('with users', () => {
                  let user

                  beforeEach(async () => {
                    user = await prisma.user.create({
                      data: {
                        login: 'user1',
                        password: 'password',
                      },
                    })

                    await prisma.userProduct.create({
                      data: {
                        user_id: user.id,
                        product_id: product.id,
                        price: 0,
                      },
                    })
                  })

                  describe('when product was not in stock', () => {
                    beforeEach(async () => {
                      await prisma.productHistory.create({
                        data: {
                          product_id: product.id,
                          crawler_id: crawler.id,
                          status: 'not_found',
                          in_stock: false,
                        },
                      })
                    })

                    describe('when user does not have telegram_account', () => {
                      test('does not add message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages).toEqual([])
                      })
                    })

                    describe('when user has telegram_account', () => {
                      beforeEach(async () => {
                        await prisma.user.update({
                          where: {
                            id: user.id,
                          },
                          data: {
                            telegram_account: '123',
                          },
                        })
                      })

                      test('adds price to users who do not have price for this product', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const userProducts = await prisma.userProduct.findMany({
                          where: {
                            user_id: user.id,
                          },
                        })

                        expect(userProducts.length).toEqual(1)
                        expect(userProducts[0].price).toEqual(42)
                      })

                      test('adds message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages.length).toEqual(1)
                        expect(telegramMessages[0].user_id).toEqual(user.id)
                        expect(telegramMessages[0].message).toEqual(
                          `Добавленный вами товар [${product.title}](${product.url}) первый раз появился в наличии!\n\n` +
                            `Текущая цена товара: 42.\n` +
                            `[Карточка товара в Chartik](http://localhost:3000/products/${product.id}).`
                        )
                      })
                    })
                  })

                  describe('when product was in stock', () => {
                    beforeEach(async () => {
                      await prisma.productHistory.create({
                        data: {
                          product_id: product.id,
                          crawler_id: crawler.id,
                          status: 'ok',
                          in_stock: true,
                          created_at: new Date('2022-01-01'),
                        },
                      })
                    })

                    describe('when recent history is in stock', () => {
                      test('does not add message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages).toEqual([])
                      })
                    })

                    describe('when recent history is not in stock', () => {
                      beforeEach(async () => {
                        await prisma.productHistory.create({
                          data: {
                            product_id: product.id,
                            crawler_id: crawler.id,
                            status: 'ok',
                            in_stock: false,
                          },
                        })
                      })

                      describe('when user does not have telegram_account', () => {
                        test('does not add message to telegram_messages', async () => {
                          const { req, res } = mockAuthorizedPUTRequest(
                            crawler.token,
                            {
                              product_id: product.id,
                            },
                            body
                          )

                          await handler(req, res)
                          expect(res._getStatusCode()).toBe(200)

                          const telegramMessages =
                            await prisma.telegramMessage.findMany()

                          expect(telegramMessages).toEqual([])
                        })
                      })

                      describe('when user has telegram_account', () => {
                        beforeEach(async () => {
                          await prisma.user.update({
                            where: {
                              id: user.id,
                            },
                            data: {
                              telegram_account: '123',
                            },
                          })
                        })

                        describe('when user does not have product subscription', () => {
                          test('does not add message to telegram_messages', async () => {
                            const { req, res } = mockAuthorizedPUTRequest(
                              crawler.token,
                              {
                                product_id: product.id,
                              },
                              body
                            )

                            await handler(req, res)
                            expect(res._getStatusCode()).toBe(200)

                            const telegramMessages =
                              await prisma.telegramMessage.findMany()

                            expect(telegramMessages).toEqual([])
                          })
                        })

                        describe('when user has product subscription', () => {
                          beforeEach(async () => {
                            await prisma.userProductSubscription.create({
                              data: {
                                user_id: user.id,
                                product_id: product.id,
                                subscription_type:
                                  'on_change_status_to_in_stock',
                              },
                            })
                          })

                          test('adds message to telegram_messages', async () => {
                            const { req, res } = mockAuthorizedPUTRequest(
                              crawler.token,
                              {
                                product_id: product.id,
                              },
                              body
                            )

                            await handler(req, res)
                            expect(res._getStatusCode()).toBe(200)

                            const telegramMessages =
                              await prisma.telegramMessage.findMany()

                            expect(telegramMessages.length).toEqual(1)
                            expect(telegramMessages[0].user_id).toEqual(user.id)
                            expect(telegramMessages[0].message).toEqual(
                              `Добавленный вами товар [${product.title}](${product.url}) появился в наличии!\n\n` +
                                `Текущая цена товара: 42.\n` +
                                `[Карточка товара в Chartik](http://localhost:3000/products/${product.id}).`
                            )
                          })
                        })
                      })
                    })
                  })
                })

                test('returns success', async () => {
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
                  expect(result.discount_price).toBeNull()
                  expect(result.original_price).toEqual(42)
                  expect(result.in_stock).toEqual(true)
                  expect(result.title).toEqual('Product')
                  expect(result.status).toEqual('ok')
                  expect(result.created_at).not.toEqual('')
                  expect(result.id).not.toEqual('')

                  expect(res._getStatusCode()).toBe(200)
                })

                test('creates a record in product history', async () => {
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
                  expect(productsHistory[0].discount_price).toBeNull()
                  expect(productsHistory[0].original_price).toEqual(42)
                  expect(productsHistory[0].in_stock).toEqual(true)
                  expect(productsHistory[0].title).toEqual('Product')
                  expect(productsHistory[0].status).toEqual('ok')
                })
              })
            })
          })

          describe('with both prices', () => {
            let body

            describe('when price are positive', () => {
              beforeEach(() => {
                body = {
                  status: 'ok',
                  in_stock: true,
                  title: 'Product',
                  original_price: 42,
                  discount_price: 35,
                }
              })

              describe('without history', () => {
                test('returns success', async () => {
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

                test('creates a record in product history', async () => {
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
                describe('with users', () => {
                  let user

                  beforeEach(async () => {
                    user = await prisma.user.create({
                      data: {
                        login: 'user1',
                        password: 'password',
                      },
                    })

                    await prisma.userProduct.create({
                      data: {
                        user_id: user.id,
                        product_id: product.id,
                        price: 0,
                      },
                    })
                  })

                  describe('when product was not in stock', () => {
                    beforeEach(async () => {
                      await prisma.productHistory.create({
                        data: {
                          product_id: product.id,
                          crawler_id: crawler.id,
                          status: 'not_found',
                          in_stock: false,
                        },
                      })
                    })

                    describe('when user does not have telegram_account', () => {
                      test('does not add message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages).toEqual([])
                      })
                    })

                    describe('when user has telegram_account', () => {
                      beforeEach(async () => {
                        await prisma.user.update({
                          where: {
                            id: user.id,
                          },
                          data: {
                            telegram_account: '123',
                          },
                        })
                      })

                      test('adds discount price to users who do not have price for this product', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const userProducts = await prisma.userProduct.findMany({
                          where: {
                            user_id: user.id,
                          },
                        })

                        expect(userProducts.length).toEqual(1)
                        expect(userProducts[0].price).toEqual(35)
                      })

                      test('adds message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages.length).toEqual(1)
                        expect(telegramMessages[0].user_id).toEqual(user.id)
                        expect(telegramMessages[0].message).toEqual(
                          `Добавленный вами товар [${product.title}](${product.url}) первый раз появился в наличии!\n\n` +
                            `Текущая цена товара: 35.\n` +
                            `[Карточка товара в Chartik](http://localhost:3000/products/${product.id}).`
                        )
                      })
                    })
                  })

                  describe('when product was in stock', () => {
                    beforeEach(async () => {
                      await prisma.productHistory.create({
                        data: {
                          product_id: product.id,
                          crawler_id: crawler.id,
                          status: 'ok',
                          in_stock: true,
                          created_at: new Date('2022-01-01'),
                        },
                      })
                    })

                    describe('when recent history is in stock', () => {
                      test('does not add message to telegram_messages', async () => {
                        const { req, res } = mockAuthorizedPUTRequest(
                          crawler.token,
                          {
                            product_id: product.id,
                          },
                          body
                        )

                        await handler(req, res)
                        expect(res._getStatusCode()).toBe(200)

                        const telegramMessages =
                          await prisma.telegramMessage.findMany()

                        expect(telegramMessages).toEqual([])
                      })
                    })

                    describe('when recent history is not in stock', () => {
                      beforeEach(async () => {
                        await prisma.productHistory.create({
                          data: {
                            product_id: product.id,
                            crawler_id: crawler.id,
                            status: 'ok',
                            in_stock: false,
                          },
                        })
                      })

                      describe('when user does not have telegram_account', () => {
                        test('does not add message to telegram_messages', async () => {
                          const { req, res } = mockAuthorizedPUTRequest(
                            crawler.token,
                            {
                              product_id: product.id,
                            },
                            body
                          )

                          await handler(req, res)
                          expect(res._getStatusCode()).toBe(200)

                          const telegramMessages =
                            await prisma.telegramMessage.findMany()

                          expect(telegramMessages).toEqual([])
                        })
                      })

                      describe('when user has telegram_account', () => {
                        beforeEach(async () => {
                          await prisma.user.update({
                            where: {
                              id: user.id,
                            },
                            data: {
                              telegram_account: '123',
                            },
                          })
                        })

                        describe('when user does not have product subscription', () => {
                          test('does not add message to telegram_messages', async () => {
                            const { req, res } = mockAuthorizedPUTRequest(
                              crawler.token,
                              {
                                product_id: product.id,
                              },
                              body
                            )

                            await handler(req, res)
                            expect(res._getStatusCode()).toBe(200)

                            const telegramMessages =
                              await prisma.telegramMessage.findMany()

                            expect(telegramMessages).toEqual([])
                          })
                        })

                        describe('when user has product subscription', () => {
                          beforeEach(async () => {
                            await prisma.userProductSubscription.create({
                              data: {
                                user_id: user.id,
                                product_id: product.id,
                                subscription_type:
                                  'on_change_status_to_in_stock',
                              },
                            })
                          })

                          test('adds message to telegram_messages', async () => {
                            const { req, res } = mockAuthorizedPUTRequest(
                              crawler.token,
                              {
                                product_id: product.id,
                              },
                              body
                            )

                            await handler(req, res)
                            expect(res._getStatusCode()).toBe(200)

                            const telegramMessages =
                              await prisma.telegramMessage.findMany()

                            expect(telegramMessages.length).toEqual(1)
                            expect(telegramMessages[0].user_id).toEqual(user.id)
                            expect(telegramMessages[0].message).toEqual(
                              `Добавленный вами товар [${product.title}](${product.url}) появился в наличии!\n\n` +
                                `Текущая цена товара: 35.\n` +
                                `[Карточка товара в Chartik](http://localhost:3000/products/${product.id}).`
                            )
                          })
                        })
                      })
                    })
                  })
                })

                test('returns success', async () => {
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

                test('creates a record in product history', async () => {
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
