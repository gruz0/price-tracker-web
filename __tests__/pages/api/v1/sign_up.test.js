import prisma from '../../../../src/lib/prisma'

import { createMocks } from 'node-mocks-http'
import handler from '../../../../src/pages/api/v1/sign_up'
import {
  METHOD_NOT_ALLOWED,
  MISSING_LOGIN,
  MISSING_PASSWORD,
  LOGIN_IS_INVALID,
  PASSWORD_IS_TOO_SHORT,
  USER_ALREADY_EXISTS,
} from '../../../../src/lib/messages'
import { cleanDatabase, mockPOSTRequest, parseJSON } from '../../../helpers'

const ENDPOINT = '/api/v1/sign_up'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

const ensureMethodNotAllowed = (method, url) => {
  describe(`${method} ${url}`, () => {
    it('returns error', async () => {
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
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`POST ${ENDPOINT}`, () => {
  describe('when missing login', () => {
    it('returns error', async () => {
      const { req, res } = mockPOSTRequest({})

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_LOGIN)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when login is empty', () => {
    it('returns error', async () => {
      const { req, res } = mockPOSTRequest({ login: ' ' })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_LOGIN)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when missing password', () => {
    it('returns error', async () => {
      const { req, res } = mockPOSTRequest({ login: 'user1' })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_PASSWORD)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when login is not valid', () => {
    it('returns error', async () => {
      const { req, res } = mockPOSTRequest({
        login: ' aZ1-_*',
        password: 'password',
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(LOGIN_IS_INVALID)
      expect(res._getStatusCode()).toBe(422)
    })
  })

  describe('when password is too short', () => {
    it('returns error', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'user',
        password: 'passwd1',
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(PASSWORD_IS_TOO_SHORT)
      expect(res._getStatusCode()).toBe(422)
    })
  })

  describe('when user with login already exists', () => {
    it('returns error', async () => {
      await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })

      const { req, res } = mockPOSTRequest({
        login: 'user1',
        password: 'password',
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(USER_ALREADY_EXISTS)
      expect(res._getStatusCode()).toBe(409)
    })
  })

  describe('when all is good', () => {
    it('creates a new user', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'user1',
        password: 'password',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)

      const users = await prisma.user.findMany()

      const response = parseJSON(res)

      expect(users.length).toEqual(1)

      expect(response.token).toEqual(users[0].token)
      expect(response.user.id).toEqual(users[0].id)
      expect(response.user.login).toEqual(users[0].login)
    })

    it('adds message to telegram_messages', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'user1',
        password: 'password',
      })

      await handler(req, res)
      expect(res._getStatusCode()).toBe(201)

      const user = await prisma.user.findUnique({
        where: { login: 'user1' },
      })

      const telegramMessages = await prisma.telegramMessage.findMany()

      expect(telegramMessages.length).toEqual(1)
      expect(telegramMessages[0].user_id).toEqual(user.id)
      expect(telegramMessages[0].message).toEqual(
        `***Зарегистрирован новый пользователь!***\nID: ${user.id}`
      )
    })
  })
})
