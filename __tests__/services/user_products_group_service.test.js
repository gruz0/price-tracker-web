import prisma from '../../src/lib/prisma'
import { UserProductsGroupService as service } from '../../src/services/user_products_group_service'
import { cleanDatabase } from '../helpers'
const uuid = require('uuid')

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('getProductsInGroup', () => {
  const execution = async (userId, productsGroupId) => {
    return await service.getProductsInGroup(userId, productsGroupId)
  }

  describe('when userId is missing', () => {
    it('raises error', async () => {
      try {
        await execution()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userId')
      }
    })
  })

  describe('when userId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userId')
      }
    })
  })

  describe('when userId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution('qwe')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя должен быть UUID')
      }
    })
  })

  describe('when productsGroupId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productsGroupId')
      }
    })
  })

  describe('when productsGroupId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productsGroupId')
      }
    })
  })

  describe('when productsGroupId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch(
          'ID группы товаров пользователя должен быть UUID'
        )
      }
    })
  })

  describe('when user does not exist', () => {
    test('returns empty array', async () => {
      const result = await execution(uuid.v4(), uuid.v4())

      expect(result).toEqual([])
    })
  })

  it('returns matched user products', async () => {
    const crawler = await prisma.crawler.create({
      data: {
        location: 'Somewhere',
      },
    })

    const user = await prisma.user.create({
      data: {
        login: 'user1',
        password: 'password',
      },
    })

    const productExistsAndInStockWithOriginalPriceOnly =
      await prisma.product.create({
        data: {
          title: 'Product 1',
          url: 'https://domain1.tld',
          url_hash: 'hash1',
          shop: 'shop',
        },
      })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productExistsAndInStockWithOriginalPriceOnly.id,
          crawler_id: crawler.id,
          original_price: 17.0,
          in_stock: true,
          status: 'ok',
          created_at: new Date('2022-06-12 13:03:00'),
        },
      ],
    })

    const userProductExistsAndInStockWithOriginalPriceOnly =
      await prisma.userProduct.create({
        data: {
          user_id: user.id,
          product_id: productExistsAndInStockWithOriginalPriceOnly.id,
          price: 20.2,
        },
      })

    const productExistsAndInStockWithLowestDiscountPrice =
      await prisma.product.create({
        data: {
          title: 'Product 2',
          url: 'https://domain2.tld',
          url_hash: 'hash2',
          shop: 'shop',
        },
      })

    const userProductExistsAndInStockWithLowestDiscountPrice =
      await prisma.userProduct.create({
        data: {
          user_id: user.id,
          product_id: productExistsAndInStockWithLowestDiscountPrice.id,
          price: 20.2,
        },
      })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productExistsAndInStockWithLowestDiscountPrice.id,
          crawler_id: crawler.id,
          original_price: 23.0,
          discount_price: 22.9,
          in_stock: true,
          status: 'ok',
          created_at: new Date('2022-06-12 13:03:00'),
        },
      ],
    })

    const productExistsAndNotInStockWithLowestDiscountPrice =
      await prisma.product.create({
        data: {
          title: 'Product 3',
          url: 'https://domain3.tld',
          url_hash: 'hash3',
          shop: 'shop',
        },
      })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productExistsAndNotInStockWithLowestDiscountPrice.id,
          crawler_id: crawler.id,
          original_price: 23.0,
          discount_price: 20.0,
          in_stock: false,
          status: 'ok',
          created_at: new Date('2022-06-12 13:10:00'),
        },
      ],
    })

    const userProductExistsAndNotInStockWithLowestDiscountPrice =
      await prisma.userProduct.create({
        data: {
          user_id: user.id,
          product_id: productExistsAndNotInStockWithLowestDiscountPrice.id,
          price: 30.3,
        },
      })

    const productExistsAndNotInStockWithBothPrices =
      await prisma.product.create({
        data: {
          title: 'Product 4',
          url: 'https://domain4.tld',
          url_hash: 'hash4',
          shop: 'shop',
        },
      })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productExistsAndNotInStockWithBothPrices.id,
          crawler_id: crawler.id,
          status: 'not_found',
          created_at: new Date('2022-06-12 13:00:00'),
        },
        {
          product_id: productExistsAndNotInStockWithBothPrices.id,
          crawler_id: crawler.id,
          status: 'skip',
          created_at: new Date('2022-06-12 13:01:00'),
        },
        {
          product_id: productExistsAndNotInStockWithBothPrices.id,
          crawler_id: crawler.id,
          status: 'required_to_change_location',
          created_at: new Date('2022-06-12 13:02:00'),
        },
        // NOTE: Появится только эта запись
        {
          product_id: productExistsAndNotInStockWithBothPrices.id,
          crawler_id: crawler.id,
          original_price: 50,
          discount_price: 38,
          in_stock: false,
          status: 'ok',
          created_at: new Date('2022-06-12 13:04:00'),
        },
      ],
    })

    const userProductExistsAndNotInStockWithBothPrices =
      await prisma.userProduct.create({
        data: {
          user_id: user.id,
          product_id: productExistsAndNotInStockWithBothPrices.id,
          price: 10.1,
        },
      })

    const productWithLastHistoryIsNotFound = await prisma.product.create({
      data: {
        title: 'Product Not Found',
        url: 'https://domain5.tld',
        url_hash: 'hash5',
        shop: 'shop',
      },
    })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productWithLastHistoryIsNotFound.id,
          crawler_id: crawler.id,
          original_price: 50,
          discount_price: 38,
          in_stock: true,
          status: 'ok',
          created_at: new Date('2022-06-12 13:03:00'),
        },
        // NOTE: Появится только эта запись
        {
          product_id: productWithLastHistoryIsNotFound.id,
          crawler_id: crawler.id,
          status: 'not_found',
          created_at: new Date('2022-06-12 13:20:00'),
        },
      ],
    })

    const userProductWithLastHistoryIsNotFound =
      await prisma.userProduct.create({
        data: {
          user_id: user.id,
          product_id: productWithLastHistoryIsNotFound.id,
          price: 1,
        },
      })

    // Группа товаров
    const userProductsGroup1 = await prisma.userProductsGroup.create({
      data: {
        user_id: user.id,
        title: 'Products Group 1',
      },
    })

    await prisma.userProductsGroupItem.createMany({
      data: [
        {
          user_id: user.id,
          user_products_group_id: userProductsGroup1.id,
          user_product_id: userProductExistsAndNotInStockWithBothPrices.id,
        },
        {
          user_id: user.id,
          user_products_group_id: userProductsGroup1.id,
          user_product_id:
            userProductExistsAndInStockWithLowestDiscountPrice.id,
        },
        {
          user_id: user.id,
          user_products_group_id: userProductsGroup1.id,
          user_product_id:
            userProductExistsAndNotInStockWithLowestDiscountPrice.id,
        },
        {
          user_id: user.id,
          user_products_group_id: userProductsGroup1.id,
          user_product_id: userProductWithLastHistoryIsNotFound.id,
        },
        {
          user_id: user.id,
          user_products_group_id: userProductsGroup1.id,
          user_product_id: userProductExistsAndInStockWithOriginalPriceOnly.id,
        },
      ],
    })

    // NOTE: Этот товар будет проигнорирован, потому что он не находится в текущей группе товаров
    const productNotInProductsGroup = await prisma.product.create({
      data: {
        title: 'Product Not In Products Group',
        url: 'https://domain6.tld',
        url_hash: 'hash6',
        shop: 'shop',
      },
    })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productNotInProductsGroup.id,
          crawler_id: crawler.id,
          status: 'ok',
          created_at: new Date('2022-06-12 13:00:00'),
        },
      ],
    })

    await prisma.userProduct.create({
      data: {
        user_id: user.id,
        product_id: productNotInProductsGroup.id,
        price: 40.4,
      },
    })

    // NOTE: Этот товар будет проигнорирован, потому что находится в другой группе
    const productFromAnotherProductsGroup = await prisma.product.create({
      data: {
        title: 'Product From Another Products Group',
        url: 'https://domain7.tld',
        url_hash: 'hash7',
        shop: 'shop',
      },
    })

    await prisma.productHistory.createMany({
      data: [
        {
          product_id: productFromAnotherProductsGroup.id,
          crawler_id: crawler.id,
          original_price: 23.0,
          in_stock: true,
          status: 'ok',
        },
      ],
    })

    const userProductFromAnotherProductsGroup = await prisma.userProduct.create(
      {
        data: {
          user_id: user.id,
          product_id: productFromAnotherProductsGroup.id,
          price: 100,
        },
      }
    )

    const userProductsGroup2 = await prisma.userProductsGroup.create({
      data: {
        user_id: user.id,
        title: 'Products Group 2',
      },
    })

    await prisma.userProductsGroupItem.createMany({
      data: [
        {
          user_id: user.id,
          user_products_group_id: userProductsGroup2.id,
          user_product_id: userProductFromAnotherProductsGroup.id,
        },
      ],
    })

    const result = await execution(user.id, userProductsGroup1.id)

    expect(result).toEqual([
      {
        product_id: productExistsAndInStockWithOriginalPriceOnly.id,
        product_title: productExistsAndInStockWithOriginalPriceOnly.title,
        product_url: productExistsAndInStockWithOriginalPriceOnly.url,
        product_shop: productExistsAndInStockWithOriginalPriceOnly.shop,
        history_min_price: 17.0,
        history_in_stock: true,
        history_updated_at: new Date('2022-06-12 13:03:00').toISOString(),
        product_exists: true,
      },
      {
        product_id: productExistsAndInStockWithLowestDiscountPrice.id,
        product_title: productExistsAndInStockWithLowestDiscountPrice.title,
        product_url: productExistsAndInStockWithLowestDiscountPrice.url,
        product_shop: productExistsAndInStockWithLowestDiscountPrice.shop,
        history_min_price: 22.9,
        history_in_stock: true,
        history_updated_at: new Date('2022-06-12 13:03:00').toISOString(),
        product_exists: true,
      },
      {
        product_id: productExistsAndNotInStockWithLowestDiscountPrice.id,
        product_title: productExistsAndNotInStockWithLowestDiscountPrice.title,
        product_url: productExistsAndNotInStockWithLowestDiscountPrice.url,
        product_shop: productExistsAndNotInStockWithLowestDiscountPrice.shop,
        history_min_price: 20.0,
        history_in_stock: false,
        history_updated_at: new Date('2022-06-12 13:10:00').toISOString(),
        product_exists: true,
      },
      {
        product_id: productExistsAndNotInStockWithBothPrices.id,
        product_title: productExistsAndNotInStockWithBothPrices.title,
        product_url: productExistsAndNotInStockWithBothPrices.url,
        product_shop: productExistsAndNotInStockWithBothPrices.shop,
        history_min_price: 38,
        history_in_stock: false,
        history_updated_at: new Date('2022-06-12 13:04:00').toISOString(),
        product_exists: true,
      },
      {
        product_id: productWithLastHistoryIsNotFound.id,
        product_title: productWithLastHistoryIsNotFound.title,
        product_url: productWithLastHistoryIsNotFound.url,
        product_shop: productWithLastHistoryIsNotFound.shop,
        history_min_price: null,
        history_in_stock: false,
        history_updated_at: new Date('2022-06-12 13:20:00').toISOString(),
        product_exists: false,
      },
    ])
  })
})

