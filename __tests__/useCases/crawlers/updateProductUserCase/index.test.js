import prisma from '../../../../src/lib/prisma'
import { updateProductUseCase as execute } from '../../../../src/useCases/crawlers/updateProductUseCase'
import { cleanDatabase } from '../../../helpers'
import {
  INVALID_PRODUCT_STATUS,
  INVALID_PRODUCT_UUID,
  MISSING_IN_STOCK,
  MISSING_PRICES,
  MISSING_PRODUCT_ID,
  MISSING_STATUS,
  MISSING_TITLE,
  DISCOUNT_PRICE_MUST_BE_A_NUMBER,
  DISCOUNT_PRICE_MUST_BE_POSITIVE,
  ORIGINAL_PRICE_MUST_BE_A_NUMBER,
  ORIGINAL_PRICE_MUST_BE_POSITIVE,
  PRODUCT_DOES_NOT_EXIST,
} from '../../../../src/lib/messages'
const uuid = require('uuid')

beforeEach(async () => {
  await cleanDatabase(prisma)
})

const ensureProductHistoryIsEmpty = async () => {
  const productsHistory = await prisma.productHistory.findMany()
  expect(productsHistory).toEqual([])
}

describe('updateProductUseCase', () => {
  const execution = async (crawlerId, productId, body) => {
    return await execute(crawlerId, productId, body)
  }

  let crawler
  let result

  beforeEach(async () => {
    crawler = await prisma.crawler.create({
      data: {
        location: 'somewhere',
      },
    })
  })

  describe('when missing product_id', () => {
    beforeEach(async () => {
      result = await execution(crawler.id)
    })

    it('returns error', async () => {
      expect(result).toEqual({
        status: 400,
        response: MISSING_PRODUCT_ID,
      })
    })

    it('does not create product history', async () => {
      await ensureProductHistoryIsEmpty()
    })
  })

  describe('when product_id is not a valid UUID', () => {
    beforeEach(async () => {
      result = await execution(crawler.id, 'qwe')
    })

    it('returns error', async () => {
      expect(result).toEqual({
        status: 400,
        response: INVALID_PRODUCT_UUID,
      })
    })

    it('does not create product history', async () => {
      await ensureProductHistoryIsEmpty()
    })
  })

  describe('when product does not exist', () => {
    beforeEach(async () => {
      result = await execution(crawler.id, uuid.v4())
    })

    it('returns error', async () => {
      expect(result).toEqual({
        status: 404,
        response: PRODUCT_DOES_NOT_EXIST,
      })
    })

    it('does not create product history', async () => {
      await ensureProductHistoryIsEmpty()
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
      beforeEach(async () => {
        result = await execution(crawler.id, product.id)
      })

      it('returns error', async () => {
        expect(result).toEqual({
          status: 400,
          response: MISSING_STATUS,
        })
      })

      it('does not create product history', async () => {
        await ensureProductHistoryIsEmpty()
      })
    })

    describe('when status is not supported', () => {
      beforeEach(async () => {
        result = await execution(crawler.id, product.id, {
          status: 'qwe',
        })
      })

      it('returns error', async () => {
        expect(result).toEqual({
          status: 422,
          response: INVALID_PRODUCT_STATUS,
        })
      })

      it('does not create product history', async () => {
        await ensureProductHistoryIsEmpty()
      })
    })

    describe('when status === skip', () => {
      beforeEach(async () => {
        result = await execution(crawler.id, product.id, {
          status: 'skip',
        })
      })

      it('returns empty response', async () => {
        expect(result).toEqual({
          status: 200,
          response: {},
        })
      })

      it('does not create product history', async () => {
        await ensureProductHistoryIsEmpty()
      })
    })

    describe('when status === not_found', () => {
      beforeEach(async () => {
        result = await execution(crawler.id, product.id, {
          status: 'not_found',
          title: 'Product Title',
          original_price: 42,
          discount_price: 35,
        })
      })

      it('returns response', async () => {
        const productsHistory = await prisma.productHistory.findMany()
        expect(productsHistory.length).toEqual(1)

        const productHistory = productsHistory[0]
        expect(result).toEqual({
          status: 200,
          response: {
            id: productHistory.id,
            crawler_id: crawler.id,
            product_id: product.id,
            status: 'not_found',
            discount_price: null,
            original_price: null,
            in_stock: false,
            title: null,
            created_at: productHistory.created_at,
          },
        })
      })

      it('creates product history with default values', async () => {
        const productsHistory = await prisma.productHistory.findMany()
        expect(productsHistory.length).toEqual(1)

        const productHistory = productsHistory[0]
        expect(productHistory.crawler_id).toEqual(crawler.id)
        expect(productHistory.product_id).toEqual(product.id)
        expect(productHistory.status).toEqual('not_found')
        expect(productHistory.original_price).toBeNull()
        expect(productHistory.discount_price).toBeNull()
        expect(productHistory.title).toBeNull()
        expect(productHistory.in_stock).toEqual(false)
      })
    })

    describe('when status === required_to_change_location', () => {
      beforeEach(async () => {
        result = await execution(crawler.id, product.id, {
          status: 'required_to_change_location',
          title: 'Product Title',
          original_price: 42,
          discount_price: 35,
        })
      })

      it('returns response', async () => {
        const productsHistory = await prisma.productHistory.findMany()
        expect(productsHistory.length).toEqual(1)

        const productHistory = productsHistory[0]
        expect(result).toEqual({
          status: 200,
          response: {
            id: productHistory.id,
            crawler_id: crawler.id,
            product_id: product.id,
            status: 'required_to_change_location',
            discount_price: null,
            original_price: null,
            in_stock: false,
            title: null,
            created_at: productHistory.created_at,
          },
        })
      })

      it('creates product history with default values', async () => {
        const productsHistory = await prisma.productHistory.findMany()
        expect(productsHistory.length).toEqual(1)

        const productHistory = productsHistory[0]
        expect(productHistory.crawler_id).toEqual(crawler.id)
        expect(productHistory.product_id).toEqual(product.id)
        expect(productHistory.status).toEqual('required_to_change_location')
        expect(productHistory.original_price).toBeNull()
        expect(productHistory.discount_price).toBeNull()
        expect(productHistory.title).toBeNull()
        expect(productHistory.in_stock).toEqual(false)
      })
    })

    describe('when status === age_restriction', () => {
      beforeEach(async () => {
        result = await execution(crawler.id, product.id, {
          status: 'age_restriction',
          title: 'Product Title',
          original_price: 42,
          discount_price: 35,
        })
      })

      it('returns response', async () => {
        const productsHistory = await prisma.productHistory.findMany()
        expect(productsHistory.length).toEqual(1)

        const productHistory = productsHistory[0]
        expect(result).toEqual({
          status: 200,
          response: {
            id: productHistory.id,
            crawler_id: crawler.id,
            product_id: product.id,
            status: 'age_restriction',
            discount_price: null,
            original_price: null,
            in_stock: false,
            title: null,
            created_at: productHistory.created_at,
          },
        })
      })

      it('creates product history with default values', async () => {
        const productsHistory = await prisma.productHistory.findMany()
        expect(productsHistory.length).toEqual(1)

        const productHistory = productsHistory[0]
        expect(productHistory.crawler_id).toEqual(crawler.id)
        expect(productHistory.product_id).toEqual(product.id)
        expect(productHistory.status).toEqual('age_restriction')
        expect(productHistory.original_price).toBeNull()
        expect(productHistory.discount_price).toBeNull()
        expect(productHistory.title).toBeNull()
        expect(productHistory.in_stock).toEqual(false)
      })
    })

    describe('when status === ok', () => {
      describe('when missing in_stock', () => {
        beforeEach(async () => {
          result = await execution(crawler.id, product.id, {
            status: 'ok',
          })
        })

        it('returns error', async () => {
          expect(result).toEqual({
            status: 400,
            response: MISSING_IN_STOCK,
          })
        })

        it('does not create product history', async () => {
          await ensureProductHistoryIsEmpty()
        })
      })

      describe('when in_stock is not a boolean', () => {
        it.todo('returns error')
        it.todo('does not create product history')
      })

      describe('when is out of stock', () => {
        it.todo('adds history as is')
      })

      describe('when is in_stock', () => {
        describe('when missing title', () => {
          beforeEach(async () => {
            result = await execution(crawler.id, product.id, {
              status: 'ok',
              in_stock: true,
            })
          })

          it('returns error', async () => {
            expect(result).toEqual({
              status: 400,
              response: MISSING_TITLE,
            })
          })

          it('does not create product history', async () => {
            await ensureProductHistoryIsEmpty()
          })
        })

        describe('when title length is greater than 512', () => {
          it.todo('truncates title length to the first 512 symbols')
        })

        describe('when missing prices', () => {
          beforeEach(async () => {
            result = await execution(crawler.id, product.id, {
              status: 'ok',
              in_stock: true,
              title: 'Product Title',
            })
          })

          it('returns error', async () => {
            expect(result).toEqual({
              status: 400,
              response: MISSING_PRICES,
            })
          })

          it('does not create product history', async () => {
            await ensureProductHistoryIsEmpty()
          })
        })

        describe('with discount price only', () => {
          describe('when price is not a number', () => {
            beforeEach(async () => {
              result = await execution(crawler.id, product.id, {
                status: 'ok',
                in_stock: true,
                title: 'Product Title',
                discount_price: '1.1a',
              })
            })

            it('returns error', async () => {
              expect(result).toEqual({
                status: 422,
                response: DISCOUNT_PRICE_MUST_BE_A_NUMBER,
              })
            })

            it('does not create product history', async () => {
              await ensureProductHistoryIsEmpty()
            })
          })

          describe('when price is negative', () => {
            beforeEach(async () => {
              result = await execution(crawler.id, product.id, {
                status: 'ok',
                in_stock: true,
                title: 'Product Title',
                discount_price: -1,
              })
            })

            it('returns error', async () => {
              expect(result).toEqual({
                status: 422,
                response: DISCOUNT_PRICE_MUST_BE_POSITIVE,
              })
            })

            it('does not create product history', async () => {
              await ensureProductHistoryIsEmpty()
            })
          })

          describe('when price is positive number', () => {
            describe('without history', () => {
              beforeEach(async () => {
                result = await execution(crawler.id, product.id, {
                  status: 'ok',
                  in_stock: true,
                  title: '  Product  ',
                  discount_price: 35,
                })
              })

              it('returns success', async () => {
                expect(result.status).toEqual(200)
                expect(result.response).not.toEqual({})
              })

              it('creates a record in product history', async () => {
                const productsHistory = await prisma.productHistory.findMany()
                expect(productsHistory.length).toEqual(1)

                const productHistory = productsHistory[0]
                expect(productHistory.crawler_id).toEqual(crawler.id)
                expect(productHistory.product_id).toEqual(product.id)
                expect(productHistory.discount_price).toEqual(35)
                expect(productHistory.original_price).toBeNull()
                expect(productHistory.in_stock).toEqual(true)
                expect(productHistory.title).toEqual('Product')
                expect(productHistory.status).toEqual('ok')
              })
            })

            describe('with history', () => {
              describe('with users', () => {
                let user
                let user2

                beforeEach(async () => {
                  user = await prisma.user.create({
                    data: {
                      login: 'user1',
                      password: 'password',
                    },
                  })

                  user2 = await prisma.user.create({
                    data: {
                      login: 'user2',
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

                  await prisma.userProduct.create({
                    data: {
                      user_id: user2.id,
                      product_id: product.id,
                      price: 11,
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
                    beforeEach(async () => {
                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        discount_price: 35,
                      })
                    })

                    it('does not add message to telegram_messages', async () => {
                      const telegramMessages =
                        await prisma.telegramMessage.findMany()

                      expect(telegramMessages).toEqual([])
                    })
                  })

                  describe('when user has telegram_account', () => {
                    beforeEach(async () => {
                      await prisma.user.update({
                        where: { id: user.id },
                        data: { telegram_account: '123' },
                      })

                      await prisma.user.update({
                        where: { id: user2.id },
                        data: { telegram_account: '456' },
                      })

                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        discount_price: 35,
                      })
                    })

                    it('adds price to users who do not have price for this product', async () => {
                      const userProducts = await prisma.userProduct.findMany({
                        orderBy: { created_at: 'asc' },
                      })

                      expect(userProducts.length).toEqual(2)

                      expect(userProducts[0].user_id).toEqual(user.id)
                      expect(userProducts[0].price).toEqual(35)

                      expect(userProducts[1].user_id).toEqual(user2.id)
                      expect(userProducts[1].price).toEqual(11)
                    })

                    it('adds message to telegram_messages', async () => {
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
                    beforeEach(async () => {
                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        discount_price: 35,
                      })
                    })

                    it('does not add message to telegram_messages', async () => {
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
                      beforeEach(async () => {
                        result = await execution(crawler.id, product.id, {
                          status: 'ok',
                          in_stock: true,
                          title: '  Product  ',
                          discount_price: 35,
                        })
                      })

                      it('does not add message to telegram_messages', async () => {
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

                        await prisma.user.update({
                          where: {
                            id: user2.id,
                          },
                          data: {
                            telegram_account: '456',
                          },
                        })
                      })

                      describe('when user does not have product subscription', () => {
                        beforeEach(async () => {
                          result = await execution(crawler.id, product.id, {
                            status: 'ok',
                            in_stock: true,
                            title: '  Product  ',
                            discount_price: 35,
                          })
                        })

                        it('does not add message to telegram_messages', async () => {
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
                              subscription_type: 'on_change_status_to_in_stock',
                            },
                          })

                          result = await execution(crawler.id, product.id, {
                            status: 'ok',
                            in_stock: true,
                            title: '  Product  ',
                            discount_price: 35,
                          })
                        })

                        it('adds message to telegram_messages', async () => {
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

                it('returns success', async () => {
                  result = await execution(crawler.id, product.id, {
                    status: 'ok',
                    in_stock: true,
                    title: '  Product  ',
                    discount_price: 35,
                  })

                  expect(result.status).toEqual(200)
                  expect(result.response).not.toEqual({})
                })

                it('creates a record in product history', async () => {
                  result = await execution(crawler.id, product.id, {
                    status: 'ok',
                    in_stock: true,
                    title: '  Product  ',
                    discount_price: 35,
                  })

                  const productsHistory = await prisma.productHistory.findMany()
                  expect(productsHistory.length).toEqual(1)

                  const productHistory = productsHistory[0]
                  expect(productHistory.crawler_id).toEqual(crawler.id)
                  expect(productHistory.product_id).toEqual(product.id)
                  expect(productHistory.discount_price).toEqual(35)
                  expect(productHistory.original_price).toBeNull()
                  expect(productHistory.in_stock).toEqual(true)
                  expect(productHistory.title).toEqual('Product')
                  expect(productHistory.status).toEqual('ok')
                })
              })
            })
          })
        })

        describe('with original price only', () => {
          describe('when price is not a number', () => {
            beforeEach(async () => {
              result = await execution(crawler.id, product.id, {
                status: 'ok',
                in_stock: true,
                title: 'Product Title',
                original_price: '1.1a',
              })
            })

            it('returns error', async () => {
              expect(result).toEqual({
                status: 422,
                response: ORIGINAL_PRICE_MUST_BE_A_NUMBER,
              })
            })

            it('does not create product history', async () => {
              await ensureProductHistoryIsEmpty()
            })
          })

          describe('when price is negative', () => {
            beforeEach(async () => {
              result = await execution(crawler.id, product.id, {
                status: 'ok',
                in_stock: true,
                title: 'Product Title',
                original_price: -1,
              })
            })

            it('returns error', async () => {
              expect(result).toEqual({
                status: 422,
                response: ORIGINAL_PRICE_MUST_BE_POSITIVE,
              })
            })

            it('does not create product history', async () => {
              await ensureProductHistoryIsEmpty()
            })
          })

          describe('when price is positive number', () => {
            describe('without history', () => {
              beforeEach(async () => {
                result = await execution(crawler.id, product.id, {
                  status: 'ok',
                  in_stock: true,
                  title: '  Product  ',
                  original_price: 42,
                })
              })

              it('returns success', async () => {
                expect(result.status).toEqual(200)
                expect(result.response).not.toEqual({})
              })

              it('creates a record in product history', async () => {
                const productsHistory = await prisma.productHistory.findMany()
                expect(productsHistory.length).toEqual(1)

                const productHistory = productsHistory[0]
                expect(productHistory.crawler_id).toEqual(crawler.id)
                expect(productHistory.product_id).toEqual(product.id)
                expect(productHistory.discount_price).toBeNull()
                expect(productHistory.original_price).toEqual(42)
                expect(productHistory.in_stock).toEqual(true)
                expect(productHistory.title).toEqual('Product')
                expect(productHistory.status).toEqual('ok')
              })
            })

            describe('with history', () => {
              describe('with users', () => {
                let user
                let user2

                beforeEach(async () => {
                  user = await prisma.user.create({
                    data: {
                      login: 'user1',
                      password: 'password',
                    },
                  })

                  user2 = await prisma.user.create({
                    data: {
                      login: 'user2',
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

                  await prisma.userProduct.create({
                    data: {
                      user_id: user2.id,
                      product_id: product.id,
                      price: 11,
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
                    beforeEach(async () => {
                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        original_price: 42,
                      })
                    })

                    it('does not add message to telegram_messages', async () => {
                      const telegramMessages =
                        await prisma.telegramMessage.findMany()

                      expect(telegramMessages).toEqual([])
                    })
                  })

                  describe('when user has telegram_account', () => {
                    beforeEach(async () => {
                      await prisma.user.update({
                        where: { id: user.id },
                        data: { telegram_account: '123' },
                      })

                      await prisma.user.update({
                        where: { id: user2.id },
                        data: { telegram_account: '456' },
                      })

                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        original_price: 42,
                      })
                    })

                    it('adds price to users who do not have price for this product', async () => {
                      const userProducts = await prisma.userProduct.findMany({
                        orderBy: { created_at: 'asc' },
                      })

                      expect(userProducts.length).toEqual(2)

                      expect(userProducts[0].user_id).toEqual(user.id)
                      expect(userProducts[0].price).toEqual(42)

                      expect(userProducts[1].user_id).toEqual(user2.id)
                      expect(userProducts[1].price).toEqual(11)
                    })

                    it('adds message to telegram_messages', async () => {
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
                    beforeEach(async () => {
                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        original_price: 42,
                      })
                    })

                    it('does not add message to telegram_messages', async () => {
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
                      beforeEach(async () => {
                        result = await execution(crawler.id, product.id, {
                          status: 'ok',
                          in_stock: true,
                          title: '  Product  ',
                          original_price: 42,
                        })
                      })

                      it('does not add message to telegram_messages', async () => {
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

                        await prisma.user.update({
                          where: {
                            id: user2.id,
                          },
                          data: {
                            telegram_account: '456',
                          },
                        })
                      })

                      describe('when user does not have product subscription', () => {
                        beforeEach(async () => {
                          result = await execution(crawler.id, product.id, {
                            status: 'ok',
                            in_stock: true,
                            title: '  Product  ',
                            original_price: 42,
                          })
                        })

                        it('does not add message to telegram_messages', async () => {
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
                              subscription_type: 'on_change_status_to_in_stock',
                            },
                          })

                          result = await execution(crawler.id, product.id, {
                            status: 'ok',
                            in_stock: true,
                            title: '  Product  ',
                            original_price: 42,
                          })
                        })

                        it('adds message to telegram_messages', async () => {
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

                it('returns success', async () => {
                  result = await execution(crawler.id, product.id, {
                    status: 'ok',
                    in_stock: true,
                    title: '  Product  ',
                    original_price: 42,
                  })

                  expect(result.status).toEqual(200)
                  expect(result.response).not.toEqual({})
                })

                it('creates a record in product history', async () => {
                  result = await execution(crawler.id, product.id, {
                    status: 'ok',
                    in_stock: true,
                    title: '  Product  ',
                    original_price: 42,
                  })

                  const productsHistory = await prisma.productHistory.findMany()
                  expect(productsHistory.length).toEqual(1)

                  const productHistory = productsHistory[0]
                  expect(productHistory.crawler_id).toEqual(crawler.id)
                  expect(productHistory.product_id).toEqual(product.id)
                  expect(productHistory.discount_price).toBeNull()
                  expect(productHistory.original_price).toEqual(42)
                  expect(productHistory.in_stock).toEqual(true)
                  expect(productHistory.title).toEqual('Product')
                  expect(productHistory.status).toEqual('ok')
                })
              })
            })
          })
        })

        describe('with both prices', () => {
          describe('without history', () => {
            beforeEach(async () => {
              result = await execution(crawler.id, product.id, {
                status: 'ok',
                in_stock: true,
                title: '  Product  ',
                original_price: 42,
                discount_price: 35,
              })
            })

            it('returns success', async () => {
              expect(result.status).toEqual(200)
              expect(result.response).not.toEqual({})
            })

            it('creates a record in product history', async () => {
              const productsHistory = await prisma.productHistory.findMany()
              expect(productsHistory.length).toEqual(1)

              const productHistory = productsHistory[0]
              expect(productHistory.crawler_id).toEqual(crawler.id)
              expect(productHistory.product_id).toEqual(product.id)
              expect(productHistory.discount_price).toEqual(35)
              expect(productHistory.original_price).toEqual(42)
              expect(productHistory.in_stock).toEqual(true)
              expect(productHistory.title).toEqual('Product')
              expect(productHistory.status).toEqual('ok')
            })
          })

          describe('with history', () => {
            describe('with users', () => {
              let user
              let user2

              beforeEach(async () => {
                user = await prisma.user.create({
                  data: {
                    login: 'user1',
                    password: 'password',
                  },
                })

                user2 = await prisma.user.create({
                  data: {
                    login: 'user2',
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

                await prisma.userProduct.create({
                  data: {
                    user_id: user2.id,
                    product_id: product.id,
                    price: 11,
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
                  beforeEach(async () => {
                    result = await execution(crawler.id, product.id, {
                      status: 'ok',
                      in_stock: true,
                      title: '  Product  ',
                      original_price: 42,
                      discount_price: 35,
                    })
                  })

                  it('does not add message to telegram_messages', async () => {
                    const telegramMessages =
                      await prisma.telegramMessage.findMany()

                    expect(telegramMessages).toEqual([])
                  })
                })

                describe('when user has telegram_account', () => {
                  beforeEach(async () => {
                    await prisma.user.update({
                      where: { id: user.id },
                      data: { telegram_account: '123' },
                    })

                    await prisma.user.update({
                      where: { id: user2.id },
                      data: { telegram_account: '456' },
                    })

                    result = await execution(crawler.id, product.id, {
                      status: 'ok',
                      in_stock: true,
                      title: '  Product  ',
                      original_price: 42,
                      discount_price: 35,
                    })
                  })

                  it('adds lowest price to users who do not have price for this product', async () => {
                    const userProducts = await prisma.userProduct.findMany({
                      orderBy: { created_at: 'asc' },
                    })

                    expect(userProducts.length).toEqual(2)

                    expect(userProducts[0].user_id).toEqual(user.id)
                    expect(userProducts[0].price).toEqual(35)

                    expect(userProducts[1].user_id).toEqual(user2.id)
                    expect(userProducts[1].price).toEqual(11)
                  })

                  it('adds message to telegram_messages', async () => {
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
                  beforeEach(async () => {
                    result = await execution(crawler.id, product.id, {
                      status: 'ok',
                      in_stock: true,
                      title: '  Product  ',
                      original_price: 42,
                      discount_price: 35,
                    })
                  })

                  it('does not add message to telegram_messages', async () => {
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
                    beforeEach(async () => {
                      result = await execution(crawler.id, product.id, {
                        status: 'ok',
                        in_stock: true,
                        title: '  Product  ',
                        original_price: 42,
                        discount_price: 35,
                      })
                    })

                    it('does not add message to telegram_messages', async () => {
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

                      await prisma.user.update({
                        where: {
                          id: user2.id,
                        },
                        data: {
                          telegram_account: '456',
                        },
                      })
                    })

                    describe('when user does not have product subscription', () => {
                      beforeEach(async () => {
                        result = await execution(crawler.id, product.id, {
                          status: 'ok',
                          in_stock: true,
                          title: '  Product  ',
                          original_price: 42,
                          discount_price: 35,
                        })
                      })

                      it('does not add message to telegram_messages', async () => {
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
                            subscription_type: 'on_change_status_to_in_stock',
                          },
                        })

                        result = await execution(crawler.id, product.id, {
                          status: 'ok',
                          in_stock: true,
                          title: '  Product  ',
                          original_price: 42,
                          discount_price: 35,
                        })
                      })

                      it('adds message to telegram_messages', async () => {
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

              it('returns success', async () => {
                result = await execution(crawler.id, product.id, {
                  status: 'ok',
                  in_stock: true,
                  title: '  Product  ',
                  original_price: 42,
                  discount_price: 35,
                })

                expect(result.status).toEqual(200)
                expect(result.response).not.toEqual({})
              })

              it('creates a record in product history', async () => {
                result = await execution(crawler.id, product.id, {
                  status: 'ok',
                  in_stock: true,
                  title: '  Product  ',
                  original_price: 42,
                  discount_price: 35,
                })

                const productsHistory = await prisma.productHistory.findMany()
                expect(productsHistory.length).toEqual(1)

                const productHistory = productsHistory[0]
                expect(productHistory.crawler_id).toEqual(crawler.id)
                expect(productHistory.product_id).toEqual(product.id)
                expect(productHistory.discount_price).toEqual(35)
                expect(productHistory.original_price).toEqual(42)
                expect(productHistory.in_stock).toEqual(true)
                expect(productHistory.title).toEqual('Product')
                expect(productHistory.status).toEqual('ok')
              })
            })
          })
        })
      })
    })
  })
})
