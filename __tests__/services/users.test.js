import prisma from '../../src/lib/prisma'
import { getUserProduct } from '../../src/services/users'
import { cleanDatabase } from '../helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('getUserProduct', () => {
  describe('when no arguments passed', () => {
    test('returns null', async () => {
      const result = await getUserProduct(undefined, undefined)

      expect(result).toBeNull()
    })
  })

  describe('when user does not have product', () => {
    test('returns null', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const product = await prisma.product.create({
        data: {
          title: 'Product',
          url: 'https://domain.tld',
          url_hash: 'hash',
          shop: 'shop',
        },
      })

      const result = await getUserProduct(user.id, product.id)

      expect(result).toBeNull()
    })
  })

  describe('when user has product', () => {
    test('returns product', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const product = await prisma.product.create({
        data: {
          title: 'Product',
          url: 'https://domain.tld',
          url_hash: 'hash',
          shop: 'shop',
        },
      })

      const userProduct = await prisma.userProduct.create({
        data: {
          user_id: user.id,
          product_id: product.id,
          price: 42,
          favorited: true,
        },
      })

      const result = await getUserProduct(user.id, product.id)

      expect(result).toEqual({
        id: product.id,
        title: 'Product',
        shop: 'shop',
        favorited: true,
        price: 42,
        created_at: userProduct.created_at,
      })
    })
  })
})
