import crypto from 'crypto'
import { isEmptyString } from './validators'

// TODO: Добавить тесты
export const detectURL = (string) => {
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g
  return string.match(urlRegex)
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

const mobileURLMapping = {
  'm.ozon.ru': 'www.ozon.ru',
  'm.lamoda.ru': 'www.lamoda.ru',
}

export const buildCleanURL = (string) => {
  let url = new URL(string.toString().trim())

  const host = mobileURLMapping[url.host] || url.host

  return `${url.protocol}//${host}${url.pathname}`
}

// TODO: Добавить тесты
export const calculateHash = (string) => {
  if (isEmptyString(string)) throw new Error('Пустая строка')

  return crypto.createHash('sha256').update(string).digest('hex')
}

export const responseJSON = (res, status, json) => {
  res.status(status)
  res.json(json)
  return res.end()
}

// TODO: Добавить тесты
export const isShopSupported = (url) => {
  const cleanURL = url.trim().toLowerCase()

  return (
    cleanURL.match(/ozon\.ru/) ||
    cleanURL.match(/wildberries\.ru/) ||
    cleanURL.match(/lamoda\.ru/) ||
    cleanURL.match(/sbermegamarket\.ru/) ||
    cleanURL.match(/store77\.net/)
  )
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

// TODO: Добавить тесты
export const buildUserResponse = (user) => {
  if (!user) throw new Error('Пустой пользователь')

  return {
    token: user.token,
    user: {
      id: user.id,
      login: user.login,
      telegram_account: user.telegram_account,
    },
  }
}
