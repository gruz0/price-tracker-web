import prisma from '../../../../src/lib/prisma'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
  mockAuthorizedGETRequest,
} from '../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../src/pages/api/v1/me'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
} from '../../../../src/lib/messages'
import { parseJSON } from '../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../matchers'

const ENDPOINT = '/api/v1/me'

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

ensureMethodNotAllowed('POST', ENDPOINT)
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`GET ${ENDPOINT}`, () => {
  whenNotAuthorized('GET')

  describe('when user exists', () => {
    test('returns response', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: '12345',
        },
      })

      const { req, res } = mockAuthorizedGETRequest(user.token)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const response = parseJSON(res)

      expect(response.token).toEqual(user.token)
      expect(response.user.id).toEqual(user.id)
      expect(response.user.login).toEqual('user1')
      expect(response.user.api_key).toEqual(user.api_key)
      expect(response.user.telegram_account).toEqual('12345')
    })

    test('updates last_activity_at', async () => {
      const user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
          telegram_account: '12345',
        },
      })

      const { req, res } = mockAuthorizedGETRequest(user.token)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      await ensureUserLastActivityHasBeenUpdated(user)
    })
  })
})