describe('isItemExists', () => {
  const execution = async (userId, productsGroupId, userProductId) => {
    return await service.isItemExists(userId, productsGroupId, userProductId)
  }

  describe('when userId is missing', () => {
    it('raises error', async () => {
      try {
        await execution()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userId')
      }
    })
  })

  describe('when userId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userId')
      }
    })
  })

  describe('when userId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution('qwe')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя должен быть UUID')
      }
    })
  })

  describe('when productsGroupId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productsGroupId')
      }
    })
  })

  describe('when productsGroupId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productsGroupId')
      }
    })
  })

  describe('when productsGroupId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch(
          'ID группы товаров пользователя должен быть UUID'
        )
      }
    })
  })

  describe('when userProductId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара пользователя должен быть UUID')
      }
    })
  })

  describe('when user does not exist', () => {
    test('returns false', async () => {
      const result = await execution(uuid.v4(), uuid.v4(), uuid.v4())

      expect(result).toEqual(false)
    })
  })

  describe('when user exists', () => {
    let user
    let productsGroup

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      productsGroup = await prisma.userProductsGroup.create({
        data: {
          user_id: user.id,
          title: 'Products Group',
        },
      })
    })

    describe('when products group does not exist', () => {
      test('returns false', async () => {
        const result = await execution(user.id, uuid.v4(), uuid.v4())

        expect(result).toEqual(false)
      })
    })

    describe('when products group exists', () => {
      describe('when requested product is not in the group', () => {
        test('returns false', async () => {
          const result = await execution(user.id, productsGroup.id, uuid.v4())

          expect(result).toEqual(false)
        })
      })

      describe('when requested product is in the group', () => {
        test('returns true', async () => {
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
              price: 20.2,
            },
          })

          await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: productsGroup.id,
              user_product_id: userProduct.id,
            },
          })

          const result = await execution(
            user.id,
            productsGroup.id,
            userProduct.id
          )

          expect(result).toEqual(true)
        })
      })
    })
  })
})

