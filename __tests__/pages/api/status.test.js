import { mockGETRequest } from '../../helpers'
import { createMocks } from 'node-mocks-http'
import handler from '../../../src/pages/api/status'
import { METHOD_NOT_ALLOWED } from '../../../src/lib/messages'
import { parseJSON } from '../../helpers'

const ENDPOINT = '/api/status'

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

ensureMethodNotAllowed('POST', ENDPOINT)
ensureMethodNotAllowed('PUT', ENDPOINT)
ensureMethodNotAllowed('DELETE', ENDPOINT)

describe(`GET ${ENDPOINT}`, () => {
  it('returns response', async () => {
    const { req, res } = mockGETRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(parseJSON(res)).toEqual({ success: true })
  })
})
