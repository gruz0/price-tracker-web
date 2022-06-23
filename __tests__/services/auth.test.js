import prisma from '../../src/lib/prisma'
const uuid = require('uuid')
import {
  createUser,
  findUserById,
  findUserByLogin,
  findUserByLoginAndPassword,
  findUserByTelegramAccount,
  findUserByToken,
  updateUserPasswordAndToken,
  updateUserTelegramAccount,
  updateUserToken,
} from '../../src/services/auth'
import { cleanDatabase } from '../helpers'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

describe('findUserById', () => {
  describe('when user does not exist', () => {
    it('returns null', async () => {
      const user = await findUserById(uuid.v4())

      expect(user).toBeNull()
    })
  })

  describe('when user exists', () => {
    it('returns user', async () => {
      const user = await createUser('user1', 'password')

      const existedUser = await findUserById(user.id)

      expect(existedUser.id).toEqual(user.id)
      expect(existedUser.login).toEqual(user.login)
      expect(existedUser.token).toEqual(user.token)
      expect(existedUser.telegram_account).toEqual(user.telegram_account)
      expect(user.created_at).toBeInstanceOf(Date)
      expect(user.updated_at).toBeInstanceOf(Date)
      expect(existedUser.password).toBeUndefined()
    })
  })
})

describe('findUserByToken', () => {
  describe('when token is missing', () => {
    it('raises error', async () => {
      try {
        await findUserByToken()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен token')
      }
    })
  })

  describe('when token is empty', () => {
    it('raises error', async () => {
      try {
        await findUserByToken(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен token')
      }
    })
  })
  describe('when user does not exist', () => {
    it('returns null', async () => {
      const user = await findUserByToken(uuid.v4())

      expect(user).toBeNull()
    })
  })

  describe('when user exists', () => {
    it('returns user', async () => {
      const user = await createUser('user1', 'password')

      const existedUser = await findUserByToken(` ${user.token.toUpperCase()} `)

      expect(existedUser.id).toEqual(user.id)
      expect(existedUser.login).toEqual(user.login)
      expect(existedUser.token).toEqual(user.token.toLowerCase())
      expect(existedUser.telegram_account).toEqual(user.telegram_account)
      expect(existedUser.created_at).toEqual(user.created_at)
      expect(existedUser.updated_at).toEqual(user.updated_at)
      expect(existedUser.password).toBeUndefined()
    })
  })
})

describe('findUserByLogin', () => {
  describe('when login is missing', () => {
    it('raises error', async () => {
      try {
        await findUserByLogin()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен login')
      }
    })
  })

  describe('when login is empty', () => {
    it('raises error', async () => {
      try {
        await findUserByLogin(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен login')
      }
    })
  })

  describe('when user does not exist', () => {
    it('returns null', async () => {
      const user = await findUserByLogin(uuid.v4())

      expect(user).toBeNull()
    })
  })

  describe('when user exists', () => {
    it('returns user', async () => {
      const user = await createUser('user1', 'password')

      const existedUser = await findUserByLogin(' USER1 ')

      expect(existedUser.id).toEqual(user.id)
      expect(existedUser.login).toEqual('user1')
      expect(existedUser.token).toEqual(user.token)
      expect(existedUser.telegram_account).toEqual(user.telegram_account)
      expect(existedUser.created_at).toEqual(user.created_at)
      expect(existedUser.updated_at).toEqual(user.updated_at)
      expect(existedUser.password).toBeUndefined()
    })
  })
})

describe('findUserByLoginAndPassword', () => {
  describe('when login is missing', () => {
    it('raises error', async () => {
      try {
        await findUserByLoginAndPassword()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен login')
      }
    })
  })

  describe('when login is empty', () => {
    it('raises error', async () => {
      try {
        await findUserByLoginAndPassword(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен login')
      }
    })
  })

  describe('when user does not exist', () => {
    it('returns null', async () => {
      const user = await findUserByLoginAndPassword('zxc')

      expect(user).toBeNull()
    })
  })

  describe('when password is missing', () => {
    it('raises error', async () => {
      await createUser('user1', 'password')

      try {
        await findUserByLoginAndPassword('user1')
      } catch (e) {
        expect(e.message).toMatch('Пароль пользователя пустой')
      }
    })
  })

  describe('when user exists', () => {
    describe('when password is not valid', () => {
      it('returns null', async () => {
        await createUser('user1', 'password')

        const user = await findUserByLoginAndPassword('user1', 'invalid')

        expect(user).toBeNull()
      })
    })

    describe('when password is valid', () => {
      it('returns user', async () => {
        const user = await createUser('user1', 'password')

        const existedUser = await findUserByLoginAndPassword(
          ' USER1 ',
          'password'
        )

        expect(existedUser.id).toEqual(user.id)
        expect(existedUser.login).toEqual(user.login)
        expect(existedUser.token).toEqual(user.token)
        expect(existedUser.telegram_account).toEqual(user.telegram_account)
        expect(existedUser.created_at).toEqual(user.created_at)
        expect(existedUser.updated_at).toEqual(user.updated_at)
        expect(existedUser.password).toBeUndefined()
      })
    })
  })
})

describe('findUserByTelegramAccount', () => {
  describe('when telegramAccount is missing', () => {
    it('raises error', async () => {
      try {
        await findUserByTelegramAccount()
      } catch (e) {
        expect(e.message).toMatch('Не заполнен telegramAccount')
      }
    })
  })

  describe('when telegramAccount is empty', () => {
    it('raises error', async () => {
      try {
        await findUserByTelegramAccount(' ')
      } catch (e) {
        expect(e.message).toMatch('Не заполнен telegramAccount')
      }
    })
  })

  describe('when user does not exist', () => {
    it('returns null', async () => {
      const user = await findUserByTelegramAccount('zxc')

      expect(user).toBeNull()
    })
  })

  describe('when user exists', () => {
    it('returns user', async () => {
      const user = await createUser('user1', 'password', 'myTelegram')

      const existedUser = await findUserByTelegramAccount(' MYTelegram ')

      expect(existedUser.id).toEqual(user.id)
      expect(existedUser.login).toEqual(user.login)
      expect(existedUser.token).toEqual(user.token)
      expect(existedUser.telegram_account).toEqual(user.telegram_account)
      expect(existedUser.created_at).toEqual(user.created_at)
      expect(existedUser.updated_at).toEqual(user.updated_at)
      expect(existedUser.password).toBeUndefined()
    })
  })
})

describe('createUser', () => {
  describe('when login is missing', () => {
    it('raises error', async () => {
      try {
        await createUser()
      } catch (e) {
        expect(e.message).toMatch('Логин пустой')
      }
    })
  })

  describe('when login is empty', () => {
    it('raises error', async () => {
      try {
        await createUser(' ')
      } catch (e) {
        expect(e.message).toMatch('Логин пустой')
      }
    })
  })

  describe('when password is missing', () => {
    it('raises error', async () => {
      try {
        await createUser('user1')
      } catch (e) {
        expect(e.message).toMatch('Пароль пустой')
      }
    })
  })

  describe('when password is empty', () => {
    it('raises error', async () => {
      try {
        await createUser('user1', ' ')
      } catch (e) {
        expect(e.message).toMatch('Пароль пустой')
      }
    })
  })

  describe('when user exists', () => {
    it('raises error', async () => {
      await createUser('user1', 'password')

      try {
        await createUser(' USER1 ', 'password')
      } catch (e) {
        expect(e.message).toMatch('Пользователь с логином user1 уже существует')
      }
    })
  })

  describe('when user does not exist', () => {
    describe('when login and password only provided', () => {
      it('returns user', async () => {
        const user = await createUser(' USER1 ', 'password')

        expect(user).not.toBeNull()
        expect(user.id).toBeDefined()
        expect(user.login).toEqual('user1')
        expect(user.token).toEqual(user.token)
        expect(user.telegram_account).toBeNull()
        expect(user.created_at).toBeInstanceOf(Date)
        expect(user.updated_at).toBeInstanceOf(Date)
        expect(user.password).toBeUndefined()
      })

      it('encrypts password', async () => {
        const user = await createUser(' USER1 ', 'password')

        const existedUser = await findUserByLoginAndPassword(
          ' USER1 ',
          'password'
        )

        expect(user.id).toEqual(existedUser.id)
      })
    })

    describe('when login, password and telegram_account provided', () => {
      it('returns user', async () => {
        const user = await createUser(
          ' USER1 ',
          'password',
          ' myTelegramAccount '
        )

        expect(user).not.toBeNull()
        expect(user.id).toBeDefined()
        expect(user.login).toEqual('user1')
        expect(user.token).toBeDefined()
        expect(user.telegram_account).toEqual('mytelegramaccount')
        expect(user.created_at).toBeInstanceOf(Date)
        expect(user.updated_at).toBeInstanceOf(Date)
        expect(user.password).toBeUndefined()
      })
    })
  })
})

describe('updateUserPasswordAndToken', () => {
  describe('when ID is missing', () => {
    it('raises error', async () => {
      try {
        await updateUserPasswordAndToken()
      } catch (e) {
        expect(e.message).toMatch('ID пользователя пустой')
      }
    })
  })

  describe('when ID is empty', () => {
    it('raises error', async () => {
      try {
        await updateUserPasswordAndToken(' ')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя пустой')
      }
    })
  })

  describe('when user does not exist', () => {
    it('raises error', async () => {
      try {
        await updateUserPasswordAndToken(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Пользователь по ID не найден')
      }
    })
  })

  describe('when user exists', () => {
    let user

    beforeEach(async () => {
      user = await createUser('user1', 'password')
    })

    describe('when password is missing', () => {
      it('raises error', async () => {
        try {
          await updateUserPasswordAndToken(user.id)
        } catch (e) {
          expect(e.message).toMatch('Новый пароль пустой')
        }
      })
    })

    describe('when password is empty', () => {
      it('raises error', async () => {
        try {
          await updateUserPasswordAndToken(user.id, ' ')
        } catch (e) {
          expect(e.message).toMatch('Новый пароль пустой')
        }
      })
    })

    it('updates password and token', async () => {
      await updateUserPasswordAndToken(user.id, 'new password')

      expect(
        await findUserByLoginAndPassword(user.login, 'password')
      ).toBeNull()

      expect(await findUserByToken(user.token)).toBeNull()

      expect(
        await findUserByLoginAndPassword(user.login, 'new password')
      ).not.toBeNull()

      const updatedUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      })

      expect(user.password).not.toEqual(updatedUser.password)
      expect(user.token).not.toEqual(updatedUser.token)

      expect(await findUserByToken(updatedUser.token)).not.toBeNull()
    })
  })
})

describe('updateUserToken', () => {
  describe('when ID is missing', () => {
    it('raises error', async () => {
      try {
        await updateUserToken()
      } catch (e) {
        expect(e.message).toMatch('ID пользователя пустой')
      }
    })
  })

  describe('when ID is empty', () => {
    it('raises error', async () => {
      try {
        await updateUserToken(' ')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя пустой')
      }
    })
  })

  describe('when user does not exist', () => {
    it('raises error', async () => {
      try {
        await updateUserToken(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Пользователь по ID не найден')
      }
    })
  })

  describe('when user exists', () => {
    it('updates token', async () => {
      const user = await createUser('user1', 'password')

      await updateUserToken(user.id)

      expect(await findUserByToken(user.token)).toBeNull()

      const updatedUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      })

      expect(user.token).not.toEqual(updatedUser.token)

      expect(await findUserByToken(updatedUser.token)).not.toBeNull()
    })
  })
})

describe('updateUserTelegramAccount', () => {
  describe('when ID is missing', () => {
    it('raises error', async () => {
      try {
        await updateUserTelegramAccount()
      } catch (e) {
        expect(e.message).toMatch('ID пользователя пустой')
      }
    })
  })

  describe('when ID is empty', () => {
    it('raises error', async () => {
      try {
        await updateUserTelegramAccount(' ')
      } catch (e) {
        expect(e.message).toMatch('ID пользователя пустой')
      }
    })
  })

  describe('when user does not exist', () => {
    it('raises error', async () => {
      try {
        await updateUserTelegramAccount(uuid.v4())
      } catch (e) {
        expect(e.message).toMatch('Пользователь по ID не найден')
      }
    })
  })

  describe('when user exists', () => {
    describe('when telegram_account is not set', () => {
      it('sets telegram_account to null', async () => {
        const user = await createUser('user1', 'password', 'myTelegramAccount')

        await updateUserTelegramAccount(user.id, '')

        expect(
          await findUserByTelegramAccount(user.telegram_account)
        ).toBeNull()

        const updatedUser = await prisma.user.findUnique({
          where: {
            id: user.id,
          },
        })

        expect(updatedUser.telegram_account).toBeNull()
      })
    })

    it('updates telegram_account', async () => {
      const user = await createUser('user1', 'password', 'myTelegramAccount')

      await updateUserTelegramAccount(user.id, 'newTelegramAccount')

      expect(await findUserByTelegramAccount(user.telegram_account)).toBeNull()

      const updatedUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      })

      expect(updatedUser.telegram_account).toEqual('newtelegramaccount')

      expect(
        await findUserByTelegramAccount(updatedUser.telegram_account)
      ).not.toBeNull()
    })
  })
})
