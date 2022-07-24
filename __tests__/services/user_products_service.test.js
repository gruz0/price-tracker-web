import prisma from '../../src/lib/prisma'
import { UserProductsService as service } from '../../src/services/user_products_service'
import { cleanDatabase } from '../helpers'
const uuid = require('uuid')

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('all', () => {
  const execution = async (userId) => {
    return await service.all(userId)
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

  describe('when user does not exist', () => {
    test('returns empty array', async () => {
      const result = await execution(uuid.v4())

      expect(result).toEqual([])
    })
  })

  describe('when user exists', () => {
    describe('when user does not have products', () => {
      test('returns empty array', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const result = await execution(user.id)

        expect(result).toEqual([])
      })
    })

    describe('when user has products', () => {
      test('returns products ordered by title ascending', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const product1 = await prisma.product.create({
          data: {
            title: 'Product 2',
            url: 'https://domain1.tld',
            url_hash: 'hash1',
            shop: 'shop',
          },
        })

        const product2 = await prisma.product.create({
          data: {
            title: 'Product 1',
            url: 'https://domain2.tld',
            url_hash: 'hash2',
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

        const result = await execution(user.id)

        expect(result).toEqual([
          {
            product_id: product2.id,
            user_product_id: userProduct2.id,
            title: product2.title,
          },
          {
            product_id: product1.id,
            user_product_id: userProduct1.id,
            title: product1.title,
          },
        ])
      })
    })
  })
})

describe('getByUserIdAndProductId', () => {
  const execution = async (userId, productId) => {
    return await service.getByUserIdAndProductId(userId, productId)
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

  describe('when productId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара должен быть UUID')
      }
    })
  })

  describe('when user does not exist', () => {
    test('returns null', async () => {
      const result = await execution(uuid.v4(), uuid.v4())

      expect(result).toBeNull()
    })
  })

  describe('when user exists', () => {
    describe('when user does not have product', () => {
      test('returns null', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const result = await execution(user.id, uuid.v4())

        expect(result).toBeNull()
      })
    })

    describe('when requested product related to another user', () => {
      test('returns null', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const user2 = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
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

        await prisma.userProduct.create({
          data: {
            user_id: user2.id,
            product_id: product.id,
            price: 42.2,
          },
        })

        const result = await execution(user.id, product.id)

        expect(result).toBeNull()
      })
    })

    describe('when user has product', () => {
      test('returns userProduct', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
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

        const userProduct = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42.2,
            favorited: true,
          },
        })

        const result = await execution(user.id, product.id)

        expect(result).toEqual({
          id: product.id,
          user_product_id: userProduct.id,
          price: 42.2,
          created_at: userProduct.created_at,
          favorited: true,
          title: 'Product 1',
          shop: 'shop',
          url: 'https://domain1.tld',
        })
      })
    })
  })
})

describe('findForUser', () => {
  const execution = async (userId, userProductId) => {
    return await service.findForUser(userId, userProductId)
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

  describe('when userProductId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара пользователя должен быть UUID')
      }
    })
  })

  describe('when user does not exist', () => {
    test('returns null', async () => {
      const result = await execution(uuid.v4(), uuid.v4())

      expect(result).toBeNull()
    })
  })

  describe('when user exists', () => {
    describe('when user does not have product', () => {
      test('returns null', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const result = await execution(user.id, uuid.v4())

        expect(result).toBeNull()
      })
    })

    describe('when requested product related to another user', () => {
      test('returns null', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const user2 = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
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

        const user2Product = await prisma.userProduct.create({
          data: {
            user_id: user2.id,
            product_id: product.id,
            price: 42.2,
          },
        })

        const result = await execution(user.id, user2Product.id)

        expect(result).toBeNull()
      })
    })

    describe('when user has product', () => {
      test('returns userProduct', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
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

        const userProduct = await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42.2,
          },
        })

        const result = await execution(user.id, userProduct.id)

        expect(result).toEqual(userProduct)
      })
    })
  })
})

describe('findAllProductsGroups', () => {
  const execution = async (userId, userProductId) => {
    return await service.findAllProductsGroups(userId, userProductId)
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

  describe('when userProductId is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен userProductId')
      }
    })
  })

  describe('when userProductId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара пользователя должен быть UUID')
      }
    })
  })

  describe('when user does not exist', () => {
    test('returns empty array', async () => {
      const result = await execution(uuid.v4(), uuid.v4())

      expect(result).toEqual([])
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
      test('returns empty array', async () => {
        const result = await execution(user.id, uuid.v4())

        expect(result).toEqual([])
      })
    })

    describe('when requested product related to another user', () => {
      test('returns empty array', async () => {
        const user2 = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
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

        const user2Product = await prisma.userProduct.create({
          data: {
            user_id: user2.id,
            product_id: product.id,
            price: 42.2,
          },
        })

        const result = await execution(user.id, user2Product.id)

        expect(result).toEqual([])
      })
    })

    describe('when user has product', () => {
      let product
      let userProduct

      beforeEach(async () => {
        product = await prisma.product.create({
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
            price: 42.2,
          },
        })
      })

      describe('when user product is not in groups', () => {
        test('returns empty array', async () => {
          const result = await execution(user.id, userProduct.id)

          expect(result).toEqual([])
        })
      })

      describe('when user product is in group', () => {
        test('returns groups', async () => {
          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Products Group',
            },
          })

          await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: userProductsGroup.id,
              user_product_id: userProduct.id,
            },
          })

          const result = await execution(user.id, userProduct.id)

          expect(result).toEqual([
            {
              id: userProductsGroup.id,
              title: userProductsGroup.title,
            },
          ])
        })
      })
    })
  })
})
