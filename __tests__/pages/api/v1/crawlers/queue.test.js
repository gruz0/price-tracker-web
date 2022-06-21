import prisma from '../../../../../src/lib/prisma'

import { cleanDatabase, mockAuthorizedGETRequest } from '../../../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../../src/pages/api/v1/crawlers/queue'
import {
  METHOD_NOT_ALLOWED,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
  INVALID_TOKEN_UUID,
  CRAWLER_DOES_NOT_EXIST,
} from '../../../../../src/lib/messages'
import { parseJSON } from '../../../../helpers'
import {
  whenMissingAuthorizationHeader,
  whenMissingBearer,
  whenMissingToken,
  whenTokenIsNotUUID,
  whenTokenNotFound,
} from '../../../../matchers'

const ENDPOINT = '/api/v1/crawlers/queue'

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
    whenTokenNotFound(method, handler, 404, CRAWLER_DOES_NOT_EXIST)
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

  describe('when authorized', () => {
    let crawler

    beforeEach(async () => {
      crawler = await prisma.crawler.create({
        data: {
          location: 'somewhere',
        },
      })
    })

    describe('without products', () => {
      test('returns empty response', async () => {
        const { req, res } = mockAuthorizedGETRequest(crawler.token)

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const products = json.products

        expect(products.length).toEqual(0)
      })
    })

    describe('with products', () => {
      test('returns products', async () => {
        const { req, res } = mockAuthorizedGETRequest(crawler.token)

        const user = await prisma.user.create({
          data: {
            login: 'user1',
            password: 'password',
          },
        })

        const anotherCrawler = await prisma.crawler.create({
          data: {
            location: 'somewhere',
          },
        })

        await prisma.productQueue.createMany({
          data: [
            {
              url: 'https://domain1.tld',
              url_hash: 'hash1',
              requested_by_id: user.id,
            },
            {
              url: 'https://domain2.tld',
              url_hash: 'hash2',
              requested_by_id: user.id,
              skip_for_crawler_id: crawler.id,
            },
            {
              url: 'https://domain3.tld',
              url_hash: 'hash3',
              requested_by_id: user.id,
              skip_for_crawler_id: anotherCrawler.id,
            },
          ],
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const json = parseJSON(res)
        const products = json.products

        expect(products.length).toEqual(2)
        expect(products[0].url).toEqual('https://domain1.tld')
        expect(products[1].url).toEqual('https://domain3.tld')
      })
    })
  })
})
