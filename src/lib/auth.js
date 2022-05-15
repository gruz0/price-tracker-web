import crypto from 'crypto'

import {
  MISSING_AUTHORIZATION_HEADER,
  MISSING_BEARER_KEY,
  MISSING_TOKEN,
} from './messages'

export const checkToken = (req, res) => {
  const { authorization } = req.headers

  if (!authorization) {
    res.status(401).json(MISSING_AUTHORIZATION_HEADER)
    return false
  }

  if (!authorization.startsWith('Bearer ')) {
    res.status(401).json(MISSING_BEARER_KEY)
    return false
  }

  const token = authorization.replace(/^Bearer /, '').trim()

  if (token.length === 0) {
    res.status(401).json(MISSING_TOKEN)
    return false
  }

  return token
}

export const encryptPassword = (userId, login, password) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}${login}${password}`)
    .digest('hex')
}
