import { validateBearerToken } from '../../src/lib/auth_helpers'
import {
  INVALID_TOKEN_UUID,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
} from '../../src/lib/messages'
const uuid = require('uuid')

describe('validateBearerToken', () => {
  const execution = (input) => {
    return validateBearerToken(input)
  }

  describe('when missing authorization', () => {
    it('returns error', () => {
      const result = execution({})

      expect(result).toEqual({
        code: 401,
        error: MISSING_AUTHORIZATION_HEADER,
      })
    })
  })

  describe('when authorization does not start with Bearer ', () => {
    it('returns error', () => {
      const result = execution({ authorization: 'Bearer' })

      expect(result).toEqual({
        code: 401,
        error: MISSING_BEARER_KEY,
      })
    })
  })

  describe('when token is empty', () => {
    it('returns error', () => {
      const result = execution({ authorization: 'Bearer ' })

      expect(result).toEqual({
        code: 401,
        error: MISSING_TOKEN,
      })
    })
  })

  describe('when token is not a valid UUID', () => {
    it('returns error', () => {
      const result = execution({ authorization: 'Bearer qwe' })

      expect(result).toEqual({
        code: 400,
        error: INVALID_TOKEN_UUID,
      })
    })
  })

  describe('when token is a valid UUID but with extra chars', () => {
    it('returns error', () => {
      const token = `${uuid.v4()}q`

      const result = execution({ authorization: `Bearer ${token}` })

      expect(result).toEqual({
        code: 400,
        error: INVALID_TOKEN_UUID,
      })
    })
  })

  describe('when valid UUID token provided', () => {
    it('returns token', () => {
      const token = uuid.v4()

      const result = execution({ authorization: `Bearer ${token}` })

      expect(result).toEqual(token)
    })
  })
})
