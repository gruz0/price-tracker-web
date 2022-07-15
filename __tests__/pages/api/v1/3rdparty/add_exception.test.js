import prisma from '../../../../../src/lib/prisma'

import { createMocks } from 'node-mocks-http'
import handler from '../../../../../src/pages/api/v1/3rdparty/add_exception'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  API_KEY_DOES_NOT_EXIST,
  MISSING_APP,
  MISSING_VERSION,
  MISSING_MESSAGE,
  ERROR_REPORT_CREATED,
} from '../../../../../src/lib/messages'
import {
  cleanDatabase,
  mockAuthorizedPOSTRequest,
  parseJSON,
} from '../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../matchers'

const ENDPOINT = '/api/v1/3rdparty/add_exception'

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
    whenTokenNotFound(method, handler, 403, API_KEY_DOES_NOT_EXIST)
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
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`POST ${ENDPOINT}`, () => {
  whenNotAuthorized('POST')

  describe('when authorized', () => {
    let user

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          login: 'user1',
          password: 'password',
        },
      })
    })

    describe('when missing app', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.api_key, {})

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_APP)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when missing version', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
          {},
          {
            app: 'chrome-extension',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_VERSION)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when missing message', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
          {},
          {
            app: 'chrome-extension',
            version: '1.0.0',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_MESSAGE)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when only required fields are provided', () => {
      test('returns report', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
          {},
          {
            app: 'chrome-extension',
            version: '1.0.0',
            message: 'description',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)
        expect(parseJSON(res)).toEqual({
          ...ERROR_REPORT_CREATED,
          report: {
            app: 'chrome-extension',
            version: '1.0.0',
            message: 'description',
          },
        })
      })
    })

    describe('when additionally meta provided', () => {
      test('returns report', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.api_key,
          {},
          {
            app: 'chrome-extension',
            version: '1.0.0',
            message: 'description',
            meta: {
              url: 'https://domain.tld',
            },
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)
        expect(parseJSON(res)).toEqual({
          ...ERROR_REPORT_CREATED,
          report: {
            app: 'chrome-extension',
            version: '1.0.0',
            message: 'description',
            meta: {
              url: 'https://domain.tld',
            },
          },
        })
      })
    })
  })
})
