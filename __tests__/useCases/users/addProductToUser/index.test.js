import prisma from '../../../../src/lib/prisma'
import { addProductToUserUseCase as execute } from '../../../../src/useCases/users/addProductToUser'
import { cleanDatabase } from '../../../helpers'
import {
  INVALID_URL,
  IT_IS_NOT_A_SINGLE_PRODUCT_URL,
  MISSING_URL,
  PRODUCT_ADDED_TO_QUEUE,
  PRODUCT_ADDED_TO_USER,
  SHOP_IS_NOT_SUPPORTED_YET,
  UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
  YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
} from '../../../../src/lib/messages'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('addProductToUserUseCase', () => {
  const execution = async (user, url) => {
    return await execute({ user, url })
  }

  let user

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        login: 'user1',
        password: 'password',
      },
    })
  })

  describe('when user is not an object', () => {
    it('raises error', async () => {
      try {
        await execution('', '')
      } catch (e) {
        expect(e.message).toMatch('Некорректный объект user')
      }
    })
  })

  describe('when user is an empty object', () => {
    it('raises error', async () => {
      try {
        await execution({}, '')
      } catch (e) {
        expect(e.message).toMatch('Некорректный объект user')
      }
    })
  })

  describe('when url is not set', () => {
    it('returns error', async () => {
      const result = await execution(user)

      expect(result).toEqual({
        status: 422,
        response: MISSING_URL,
      })
    })
  })

  describe('when url is not a string', () => {
    it('returns error', async () => {
      const result = await execution(user, 1)

      expect(result).toEqual({
        status: 422,
        response: MISSING_URL,
      })
    })
  })

  describe('when url is an empty string', () => {
    it('returns error', async () => {
      const result = await execution(user, ' ')

      expect(result).toEqual({
        status: 422,
        response: MISSING_URL,
      })
    })
  })

  describe('when url is not a valid URL', () => {
    it('returns error', async () => {
      const result = await execution(user, 'domain.tld')

      expect(result).toEqual({
        status: 422,
        response: INVALID_URL,
      })
    })
  })

  describe('when shop is not supported', () => {
    it('returns error', async () => {
      const result = await execution(user, 'https://domain.tld')

      expect(result).toEqual({
        status: 422,
        response: SHOP_IS_NOT_SUPPORTED_YET,
      })
    })
  })

  describe('when it is not a single product page URL', () => {
    it('returns error', async () => {
      const result = await execution(
        user,
        'https://www.ozon.ru/category/protsessory-15726/'
      )

      expect(result).toEqual({
        status: 422,
        response: IT_IS_NOT_A_SINGLE_PRODUCT_URL,
      })
    })
  })

  describe('when product does not exist', () => {
    it('returns success', async () => {
      const result = await execution(user, 'https://m.ozon.ru/product/42')

      expect(result).toEqual({
        status: 201,
        response: PRODUCT_ADDED_TO_QUEUE,
      })
    })

    it('adds product to queue', async () => {
      await execution(user, 'https://www.ozon.ru/product/42')

      const productsInQueue = await prisma.productQueue.findMany()

      expect(productsInQueue.length).toEqual(1)
      expect(productsInQueue[0].url).toEqual('https://www.ozon.ru/product/42')
      expect(productsInQueue[0].url_hash).toEqual(
        '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
      )
      expect(productsInQueue[0].requested_by_id).toEqual(user.id)
    })

    it('removes extra query args from url', async () => {
      await execution(user, 'https://www.ozon.ru/product/42?qwe=zxc')

      const productsInQueue = await prisma.productQueue.findMany()

      expect(productsInQueue.length).toEqual(1)
      expect(productsInQueue[0].url).toEqual('https://www.ozon.ru/product/42')
      expect(productsInQueue[0].requested_by_id).toEqual(user.id)
    })

    describe('when alternate domain is used', () => {
      it('adds product to queue with original domain', async () => {
        await execution(user, 'https://m.ozon.ru/product/42')

        const productsInQueue = await prisma.productQueue.findMany()

        expect(productsInQueue.length).toEqual(1)
        expect(productsInQueue[0].url).toEqual('https://www.ozon.ru/product/42')
        expect(productsInQueue[0].url_hash).toEqual(
          '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
        )
        expect(productsInQueue[0].requested_by_id).toEqual(user.id)
      })
    })
  })

  describe('when product exists', () => {
    let product
    let crawler

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          title: 'Product 1',
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
      it('returns success', async () => {
        await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42.2,
          },
        })

        const result = await execution(user, product.url)

        expect(result).toEqual({
          status: 200,
          response: {
            ...YOU_ARE_ALREADY_HAVE_THIS_PRODUCT,
            location: `/products/${product.id}`,
          },
        })
      })
    })

    describe('when user does not have this product', () => {
      describe('without history', () => {
        it('returns success', async () => {
          const result = await execution(user, product.url)

          expect(result).toEqual({
            status: 201,
            response: {
              ...PRODUCT_ADDED_TO_USER,
              location: `/products/${product.id}`,
            },
          })
        })

        it('adds product to user with zero price', async () => {
          await execution(user, product.url)

          const userProducts = await prisma.userProduct.findMany({
            where: { user_id: user.id },
          })

          expect(userProducts.length).toEqual(1)
          expect(userProducts[0].product_id).toEqual(product.id)
          expect(userProducts[0].price).toEqual(0)
        })
      })

      describe('with history', () => {
        describe('status === skip', () => {
          beforeEach(async () => {
            await prisma.productHistory.create({
              data: {
                product_id: product.id,
                status: 'skip',
                title: 'Title',
                crawler_id: crawler.id,
              },
            })
          })

          it('returns success', async () => {
            const result = await execution(user, product.url)

            expect(result).toEqual({
              status: 201,
              response: {
                ...PRODUCT_ADDED_TO_USER,
                location: `/products/${product.id}`,
              },
            })
          })

          it('adds product to user with zero price', async () => {
            await execution(user, product.url)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })

            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(product.id)
            expect(userProducts[0].price).toEqual(0)
          })
        })

        describe('status === age_restriction', () => {
          beforeEach(async () => {
            await prisma.productHistory.create({
              data: {
                product_id: product.id,
                status: 'age_restriction',
                title: 'Title',
                crawler_id: crawler.id,
              },
            })
          })

          it('returns success', async () => {
            const result = await execution(user, product.url)

            expect(result).toEqual({
              status: 201,
              response: {
                ...PRODUCT_ADDED_TO_USER,
                location: `/products/${product.id}`,
              },
            })
          })

          it('adds product to user with zero price', async () => {
            await execution(user, product.url)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })

            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(product.id)
            expect(userProducts[0].price).toEqual(0)
          })
        })

        describe('status === required_to_change_location', () => {
          beforeEach(async () => {
            await prisma.productHistory.create({
              data: {
                product_id: product.id,
                status: 'required_to_change_location',
                title: 'Title',
                crawler_id: crawler.id,
              },
            })
          })

          it('returns success', async () => {
            const result = await execution(user, product.url)

            expect(result).toEqual({
              status: 201,
              response: {
                ...PRODUCT_ADDED_TO_USER,
                location: `/products/${product.id}`,
              },
            })
          })

          it('adds product to user with zero price', async () => {
            await execution(user, product.url)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })

            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(product.id)
            expect(userProducts[0].price).toEqual(0)
          })
        })

        describe('status === not_found', () => {
          beforeEach(async () => {
            await prisma.productHistory.create({
              data: {
                product_id: product.id,
                status: 'not_found',
                title: 'Title',
                crawler_id: crawler.id,
              },
            })
          })

          it('returns success', async () => {
            const result = await execution(user, product.url)

            expect(result).toEqual({
              status: 201,
              response: {
                ...PRODUCT_ADDED_TO_USER,
                location: `/products/${product.id}`,
              },
            })
          })

          it('adds product to user with zero price', async () => {
            await execution(user, product.url)

            const userProducts = await prisma.userProduct.findMany({
              where: { user_id: user.id },
            })

            expect(userProducts.length).toEqual(1)
            expect(userProducts[0].product_id).toEqual(product.id)
            expect(userProducts[0].price).toEqual(0)
          })
        })

        describe('status === ok', () => {
          describe('when product is out of stock', () => {
            describe('without prices', () => {
              beforeEach(async () => {
                await prisma.productHistory.create({
                  data: {
                    product_id: product.id,
                    in_stock: false,
                    status: 'ok',
                    title: 'Title',
                    crawler_id: crawler.id,
                  },
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with zero price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(0)
              })
            })

            describe('with discount price only', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      discount_price: 35,
                      in_stock: false,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with discount price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(35)
              })
            })

            describe('with original_price only', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      original_price: 42,
                      in_stock: false,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with original price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(42)
              })
            })

            describe('with both prices', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      original_price: 42,
                      discount_price: 35,
                      in_stock: false,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with lowest price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(35)
              })
            })

            describe('when product is on hold', () => {
              beforeEach(async () => {
                await prisma.product.update({
                  where: { id: product.id },
                  data: { status: 'hold' },
                })

                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      original_price: 99,
                      discount_price: 87,
                      in_stock: false,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('updates product status to active', async () => {
                await execution(user, product.url)

                const existedProduct = await prisma.product.findUnique({
                  where: { id: product.id },
                })

                expect(existedProduct.status).toEqual('active')
              })
            })
          })

          describe('when product is in stock', () => {
            describe('without prices', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      in_stock: true,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns error', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 500,
                  response:
                    UNABLE_TO_ADD_PRODUCT_TO_USER_RIGHT_NOW_BECAUSE_OF_MISSING_PRICE,
                })
              })

              it('does not add product to user', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(0)
              })
            })

            describe('with discount price only', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      discount_price: 35,
                      in_stock: true,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with discount price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(35)
              })
            })

            describe('with original price only', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      original_price: 42,
                      in_stock: true,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with original price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(42)
              })
            })

            describe('with both prices', () => {
              beforeEach(async () => {
                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      original_price: 42,
                      discount_price: 35,
                      in_stock: true,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('adds product to user with lowest price', async () => {
                await execution(user, product.url)

                const userProducts = await prisma.userProduct.findMany({
                  where: { user_id: user.id },
                })

                expect(userProducts.length).toEqual(1)
                expect(userProducts[0].product_id).toEqual(product.id)
                expect(userProducts[0].price).toEqual(35)
              })
            })

            describe('when product is on hold', () => {
              beforeEach(async () => {
                await prisma.product.update({
                  where: { id: product.id },
                  data: { status: 'hold' },
                })

                await prisma.productHistory.createMany({
                  data: [
                    {
                      product_id: product.id,
                      original_price: 99,
                      discount_price: 87,
                      in_stock: true,
                      status: 'ok',
                      title: 'Title',
                      crawler_id: crawler.id,
                    },
                  ],
                })
              })

              it('returns success', async () => {
                const result = await execution(user, product.url)

                expect(result).toEqual({
                  status: 201,
                  response: {
                    ...PRODUCT_ADDED_TO_USER,
                    location: `/products/${product.id}`,
                  },
                })
              })

              it('updates product status to active', async () => {
                await execution(user, product.url)

                const existedProduct = await prisma.product.findUnique({
                  where: { id: product.id },
                })

                expect(existedProduct.status).toEqual('active')
              })
            })
          })
        })
      })
    })
  })
})
