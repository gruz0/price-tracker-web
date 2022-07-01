import prisma from '../../src/lib/prisma'
import { cleanDatabase } from '../helpers'

import { buildUserResponse, calculateHash } from '../../src/lib/helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('calculateHash', () => {
  test.todo('when empty string it must raise an error')

  test('returns hash', () => {
    expect(calculateHash('https://www.ozon.ru/product/42')).toEqual(
      '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
    )
  })
})

describe('buildUserResponse', () => {
  describe('when no user provider', () => {
    it('raises error', () => {
      try {
        buildUserResponse()
      } catch (e) {
        expect(e.message).toMatch('Пустой пользователь')
      }
    })
  })

  describe('when user provided', () => {
    test('returns user', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const buildedUser = buildUserResponse(user)

      expect(buildedUser).toEqual({
        token: user.token,
        user: {
          id: user.id,
          login: user.login,
          api_key: user.api_key,
          telegram_account: user.telegram_account,
        },
      })
    })
  })
})
