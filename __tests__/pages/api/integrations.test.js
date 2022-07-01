import { mockGETRequest } from '../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../src/pages/api/integrations'
import { METHOD_NOT_ALLOWED } from '../../../src/lib/messages'
import { parseJSON } from '../../helpers'

const ENDPOINT = '/api/integrations'

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
  test('returns response', async () => {
    const { req, res } = mockGETRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(parseJSON(res)).toEqual({
      routes: {
        check_product_url:
          'http://localhost:3000/api/v1/3rdparty/check_product',
        add_product_url: 'http://localhost:3000/api/v1/3rdparty/add_product',
      },
    })
  })
})
