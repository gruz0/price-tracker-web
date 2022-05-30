import crypto from 'crypto'

export const detectURL = (string) => {
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g
  return string.match(urlRegex)
}

export const isValidUrl = (string) => {
  if (
    !string ||
    typeof string === 'undefined' ||
    string.toString().trim().length === 0
  ) {
    return false
  }

  let url

  try {
    url = new URL(string.toString().trim())
  } catch (e) {
    console.error(e)
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}

export const buildCleanURL = (string) => {
  let url = new URL(string.toString().trim())
  return `${url.protocol}//${url.host}${url.pathname}`
}

export const calculateHash = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex')
}

export const truncateString = (str, num) => {
  if (str.length <= num) {
    return str
  }

  return str.slice(0, num) + '...'
}

export const responseJSON = (res, status, json) => {
  res.status(status)
  res.json(json)
  return res.end()
}

export const isShopSupported = (url) => {
  const cleanURL = url.trim().toLowerCase()

  return cleanURL.match(/ozon\.ru/) || cleanURL.match(/wildberries\.ru/)
}
