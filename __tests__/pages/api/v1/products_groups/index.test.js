import prisma from '../../../../../src/lib/prisma'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../src/pages/api/v1/products_groups/index'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  FORBIDDEN,
  MISSING_USER_PRODUCTS_GROUP_TITLE,
  USER_PRODUCTS_GROUP_CREATED,
} from '../../../../../src/lib/messages'
import {
  cleanDatabase,
  ensureUserLastActivityHasBeenUpdated,
  mockAuthorizedGETRequest,
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

const ENDPOINT = '/api/v1/products_groups'

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

ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`GET ${ENDPOINT}`, () => {
  whenNotAuthorized('GET')

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

    describe('without products groups', () => {
      test('returns empty response', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        expect(parseJSON(res)).toEqual({
          products_groups: [],
        })
      })

      test('updates last_activity_at', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        await ensureUserLastActivityHasBeenUpdated(user)
      })
    })

    describe('with products groups', () => {
      test('returns only products groups related to user', async () => {
        const { req, res } = mockAuthorizedGETRequest(user.token)

        const userProductsGroup = await prisma.userProductsGroup.create({
          data: {
            user_id: user.id,
            title: 'Group Title',
          },
        })

        const anotherUser = await prisma.user.create({
          data: {
            login: 'user2',
            password: 'password',
          },
        })

        await prisma.userProductsGroup.create({
          data: {
            user_id: anotherUser.id,
            title: 'Another Group Title',
          },
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const result = json.products_groups

        expect(result.length).toEqual(1)
        expect(result[0]).toEqual({
          id: userProductsGroup.id,
          title: userProductsGroup.title,
          image: null,
          created_at: userProductsGroup.created_at.toISOString(),
          products_count: 0,
        })
      })
    })
  })
})

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

    describe('when missing title', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(user.token, {})

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_USER_PRODUCTS_GROUP_TITLE)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when title is empty', () => {
      test('returns error', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            title: ' ',
          }
        )

        await handler(req, res)

        expect(parseJSON(res)).toEqual(MISSING_USER_PRODUCTS_GROUP_TITLE)
        expect(res._getStatusCode()).toBe(422)
      })
    })

    describe('when all is good', () => {
      test('creates a new products group', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            title: ' Food for pets ',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)

        const userProductsGroups = await prisma.userProductsGroup.findMany()
        expect(userProductsGroups.length).toEqual(1)
        expect(userProductsGroups[0].title).toEqual('Food for pets')

        expect(parseJSON(res)).toEqual({
          ...USER_PRODUCTS_GROUP_CREATED,
          location: '/products_groups/' + userProductsGroups[0].id,
        })
      })

      test('updates last_activity_at', async () => {
        const { req, res } = mockAuthorizedPOSTRequest(
          user.token,
          {},
          {
            title: ' Food for pets ',
          }
        )

        await handler(req, res)

        expect(res._getStatusCode()).toBe(201)

        await ensureUserLastActivityHasBeenUpdated(user)
      })
    })
  })
})
