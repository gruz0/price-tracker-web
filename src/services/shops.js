import { isEmptyString } from '../lib/validators'

const shops = {
  ozon: {
    name: 'ozon',
    domain: 'www.ozon.ru',
    alternateDomains: ['ozon.ru', 'm.ozon.ru'],
    searchPath: '/search?text=',
    singleProductPattern: '/product/.+',
  },
  lamoda: {
    name: 'lamoda',
    domain: 'www.lamoda.ru',
    alternateDomains: ['lamoda.ru', 'm.lamoda.ru'],
    searchPath: '/catalogsearch/result/?q=',
    singleProductPattern: '/p/.+',
  },
  wildberries: {
    name: 'wildberries',
    domain: 'www.wildberries.ru',
    alternateDomains: ['wildberries.ru'],
    searchPath: '/catalog/0/search.aspx?sort=popular&search=',
    singleProductPattern: '/catalog/[\\d]{2,}',
  },
  sbermegamarket: {
    name: 'sbermegamarket',
    domain: 'sbermegamarket.ru',
    alternateDomains: ['www.sbermegamarket.ru'],
    searchPath: '/catalog/?q=',
    singleProductPattern: '/catalog/details/.+',
  },
  store77: {
    name: 'store77',
    domain: 'store77.net',
    alternateDomains: ['www.store77.net'],
    searchPath: '/search/?q=',
    singleProductPattern: '/[\\w\\d\\_]+/[\\w\\d\\_]+/',
  },
  goldapple: {
    name: 'goldapple',
    domain: 'goldapple.ru',
    alternateDomains: ['www.goldapple.ru'],
    searchPath: '/catalogsearch/result?q=',
    singleProductPattern: '/[\\d]+\\-.+',
  },
}

const findShopByHost = (host) => {
  if (isEmptyString(host)) {
    return null
  }

  const cleanHost = host.toString().trim().toLowerCase()

  for (const key in shops) {
    const shop = shops[key]

    if (shop.domain === cleanHost) {
      return shop
    }

    const result = shop.alternateDomains.find((domain) => domain === cleanHost)

    if (result) {
      return shop
    }
  }

  return null
}

export const findShopByURL = (input) => {
  const url = new URL(input.toString().trim().toLowerCase())

  return findShopByHost(url.host)
}

export const isSingleProductURL = (shopName, url) => {
  const shop = shops[shopName]

  if (!shop || shop.name !== shopName) {
    throw new Error(`Магазин ${shopName} не найден`)
  }

  return url.match(`${shop.domain}${shop.singleProductPattern}`) !== null
}

export const replaceHostWithOriginalShopDomain = (shop, singleProductURL) => {
  let url = new URL(singleProductURL.toString().trim())

  return `${url.protocol}//${shop.domain}${url.pathname}`
}
