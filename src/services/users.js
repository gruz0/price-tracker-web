const fs = require('fs-extra')

import {
  getProduct,
  getProductHistory,
  getSuccessProductHistory,
  getProductDiscountPriceOrOriginalPrice,
} from './products'
import { usersPath } from './const'

export const getUserProductWithActualStateAndHistory = (
  product,
  userProduct
) => {
  const productHistory = getProductHistory(product.id)

  if (productHistory.length === 0) {
    throw new Error(`Товар с ID ${userProduct.id} не содержит истории цен`)
  }

  const productActualState = buildProductActualState(
    product,
    userProduct,
    productHistory
  )

  const successProductHistory = getSuccessProductHistory(productHistory)

  return {
    product: productActualState,
    history: successProductHistory,
  }
}

export const getUserProductsWithActualState = (userId) => {
  const userProducts = getUserProducts(userId)

  if (userProducts.length === 0) {
    return []
  }

  const products = userProducts.map((userProduct) => {
    const product = getProduct(userProduct.id)

    if (!product) {
      throw new Error(
        `Не удалось найти товар с ID ${userProduct.id}, который привязан к пользователю`
      )
    }

    const productHistory = getProductHistory(product.id)

    if (productHistory.length === 0) {
      throw new Error(`Товар с ID ${userProduct.id} не имеет истории цен`)
    }

    const productActualState = buildProductActualState(
      product,
      userProduct,
      productHistory
    )

    return productActualState
  })

  return products.sort(
    (a, b) => new Date(b.price_updated_at) - new Date(a.price_updated_at)
  )
}

const buildProductActualState = (product, userProduct, productHistory) => {
  const { id, shop, url, title } = product
  const { price: myPrice, favorited, created_at } = userProduct

  if (!myPrice) {
    throw new Error(`У пользовательского товара ${product.id} нет цены`)
  }

  if (!created_at) {
    throw new Error(
      `У пользовательского товара ${product.id} нет даты создания`
    )
  }

  const successProductHistory = getSuccessProductHistory(productHistory)

  let inStock = false
  let priceUpdatedAt = product.created_at
  let lastPrice = userProduct.price
  let lowestProductPrice = 0
  let highestProductPrice = 0

  if (successProductHistory.length > 0) {
    const lastProductHistory = successProductHistory[0]

    inStock = lastProductHistory.in_stock
    priceUpdatedAt = lastProductHistory.created_at
    lastPrice = getProductDiscountPriceOrOriginalPrice(lastProductHistory)

    if (!lastPrice) {
      console.error({ lastProductHistory })

      throw new Error(
        `Ошибка при обработке актуальной цены из истории товара ${product.id}`
      )
    }

    lowestProductPrice = buildProductLowestPriceFromHistory(
      product.id,
      productHistory
    )
    highestProductPrice = buildProductHighestPriceFromHistory(
      product.id,
      productHistory
    )
  }

  return {
    id,
    shop,
    url,
    title,
    last_price: lastPrice,
    in_stock: inStock,
    price_updated_at: priceUpdatedAt,
    lowest_price_ever: lowestProductPrice,
    highest_price_ever: highestProductPrice,
    product_created_at: created_at,
    favorited: favorited,
    my_price: myPrice,
    my_benefit: myPrice - lastPrice,
    has_discount: myPrice > lastPrice,
  }
}

const buildProductLowestPriceFromHistory = (productId, productHistory) => {
  let lowestPrice = null

  const pricesWithDiscount = [...productHistory]
    .filter((product) => product.discount_price !== null)
    .map((product) => product.discount_price)
    .reverse()

  if (pricesWithDiscount.length > 0) {
    lowestPrice = Math.min.apply(Math, pricesWithDiscount)
  }

  if (lowestPrice !== null) {
    return lowestPrice
  }

  const pricesWithoutDiscount = [...productHistory]
    .filter((product) => product.original_price !== null)
    .map((product) => product.original_price)
    .reverse()

  if (pricesWithoutDiscount.length > 0) {
    return Math.min.apply(Math, pricesWithoutDiscount)
  }

  throw new Error(
    `Не удалось получить наименьшую цену из истории для товара ${productId}`
  )
}

const buildProductHighestPriceFromHistory = (productId, productHistory) => {
  const pricesWithoutDiscount = [...productHistory]
    .filter((product) => product.original_price !== null)
    .map((product) => product.original_price)
    .sort()

  if (pricesWithoutDiscount.length > 0) {
    return Math.max.apply(Math, pricesWithoutDiscount)
  }

  throw new Error(
    `Не удалось получить наивысшую цену из истории для товара ${productId}`
  )
}

const getUserProducts = (userId) => {
  const userProductsPath = usersPath + '/' + userId + '/products.json'

  const products = fs.readJsonSync(userProductsPath)

  return products.products
}

export const addProductToUser = (userId, productId, productPrice) => {
  let userProducts = getUserProducts(userId)

  const hasProduct = userProducts.find((product) => product.id === productId)

  if (hasProduct) {
    return
  }

  userProducts.push({
    id: productId,
    price: productPrice,
    created_at: new Date(),
    favorited: false,
  })

  const userProductsPath = usersPath + '/' + userId + '/products.json'

  fs.writeJsonSync(userProductsPath, { products: userProducts }, { spaces: 2 })
}

export const getUserProduct = (userId, productId) => {
  const userProducts = getUserProducts(userId)

  const userProduct = userProducts.find(
    (userProduct) => userProduct.id === productId
  )

  if (!userProduct) {
    return null
  }

  const product = getProduct(productId)

  return {
    ...userProduct,
    title: product.title,
  }
}
