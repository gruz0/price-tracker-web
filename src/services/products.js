const fs = require('fs-extra')
const uuid = require('uuid')

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

export const getProductSubscriptions = (productId) => {
  const productSubscriptionsPath =
    productsPath + '/' + productId + '-subscriptions.json'

  let productSubscriptions = []

  try {
    productSubscriptions = fs.readJsonSync(productSubscriptionsPath)
  } catch (err) {
    return []
  }

  return productSubscriptions
}

export const getUserProductSubscriptions = (userId, productId) => {
  const productSubscriptions = getProductSubscriptions(productId)

  return productSubscriptions.filter(
    (subscription) => subscription.user_id === userId
  )
}

export const getUserProductSubscription = (
  userId,
  productId,
  subscriptionId
) => {
  const userProductSubscriptions = getUserProductSubscriptions(
    userId,
    productId
  )

  return userProductSubscriptions.find(
    (userProductSubscription) => userProductSubscription.id === subscriptionId
  )
}

export const getUserProductSubscriptionByType = (
  userId,
  productId,
  subscriptionType
) => {
  const userProductSubscriptions = getUserProductSubscriptions(
    userId,
    productId
  )

  return userProductSubscriptions.find(
    (subscription) => subscription.subscription_type === subscriptionType
  )
}

export const removeUserProductSubscription = (
  userId,
  productId,
  subscriptionId
) => {
  let userProductSubscription

  let productSubscriptions = getProductSubscriptions(productId)

  for (let idx = 0; idx < productSubscriptions.length; idx++) {
    if (
      productSubscriptions[idx].user_id === userId &&
      productSubscriptions[idx].id === subscriptionId
    ) {
      userProductSubscription = productSubscriptions.splice(idx, 1)
    }
  }

  if (!userProductSubscription) {
    throw new Error(
      `Не удалось найти подписку ${subscriptionId} у товара ${productId} для пользователя ${userId}`
    )
  }

  const productSubscriptionsPath =
    productsPath + '/' + productId + '-subscriptions.json'

  fs.writeJsonSync(productSubscriptionsPath, productSubscriptions, {
    spaces: 2,
  })

  return userProductSubscription
}

export const removeUserProductSubscriptions = (userId, productId) => {
  let productSubscriptions = getProductSubscriptions(productId)

  if (productSubscriptions.length === 0) {
    return
  }

  for (let idx = 0; idx < productSubscriptions.length; idx++) {
    if (productSubscriptions[idx].user_id === userId) {
      productSubscriptions.splice(idx, 1)
    }
  }

  const productSubscriptionsPath =
    productsPath + '/' + productId + '-subscriptions.json'

  fs.writeJsonSync(productSubscriptionsPath, productSubscriptions, {
    spaces: 2,
  })
}

export const addProductSubscription = (
  productId,
  userId,
  subscriptionType,
  payload = {}
) => {
  let productSubscriptions = getProductSubscriptions(productId)

  const userSubscription = {
    id: uuid.v4(),
    product_id: productId,
    user_id: userId,
    subscription_type: subscriptionType,
    payload: payload,
    created_at: new Date(),
  }

  productSubscriptions.push(userSubscription)

  const productSubscriptionsPath =
    productsPath + '/' + productId + '-subscriptions.json'

  fs.writeJsonSync(productSubscriptionsPath, productSubscriptions, {
    spaces: 2,
  })

  return userSubscription
}

export const getSuccessProductHistory = (productHistory) => {
  return productHistory.filter((history) => history.status === 'ok')
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
    if (
      file.endsWith('.json') &&
      !file.includes('-history') &&
      !file.includes('-subscriptions')
    ) {
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