describe('addItem', () => {
  const execution = async (userId, productsGroupId, userProductId) => {
    return await service.addItem(userId, productsGroupId, userProductId)
  }

  describe('when userId is missing', () => {
    it('raises error', async () => {
      try {
        await execution()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userId')
      }
    })
  })

  describe('when userId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userId')
      }
    })
  })

  describe('when userId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution('qwe')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя должен быть UUID')
      }
    })
  })

  describe('when productsGroupId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productsGroupId')
      }
    })
  })

  describe('when productsGroupId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productsGroupId')
      }
    })
  })

  describe('when productsGroupId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch(
          'ID группы товаров пользователя должен быть UUID'
        )
      }
    })
  })

  describe('when userProductId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара пользователя должен быть UUID')
      }
    })
  })

  describe('when user does not exist', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4(), uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Пользователь не существует')
      }
    })
  })

  describe('when user exists', () => {
    let user

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })
    })

    describe('when user does not have product', () => {
      it('raises error', async () => {
        try {
          await execution(user.id, uuid.v4(), uuid.v4())
        } catch (e) {
          expect(e.message).toMatch('Товара нет у пользователя')
        }
      })
    })

    describe('when user has product', () => {
      let userProduct

      beforeEach(async () => {
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
            price: 20.2,
          },
        })
      })

      describe('when products group does not exist', () => {
        it('raises error', async () => {
          try {
            await execution(user.id, uuid.v4(), userProduct.id)
          } catch (e) {
            expect(e.message).toMatch('Группа товаров не существует')
          }
        })
      })

      describe('when products group exists', () => {
        let productsGroup

        beforeEach(async () => {
          productsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })
        })

        describe('when requested product is in the group', () => {
          test('raises error', async () => {
            await prisma.userProductsGroupItem.create({
              data: {
                user_id: user.id,
                user_products_group_id: productsGroup.id,
                user_product_id: userProduct.id,
              },
            })

            try {
              await execution(user.id, productsGroup.id, userProduct.id)
            } catch (e) {
              expect(e.message).toMatch(
                'Товар уже имеется в группе товаров пользователя'
              )
            }
          })
        })

        describe('when requested product is not in the group', () => {
          test('adds item to the group', async () => {
            const result = await execution(
              user.id,
              productsGroup.id,
              userProduct.id
            )

            expect(result.user_id).toEqual(user.id)
            expect(result.user_products_group_id).toEqual(productsGroup.id)
            expect(result.user_product_id).toEqual(userProduct.id)
          })
        })
      })
    })
  })
})
