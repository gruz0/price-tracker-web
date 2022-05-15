import crypto from 'crypto'

export const isValidUrl = (string) => {
  if (typeof string === 'undefined' || string.toString().trim().length === 0) {
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
