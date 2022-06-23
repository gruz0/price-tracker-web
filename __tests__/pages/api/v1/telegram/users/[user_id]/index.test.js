import prisma from '../../../../../../../src/lib/prisma'
const uuid = require('uuid')

import {
  cleanDatabase,
  mockAuthorizedPUTRequest,
} from '../../../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../../../src/pages/api/v1/telegram/users/[user_id]/index'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  BOT_DOES_NOT_EXIST,
  MISSING_USER_ID,
  INVALID_USER_UUID,
  USER_DOES_NOT_EXIST,
  MISSING_TELEGRAM_ACCOUNT,
  USER_WITH_TELEGRAM_ACCOUNT_ALREADY_EXISTS,
} from '../../../../../../../src/lib/messages'
import { parseJSON } from '../../../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../../../matchers'

const ENDPOINT = '/api/v1/telegram/users/[user_id]'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

const whenNotAuthorized = (method) => {
  describe('when not authorized', () => {
    whenMissingAuthorizationHeader(
      method,
      handler,
      MISSING_AUTHORIZATION_HEADER
    )

    whenMissingBearer(method, handler, MISSING_BEARER_KEY)
    whenMissingToken(method, handler, MISSING_TOKEN)
    whenTokenIsNotUUID(method, handler, 400, INVALID_TOKEN_UUID)
    whenTokenNotFound(method, handler, 404, BOT_DOES_NOT_EXIST)
  })
}

const ensureMethodNotAllowed = (method, url) => {
  describe(`${method} ${url}`, () => {
    test('returns error', async () => {
      const { req, res } = createMocks({
        method: method,
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(METHOD_NOT_ALLOWED)
      expect(res._getStatusCode()).toBe(405)
    })
  })
}

ensureMethodNotAllowed('GET', ENDPOINT)
ensureMethodNotAllowed('POST', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`PUT ${ENDPOINT}`, () => {
  whenNotAuthorized('PUT')

  let bot

  beforeEach(async () => {
    bot = await prisma.bot.create({
      data: {
        location: 'somewhere',
      },
    })
  })

  describe('when missing user_id', () => {
    test('returns error', async () => {
      const { req, res } = mockAuthorizedPUTRequest(bot.token)

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_USER_ID)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when user_id is not a valid UUID', () => {
    test('returns error', async () => {
      const { req, res } = mockAuthorizedPUTRequest(bot.token, {
        user_id: 'qwe',
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(INVALID_USER_UUID)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when user does not exist', () => {
    test('returns error', async () => {
      const { req, res } = mockAuthorizedPUTRequest(bot.token, {
        user_id: uuid.v4(),
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(USER_DOES_NOT_EXIST)
      expect(res._getStatusCode()).toBe(404)
    })
  })

  describe('when missing telegram_account', () => {
    test('returns error', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(bot.token, {
        user_id: user.id,
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_TELEGRAM_ACCOUNT)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when telegram account used by another user', () => {
    test('returns error', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      await prisma.user.create({
        data: {
          login: 'user2',
          password: 'password',
          telegram_account: '1',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(
        bot.token,
        {
          user_id: user.id,
        },
        {
          telegram_account: '1',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(USER_WITH_TELEGRAM_ACCOUNT_ALREADY_EXISTS)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when user already has this telegram account', () => {
    test('does nothing', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: '1',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(
        bot.token,
        {
          user_id: user.id,
        },
        {
          telegram_account: '1',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual({})
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('when user has another telegram account', () => {
    test('updates telegram account', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: '2',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(
        bot.token,
        {
          user_id: user.id,
        },
        {
          telegram_account: '1',
        }
      )

      await handler(req, res)

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser.telegram_account).toEqual('1')
    })

    test('returns response', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: '2',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(
        bot.token,
        {
          user_id: user.id,
        },
        {
          telegram_account: '1',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual({
        id: user.id,
        login: user.login,
        telegram_account: '1',
      })
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('when user does not have telegram account', () => {
    test('sets telegram account', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(
        bot.token,
        {
          user_id: user.id,
        },
        {
          telegram_account: '1',
        }
      )

      await handler(req, res)

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser.telegram_account).toEqual('1')
    })

    test('returns response', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const { req, res } = mockAuthorizedPUTRequest(
        bot.token,
        {
          user_id: user.id,
        },
        {
          telegram_account: '1',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual({
        id: user.id,
        login: user.login,
        telegram_account: '1',
      })
      expect(res._getStatusCode()).toBe(200)
    })
  })
})
