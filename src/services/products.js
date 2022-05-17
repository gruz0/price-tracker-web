const fs = require('fs-extra')

import { productsPath, productsQueuePath } from './const'

export const getProduct = (id) => {
  const productPath = productsPath + '/' + id + '.json'

  return fs.readJsonSync(productPath)
}

export const getProductHistory = (productId) => {
  const productHistoryPath = productsPath + '/' + productId + '-history.json'

  let productHistory = []

  try {
    productHistory = fs.readJsonSync(productHistoryPath)
  } catch (err) {
    return []
  }

  const history = productHistory.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return history
}

export const getSuccessProductHistory = (productHistory) => {
  return productHistory.filter(
    (history) => history.status === 'ok' && history.in_stock === true
  )
}

export const getProductLatestValidPriceFromHistory = (productId) => {
  const productHistory = getProductHistory(productId)

  if (productHistory.length === 0) {
    throw new Error(`Товар с ID ${productId} не содержит истории цен`)
  }

  const successProductHistory = getSuccessProductHistory(productHistory)

  if (successProductHistory.length === 0) {
    console.error({ productHistory })

    throw new Error(
      `Товар с ID ${productId} не содержит записей в истории с успешным статусом парсинга`
    )
  }

  return getProductDiscountPriceOrOriginalPrice(successProductHistory[0])
}

export const getProductDiscountPriceOrOriginalPrice = (productHistoryItem) => {
  return productHistoryItem.discount_price || productHistoryItem.original_price
}

export const findProductByURLHash = (urlHash) => {
  const products = getProducts()

  if (products.length === 0) {
    return null
  }

  return products.find((product) => product.url_hash === urlHash)
}

const getProducts = () => {
  let products = []

  const files = fs.readdirSync(productsPath)

  files.forEach((file) => {
    if (file.endsWith('.json') && !file.includes('-history')) {
      products.push(fs.readJsonSync(productsPath + '/' + file))
    }
  })

  return products
}

export const addNewProductToQueue = ({ url_hash, url, requested_by }) => {
  const productQueuePath = productsQueuePath + '/' + url_hash + '.json'

  fs.writeJsonSync(
    productQueuePath,
    { url_hash, url, requested_by },
    { spaces: 2 }
  )
}

export const isProductExists = (id) => {
  const productPath = productsPath + '/' + id + '.json'

  return fs.pathExistsSync(productPath)
}
