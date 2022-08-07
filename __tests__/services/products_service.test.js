import prisma from '../../src/lib/prisma'
import { ProductsService as service } from '../../src/services/products_service'
import { cleanDatabase } from '../helpers'
const uuid = require('uuid')

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

describe('getProductWithRecentHistory', () => {
  const execution = async (productId) => {
    return await service.getProductWithRecentHistory(productId)
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

  describe('when product does not exist', () => {
    it('returns null', async () => {
      const result = await execution(uuid.v4())

      expect(result).toBeNull()
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

    describe('without history', () => {
      describe('without users', () => {
        it('returns product', async () => {
          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: false,
            was_in_stock: false,
            has_history: false,
            has_users: false,
          })
        })
      })

      describe('with users', () => {
        it('returns product', async () => {
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
              price: 0,
            },
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: false,
            was_in_stock: false,
            has_history: false,
            has_users: true,
          })
        })
      })
    })

    describe('with history', () => {
      let crawler

      beforeEach(async () => {
        crawler = await prisma.crawler.create({
          data: {
            location: 'Somewhere',
          },
        })
      })

      describe('when was not in stock', () => {
        it('returns product', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'not_found',
              },
            ],
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: false,
            was_in_stock: false,
            has_history: true,
            has_users: false,
          })
        })
      })

      describe('when was in stock', () => {
        it('returns product', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'ok',
                in_stock: true,
                created_at: new Date('2022-01-01'),
              },
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'not_found',
              },
            ],
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: false,
            was_in_stock: true,
            has_history: true,
            has_users: false,
          })
        })
      })

      describe('when recently is in stock', () => {
        it('returns product', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'ok',
                in_stock: false,
                created_at: new Date('2022-01-01'),
              },
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'ok',
                in_stock: true,
              },
            ],
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: true,
            was_in_stock: true,
            has_history: true,
            has_users: false,
          })
        })
      })

      describe('when recently is out of stock', () => {
        it('returns product', async () => {
          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'ok',
                in_stock: true,
                created_at: new Date('2022-01-01'),
              },
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'ok',
                in_stock: false,
              },
            ],
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: false,
            was_in_stock: true,
            has_history: true,
            has_users: false,
          })
        })
      })

      describe('with users and with history', () => {
        it('returns product', async () => {
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
              price: 0,
            },
          })

          await prisma.productHistory.createMany({
            data: [
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'ok',
                in_stock: true,
                created_at: new Date('2022-01-01'),
              },
              {
                product_id: product.id,
                crawler_id: crawler.id,
                status: 'not_found',
              },
            ],
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            id: product.id,
            title: product.title,
            url: product.url,
            recent_in_stock: false,
            was_in_stock: true,
            has_history: true,
            has_users: true,
          })
        })
      })
    })
  })
})

describe('getRecentHistory', () => {
  const execution = async (productId) => {
    return await service.getRecentHistory(productId)
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

  describe('when product does not exist', () => {
    it('returns null', async () => {
      const result = await execution(uuid.v4())

      expect(result).toBeNull()
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

    describe('without history', () => {
      it('returns null', async () => {
        const result = await execution(product.id)

        expect(result).toBeNull()
      })
    })

    describe('with history', () => {
      let crawler

      beforeEach(async () => {
        crawler = await prisma.crawler.create({
          data: {
            location: 'Somewhere',
          },
        })

        await prisma.productHistory.create({
          data: {
            product_id: product.id,
            crawler_id: crawler.id,
            status: 'ok',
            original_price: 12,
            discount_price: 5,
            created_at: new Date('2022-01-01'),
          },
        })
      })

      describe('status === skip', () => {
        it('returns result', async () => {
          await prisma.productHistory.create({
            data: {
              product_id: product.id,
              crawler_id: crawler.id,
              status: 'skip',
              original_price: 12,
              discount_price: 5,
            },
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            status: 'skip',
            in_stock: false,
            price: 0,
          })
        })
      })

      describe('status === age_restriction', () => {
        it('returns result', async () => {
          await prisma.productHistory.create({
            data: {
              product_id: product.id,
              crawler_id: crawler.id,
              status: 'age_restriction',
              original_price: 12,
              discount_price: 5,
            },
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            status: 'age_restriction',
            in_stock: false,
            price: 0,
          })
        })
      })

      describe('status === required_to_change_location', () => {
        it('returns result', async () => {
          await prisma.productHistory.create({
            data: {
              product_id: product.id,
              crawler_id: crawler.id,
              original_price: 12,
              discount_price: 5,
              status: 'required_to_change_location',
            },
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            status: 'required_to_change_location',
            in_stock: false,
            price: 0,
          })
        })
      })

      describe('status === not_found', () => {
        it('returns result', async () => {
          await prisma.productHistory.create({
            data: {
              product_id: product.id,
              crawler_id: crawler.id,
              original_price: 12,
              discount_price: 5,
              status: 'not_found',
            },
          })

          const result = await execution(product.id)

          expect(result).toEqual({
            status: 'not_found',
            in_stock: false,
            price: 0,
          })
        })
      })

      describe('status === ok', () => {
        describe('when is out of stock', () => {
          describe('with discount price only', () => {
            it('returns result', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                  discount_price: 35,
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: false,
                price: 35,
              })
            })
          })

          describe('with original price only', () => {
            it('returns result', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                  original_price: 42,
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: false,
                price: 42,
              })
            })
          })

          describe('with both prices', () => {
            it('returns result with lowest price', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                  original_price: 42,
                  discount_price: 35,
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: false,
                price: 35,
              })
            })
          })

          describe('without prices', () => {
            it('returns result with zero price', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: false,
                price: 0,
              })
            })
          })
        })

        describe('when is in stock', () => {
          describe('with discount price only', () => {
            it('returns result', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                  in_stock: true,
                  discount_price: 35,
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: true,
                price: 35,
              })
            })
          })

          describe('with original price only', () => {
            it('returns result', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                  in_stock: true,
                  original_price: 42,
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: true,
                price: 42,
              })
            })
          })

          describe('with both prices', () => {
            it('returns result with lowest price', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  status: 'ok',
                  in_stock: true,
                  original_price: 42,
                  discount_price: 35,
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: true,
                price: 35,
              })
            })
          })

          describe('without prices', () => {
            it('returns result with zero price', async () => {
              await prisma.productHistory.create({
                data: {
                  product_id: product.id,
                  crawler_id: crawler.id,
                  in_stock: true,
                  status: 'ok',
                },
              })

              const result = await execution(product.id)

              expect(result).toEqual({
                status: 'ok',
                in_stock: true,
                price: 0,
              })
            })
          })
        })
      })
    })
  })
})
