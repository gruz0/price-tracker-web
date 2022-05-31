const path = require('path')
const fs = require('fs-extra')
const uuid = require('uuid')

const crawlersPath = path.join(process.cwd(), '/data/crawlers')
const productsQueueChangeLocationPath = path.join(
  process.cwd(),
  '/data/queue_change_location'
)

import { productsPath, productsQueuePath } from './const'
import { getProductHistory } from './products'

const getCrawlers = () => {
  let crawlers = []
  const files = fs.readdirSync(crawlersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const { id, token } = fs.readJsonSync(crawlersPath + '/' + file)

      crawlers.push({ id, token })

      return
    }
  })

  return crawlers
}

export const getCrawlerByToken = (token) => {
  const crawlers = getCrawlers()

  return crawlers.find((c) => c.token === token)
}

export const addProductHistory = (
  productId,
  { original_price, discount_price, in_stock, status, title, crawler_id } = {}
) => {
  const productHistoryPath = productsPath + '/' + productId + '-history.json'

  const history = getProductHistory(productId)

  const newHistory = {
    product_id: productId,
    original_price,
    discount_price,
    in_stock,
    status,
    title,
    crawler_id,
    created_at: new Date(),
  }

  history.push(newHistory)

  fs.writeJsonSync(productHistoryPath, history, { spaces: 2 })

  return newHistory
}

export const getOutdatedProducts = (
  lastUpdateInHours = 1,
  productsLimit = 20
) => {
  let products = []

  const files = fs.readdirSync(productsPath)

  files.forEach((file) => {
    if (
      file.endsWith('.json') &&
      !file.includes('-history') &&
      !file.includes('-subscriptions')
    ) {
      const product = fs.readJsonSync(productsPath + '/' + file)
      const { id, url } = product

      const history = getProductHistory(id)

      const lastRecordTimestamp = new Date(history[0].created_at).getTime()
      const now = new Date().getTime()

      const diffInHours = Math.abs((now - lastRecordTimestamp) / (1000 * 3600))

      if (diffInHours >= lastUpdateInHours) {
        products.push({ id, url, last_updated_at: history[0].created_at })
      }
    }
  })

  // Выбираем самые старые записи в количестве productsLimit
  const suitableProducts = products
    .sort((a, b) => new Date(a.last_updated_at) - new Date(b.last_updated_at))
    .slice(0, productsLimit)
    .map((p) => {
      return { id: p.id, url: p.url }
    })

  return suitableProducts
}

export const createProduct = ({
  url_hash,
  shop,
  url,
  title,
  in_stock,
  original_price,
  discount_price,
  status,
}) => {
  const productId = uuid.v4()

  const newProduct = {
    id: productId,
    url_hash,
    shop,
    url,
    title,
    created_at: new Date(),
  }

  const productPath = productsPath + '/' + productId + '.json'

  fs.writeJsonSync(productPath, newProduct, { spaces: 2 })

  addProductHistory(productId, {
    title,
    original_price,
    discount_price,
    in_stock,
    status,
  })

  return newProduct
}

export const removeNewProductFromQueue = (url_hash) => {
  try {
    fs.unlinkSync(productsQueuePath + '/' + url_hash + '.json')
  } catch (err) {}
}

export const getNewProductsQueue = () => {
  let products = []
  const queuedProducts = fs.readdirSync(productsQueuePath)

  queuedProducts.forEach((file) => {
    if (file.endsWith('.json')) {
      const { url_hash, url, requested_by } = fs.readJsonSync(
        productsQueuePath + '/' + file
      )

      products.push({ url_hash, url, requested_by })
    }
  })

  return products
}

export const moveProductFromQueueToChangeLocation = (url_hash) => {
  try {
    fs.mkdirSync(productsQueueChangeLocationPath)
  } catch (err) {}

  const from = productsQueuePath + '/' + url_hash + '.json'
  const to = productsQueueChangeLocationPath + '/' + url_hash + '.json'

  fs.moveSync(from, to)
}
