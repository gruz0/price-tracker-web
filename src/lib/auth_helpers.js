import {
  INVALID_TOKEN_UUID,
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
} from './messages'
import { isEmptyString, isValidUUID } from './validators'

// TODO: Добавить тесты
export const validateBearerToken = ({ authorization }) => {
  if (!authorization) {
    return {
      code: 401,
      error: MISSING_AUTHORIZATION_HEADER,
    }
  }

  if (!authorization.startsWith('Bearer ')) {
    return {
      code: 401,
      error: MISSING_BEARER_KEY,
    }
  }

  const token = authorization.replace(/^Bearer /, '').trim()

  if (isEmptyString(token)) {
    return {
      code: 401,
      error: MISSING_TOKEN,
    }
  }

  if (!isValidUUID(token)) {
    return {
      code: 400,
      error: INVALID_TOKEN_UUID,
    }
  }

  return token
}
