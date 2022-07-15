import prisma from '../../src/lib/prisma'
import { UserProductsGroupsService as service } from '../../src/services/user_products_groups_service'
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
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Пользователь не существует')
      }
    })
  })

  describe('when user exists', () => {
    describe('when user does not have products groups', () => {
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

    describe('when user has products groups', () => {
      describe('without items', () => {
        test('returns products groups', async () => {
          const user = await prisma.user.create({
            data: {
              login: 'user1',
              password: 'password',
            },
          })

          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title',
              image: 'image.png',
            },
          })

          const result = await execution(user.id)

          expect(result).toEqual([
            {
              id: userProductsGroup.id,
              title: userProductsGroup.title,
              image: userProductsGroup.image,
              created_at: userProductsGroup.created_at.toISOString(),
              products_count: 0,
            },
          ])
        })
      })

      describe('with items', () => {
        test('returns products groups ordered by created_at descending', async () => {
          const user = await prisma.user.create({
            data: {
              login: 'user1',
              password: 'password',
            },
          })

          const product1 = await prisma.product.create({
            data: {
              title: 'Product 1',
              url: 'https://domain1.tld',
              url_hash: 'hash1',
              shop: 'shop',
            },
          })

          const product2 = await prisma.product.create({
            data: {
              title: 'Product 2',
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

          const userProductsGroup1 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title 1',
              image: 'image.png',
            },
          })

          await prisma.userProductsGroupItem.createMany({
            data: [
              {
                user_id: user.id,
                user_products_group_id: userProductsGroup1.id,
                user_product_id: userProduct1.id,
              },
              {
                user_id: user.id,
                user_products_group_id: userProductsGroup1.id,
                user_product_id: userProduct2.id,
              },
            ],
          })

          const userProductsGroup2 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title 2',
            },
          })

          const result = await execution(user.id)

          expect(result).toEqual([
            {
              id: userProductsGroup2.id,
              title: userProductsGroup2.title,
              image: userProductsGroup2.image,
              created_at: userProductsGroup2.created_at.toISOString(),
              products_count: 0,
            },
            {
              id: userProductsGroup1.id,
              title: userProductsGroup1.title,
              image: userProductsGroup1.image,
              created_at: userProductsGroup1.created_at.toISOString(),
              products_count: 2,
            },
          ])
        })
      })
    })
  })
})

describe('find', () => {
  const execution = async (userId, productsGroupId) => {
    return await service.find(userId, productsGroupId)
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
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Пользователь не существует')
      }
    })
  })

  describe('when user exists', () => {
    describe('when products group does not exist', () => {
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

    describe('when requested products group related to another user', () => {
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

        const user2ProductsGroup = await prisma.userProductsGroup.create({
          data: {
            user_id: user2.id,
            title: 'Group Title',
          },
        })

        const result = await execution(user.id, user2ProductsGroup.id)

        expect(result).toBeNull()
      })
    })

    describe('when user has products group', () => {
      describe('without items', () => {
        test('returns products group with products_count equals to zero', async () => {
          const user = await prisma.user.create({
            data: {
              login: 'user1',
              password: 'password',
            },
          })

          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title',
              image: 'image.png',
            },
          })

          const result = await execution(user.id, userProductsGroup.id)

          expect(result).toEqual({
            id: userProductsGroup.id,
            title: userProductsGroup.title,
            image: userProductsGroup.image,
            created_at: userProductsGroup.created_at.toISOString(),
            products_count: 0,
          })
        })
      })

      describe('with items', () => {
        test('returns products group with positive products_count', async () => {
          const user = await prisma.user.create({
            data: {
              login: 'user1',
              password: 'password',
            },
          })

          const product1 = await prisma.product.create({
            data: {
              title: 'Product 1',
              url: 'https://domain1.tld',
              url_hash: 'hash1',
              shop: 'shop',
            },
          })

          const product2 = await prisma.product.create({
            data: {
              title: 'Product 2',
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

          const userProductsGroup = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title 1',
              image: 'image.png',
            },
          })

          await prisma.userProductsGroupItem.createMany({
            data: [
              {
                user_id: user.id,
                user_products_group_id: userProductsGroup.id,
                user_product_id: userProduct1.id,
              },
              {
                user_id: user.id,
                user_products_group_id: userProductsGroup.id,
                user_product_id: userProduct2.id,
              },
            ],
          })

          const result = await execution(user.id, userProductsGroup.id)

          expect(result).toEqual({
            id: userProductsGroup.id,
            title: userProductsGroup.title,
            image: userProductsGroup.image,
            created_at: userProductsGroup.created_at.toISOString(),
            products_count: 2,
          })
        })
      })
    })
  })
})

