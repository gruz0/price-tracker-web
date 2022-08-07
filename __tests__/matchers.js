import { createMocks } from 'node-mocks-http'
import { parseJSON } from './helpers'
const uuid = require('uuid')

const whenSomethingWentWrong = (
  description,
  method,
  handler,
  headers,
  status,
  message
) => {
  describe(description, () => {
    it(`returns ${status}`, async () => {
      const { req, res } = createMocks({
        method: method,
        headers: headers,
      })

      await handler(req, res)

      expect(parseJSON(res)).toEqual(message)
      expect(res._getStatusCode()).toBe(status)
    })
  })
}

export const whenMissingAuthorizationHeader = (method, handler, message) => {
  whenSomethingWentWrong(
    'when missing authorization header',
    method,
    handler,
    {},
    401,
    message
  )
}

export const whenMissingBearer = (method, handler, message) => {
  whenSomethingWentWrong(
    'when missing bearer',
    method,
    handler,
    { authorization: 'Beare' },
    401,
    message
  )
}

export const whenMissingToken = (method, handler, message) => {
  whenSomethingWentWrong(
    'when missing token',
    method,
    handler,
    { authorization: 'Bearer ' },
    401,
    message
  )
}

export const whenTokenIsNotUUID = (method, handler, status, message) => {
  whenSomethingWentWrong(
    'when token is not a valid UUID',
    method,
    handler,
    { authorization: 'Bearer qwe' },
    status,
    message
  )
}

export const whenTokenNotFound = (method, handler, status, message) => {
  whenSomethingWentWrong(
    'when record does not exist',
    method,
    handler,
    { authorization: `Bearer ${uuid.v4()}` },
    status,
    message
  )
}
