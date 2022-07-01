import prisma from '../../../../src/lib/prisma'

import { createMocks } from 'node-mocks-http'
import handler from '../../../../src/pages/api/v1/sign_in'
import {
  METHOD_NOT_ALLOWED,
  MISSING_LOGIN,
  MISSING_PASSWORD,
  INVALID_CREDENTIALS,
} from '../../../../src/lib/messages'
import { cleanDatabase, mockPOSTRequest, parseJSON } from '../../../helpers'
import { encryptPassword } from '../../../../src/lib/security'
const uuid = require('uuid')

const ENDPOINT = '/api/v1/sign_in'

beforeEach(async () => {
  await cleanDatabase(prisma)
})

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
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`POST ${ENDPOINT}`, () => {
  describe('when missing login', () => {
    test('returns error', async () => {
      const { req, res } = mockPOSTRequest({})

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_LOGIN)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when login is empty', () => {
    test('returns error', async () => {
      const { req, res } = mockPOSTRequest({ login: ' ' })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_LOGIN)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when missing password', () => {
    test('returns error', async () => {
      const { req, res } = mockPOSTRequest({ login: 'user1' })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_PASSWORD)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when password is empty', () => {
    test('returns error', async () => {
      const { req, res } = mockPOSTRequest({ login: 'user1', password: ' ' })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_PASSWORD)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when user does not exist', () => {
    test('returns error', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'user1',
        password: 'password',
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(INVALID_CREDENTIALS)
      expect(res._getStatusCode()).toBe(403)
    })
  })

  describe('when user exists', () => {
    let user

    beforeEach(async () => {
      const userId = uuid.v4()

      user = await prisma.user.create({
        data: {
          id: userId,
          login: 'user1',
          password: encryptPassword(userId, 'user1', 'password'),
          telegram_account: '12345',
          last_sign_in_at: new Date('2022-06-26 12:00:00'),
        },
      })
    })

    test('updates user token', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'User1',
        password: 'password',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(updatedUser.token).not.toEqual('token')
    })

    test('updates last_sign_in_at', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'User1',
        password: 'password',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(updatedUser.last_sign_in_at).not.toEqual(user.last_sign_in_at)
      expect(+updatedUser.last_sign_in_at).toBeGreaterThan(
        +user.last_sign_in_at
      )
      expect(+updatedUser.updated_at).toBeGreaterThan(+user.updated_at)
    })

    test('returns response', async () => {
      const { req, res } = mockPOSTRequest({
        login: 'User1',
        password: 'password',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const response = parseJSON(res)

      expect(response.token).not.toEqual(user.token)
      expect(response.user.id).toEqual(user.id)
      expect(response.user.login).toEqual('user1')
      expect(response.user.api_key).toEqual(user.api_key)
      expect(response.user.telegram_account).toEqual('12345')
    })
  })
})