describe('create', () => {
  const execution = async (userId, title) => {
    return await service.create(userId, title)
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
        await execution('zxc')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя должен быть UUID')
      }
    })
  })

  describe('when title is missing', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Не заполнен title')
      }
    })
  })

  describe('when title is empty', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), ' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен title')
      }
    })
  })

  describe('when user does not exist', () => {
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), 'title')
      } catch (e) {
        expect(e.message).toMatch('Пользователь не существует')
      }
    })
  })

  describe('when user exists', () => {
    test('creates a new products group', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const result = await execution(user.id, ' Food for pets ')

      expect(result.id).not.toEqual('')
      expect(result.title).toEqual('Food for pets')
      expect(result.user_id).toEqual(user.id)
    })
  })
})

describe('delete', () => {
  const execution = async (userId, productsGroupId) => {
    return await service.delete(userId, productsGroupId)
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
    it('raises error', async () => {
      try {
        await execution(uuid.v4(), uuid.v4())
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

    describe('when products group does not exist', () => {
      it('raises error', async () => {
        try {
          await execution(user.id, uuid.v4())
        } catch (e) {
          expect(e.message).toMatch('Группа товаров не существует')
        }
      })
    })

    describe('when requested products group related to another user', () => {
      test('raises error', async () => {
        await prisma.userProductsGroup.create({
          data: {
            user_id: user.id,
            title: 'Group Title',
          },
        })

        const user2 = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
          },
        })

        const user2ProductsGroup = await prisma.userProductsGroup.create({
          data: {
            user_id: user2.id,
            title: 'Another Group Title',
          },
        })

        try {
          await execution(user.id, user2ProductsGroup.id)
        } catch (e) {
          expect(e.message).toMatch('Группа товаров не существует')
        }
      })
    })

    describe('when products group exists', () => {
      let userProductsGroup

      beforeEach(async () => {
        userProductsGroup = await prisma.userProductsGroup.create({
          data: {
            user_id: user.id,
            title: 'Group Title',
          },
        })
      })

      describe('without items', () => {
        test('removes products group', async () => {
          await execution(user.id, userProductsGroup.id)

          const productsGroups = await prisma.userProductsGroup.findMany()
          expect(productsGroups).toEqual([])
        })
      })

      describe('with items', () => {
        test('removes only items from specific products group', async () => {
          const product1 = await prisma.product.create({
            data: {
              title: 'Product 1',
              url: 'https://domain1.tld',
              url_hash: 'hash1',
              shop: 'shop',
            },
          })

          const product2 = await prisma.product.create({
            data: {
              title: 'Product 2',
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

          const userProductsGroup2 = await prisma.userProductsGroup.create({
            data: {
              user_id: user.id,
              title: 'Group Title 2',
            },
          })

          await prisma.userProductsGroupItem.create({
            data: {
              user_id: user.id,
              user_products_group_id: userProductsGroup.id,
              user_product_id: userProduct1.id,
            },
          })

          const userProductsGroup2Item =
            await prisma.userProductsGroupItem.create({
              data: {
                user_id: user.id,
                user_products_group_id: userProductsGroup2.id,
                user_product_id: userProduct2.id,
              },
            })

          await execution(user.id, userProductsGroup.id)

          const groupItems = await prisma.userProductsGroupItem.findMany()
          expect(groupItems).toEqual([userProductsGroup2Item])
        })
      })
    })
  })
})
