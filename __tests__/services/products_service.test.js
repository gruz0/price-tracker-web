import prisma from '../../src/lib/prisma'
import { ProductsService as service } from '../../src/services/products_service'
import { cleanDatabase } from '../helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('isOwnedByUsers', () => {
  const execution = async (productId) => {
    return await service.isOwnedByUsers(productId)
  }

  describe('when productId is missing', () => {
    it('raises error', async () => {
      try {
        await execution()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution('qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара должен быть UUID')
      }
    })
  })

  describe('when product exists', () => {
    let product

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          title: 'Product 1',
          url: 'https://domain1.tld',
          url_hash: 'hash1',
          shop: 'shop',
        },
      })
    })

    describe('when not owned by users', () => {
      it('returns false', async () => {
        const isOwnedByUsers = await execution(product.id)

        expect(isOwnedByUsers).toEqual(false)
      })
    })

    describe('when owned by user', () => {
      it('returns false', async () => {
        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        await prisma.userProduct.create({
          data: {
            user_id: user.id,
            product_id: product.id,
            price: 42.2,
          },
        })

        const isOwnedByUsers = await execution(product.id)

        expect(isOwnedByUsers).toEqual(true)
      })
    })
  })
})

describe('moveToHold', () => {
  const execution = async (productId) => {
    return await service.moveToHold(productId)
  }

  describe('when productId is missing', () => {
    it('raises error', async () => {
      try {
        await execution()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution('qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара должен быть UUID')
      }
    })
  })

  describe('when product exists', () => {
    let product

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          title: 'Product 1',
          url: 'https://domain1.tld',
          url_hash: 'hash1',
          shop: 'shop',
          status: 'active',
        },
      })
    })

    it('changes status to hold', async () => {
      await execution(product.id)

      const existedProduct = await prisma.product.findUnique({
        where: {
          id: product.id,
        },
      })

      expect(existedProduct.status).toEqual('hold')
    })
  })
})

describe('moveToActive', () => {
  const execution = async (productId) => {
    return await service.moveToActive(productId)
  }

  describe('when productId is missing', () => {
    it('raises error', async () => {
      try {
        await execution()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is empty', () => {
    it('raises error', async () => {
      try {
        await execution(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен productId')
      }
    })
  })

  describe('when productId is not a valid UUID', () => {
    it('raises error', async () => {
      try {
        await execution('qwe')
      } catch (e) {
        expect(e.message).toMatch('ID товара должен быть UUID')
      }
    })
  })

  describe('when product exists', () => {
    let product

    beforeEach(async () => {
      product = await prisma.product.create({
        data: {
          title: 'Product 1',
          url: 'https://domain1.tld',
          url_hash: 'hash1',
          shop: 'shop',
          status: 'hold',
        },
      })
    })

    it('changes status to active', async () => {
      await execution(product.id)

      const existedProduct = await prisma.product.findUnique({
        where: {
          id: product.id,
        },
      })

      expect(existedProduct.status).toEqual('active')
    })
  })
})
