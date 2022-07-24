import crypto from 'crypto'
import { isEmptyString } from './validators'

// TODO: Добавить тесты
export const detectURL = (string) => {
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g
  return string.match(urlRegex)
}

export const isValidObject = (object) => {
  return !(Object.keys(object).length === 0 && object.constructor === Object)
}

// TODO: Добавить тесты
export const isValidUrl = (string) => {
  if (isEmptyString(string)) {
    return false
  }

  let url

  try {
    url = new URL(string.toString().trim())
  } catch (e) {
    console.error({ e })
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}

export const calculateHash = (string) => {
  // TODO: Добавить тесты
  if (isEmptyString(string)) throw new Error('Пустая строка')

  return crypto.createHash('sha256').update(string).digest('hex')
}

export const responseJSON = (res, status, json) => {
  res.status(status)
  res.json(json)
  return res.end()
}

const SUPPORTED_PRODUCT_STATUSES = [
  'ok',
  'not_found',
  'required_to_change_location',
  'skip',
  'age_restriction',
]

// TODO: Добавить тесты
export const isStatusSupported = (status) => {
  return SUPPORTED_PRODUCT_STATUSES.includes(status)
}

export const buildUserResponse = (user) => {
  if (!user) throw new Error('Пустой пользователь')

  return {
    token: user.token,
    user: {
      id: user.id,
      login: user.login,
      api_key: user.api_key,
      telegram_account: user.telegram_account,
    },
  }
}
