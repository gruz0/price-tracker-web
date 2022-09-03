import prisma from '../../../../../src/lib/prisma'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
  mockAuthorizedPOSTRequest,
} from '../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../src/pages/api/v1/settings/change_password'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
  MISSING_CURRENT_PASSWORD,
  MISSING_NEW_PASSWORD,
  MISSING_NEW_PASSWORD_CONFIRMATION,
  PASSWORDS_DO_NOT_MATCH,
  PASSWORD_IS_TOO_SHORT,
  NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD,
  CURRENT_PASSWORD_IS_NOT_VALID,
} from '../../../../../src/lib/messages'
import { parseJSON } from '../../../../helpers'
import { encryptPassword } from '../../../../../src/lib/security'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../matchers'
const uuid = require('uuid')

const ENDPOINT = '/api/v1/settings/change_password'

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
    whenTokenNotFound(method, handler, 403, FORBIDDEN)
  })
}

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
  whenNotAuthorized('POST')

  let user

  beforeEach(async () => {
    const userId = uuid.v4()

    user = await prisma.user.create({
      data: {
        id: userId,
        login: 'user1',
        password: encryptPassword(userId, 'user1', 'password'),
        telegram_account: '12345',
      },
    })
  })

  describe('when missing current_password', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(user.token, {})

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_CURRENT_PASSWORD)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when missing new_password', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'qwe',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_NEW_PASSWORD)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when missing new_password_confirmation', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'qwe',
          new_password: 'qwe',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(MISSING_NEW_PASSWORD_CONFIRMATION)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('when new_password and new_password_confirmation do not match', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'qwe',
          new_password: 'qwe',
          new_password_confirmation: 'zxc',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(PASSWORDS_DO_NOT_MATCH)
      expect(res._getStatusCode()).toBe(422)
    })
  })

  describe('when new_password is too short', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'qwe',
          new_password: 'qwezxc1',
          new_password_confirmation: 'qwezxc1',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(PASSWORD_IS_TOO_SHORT)
      expect(res._getStatusCode()).toBe(422)
    })
  })

  describe('when new_password is equal to current_password', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'qwezxc12',
          new_password: 'qwezxc12',
          new_password_confirmation: 'qwezxc12',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(
        NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_CURRENT_PASSWORD
      )
      expect(res._getStatusCode()).toBe(422)
    })
  })

  describe('when current_password is not valid', () => {
    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'qwezxc12',
          new_password: 'qwezxc123',
          new_password_confirmation: 'qwezxc123',
        }
      )

      await handler(req, res)

      expect(parseJSON(res)).toEqual(CURRENT_PASSWORD_IS_NOT_VALID)
      expect(res._getStatusCode()).toBe(403)
    })
  })

  describe('when all is good', () => {
    it('updates user password and token', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'password',
          new_password: 'qwezxc123',
          new_password_confirmation: 'qwezxc123',
        }
      )

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const existedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(existedUser.token).not.toEqual(user.token)
      expect(existedUser.password).not.toEqual(user.password)
    })

    it('returns response', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'password',
          new_password: 'qwezxc123',
          new_password_confirmation: 'qwezxc123',
        }
      )

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const existedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      const response = parseJSON(res)

      expect(response.token).toEqual(existedUser.token)
      expect(response.user.id).toEqual(user.id)
      expect(response.user.login).toEqual('user1')
      expect(response.user.telegram_account).toEqual('12345')
    })

    it('updates last_activity_at', async () => {
      const { req, res } = mockAuthorizedPOSTRequest(
        user.token,
        {},
        {
          current_password: 'password',
          new_password: 'qwezxc123',
          new_password_confirmation: 'qwezxc123',
        }
      )

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      await ensureUserLastActivityHasBeenUpdated(user)
    })
  })
})
