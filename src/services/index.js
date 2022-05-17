const path = require('path')
const fs = require('fs-extra')
const uuid = require('uuid')

import { encryptPassword } from '../lib/auth'

const usersPath = path.join(process.cwd(), '/data/users')
const productsPath = path.join(process.cwd(), '/data/products')
const productsQueuePath = path.join(process.cwd(), '/data/queue')

const getUsers = () => {
  let users = []
  const files = fs.readdirSync(usersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const { id, login, password, token } = fs.readJsonSync(
        usersPath + '/' + file
      )

      users.push({ id, login, password, token })

      return
    }
  })

  return users
}

const getUserByToken = (token) => {
  let user
  const users = getUsers()

  users.forEach((u) => {
    if (u.token === token) {
      user = u

      return
    }
  })

  return user
}

const findUserByLoginAndPassword = (login, password) => {
  const users = getUsers()

  const user = users.find((u) => {
    return (
      u.login.toLowerCase() === login.toLowerCase() &&
      u.password === encryptPassword(u.id, u.login, password)
    )
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    login: user.login,
    token: user.token,
  }
}

const findUser = (id) => {
  let user
  const users = getUsers()

  users.forEach((u) => {
    if (u.id === id) {
      user = u

      return
    }
  })

  return user
}

const getUserProducts = (userId) => {
  let userProducts = []
  let userProductsIds = []
  const userProductsPath = usersPath + '/' + userId + '/products.json'

  try {
    const products = fs.readJsonSync(userProductsPath)
    userProducts = products.products

    userProductsIds = userProducts.map((product) => product.id)
  } catch (err) {
    userProductsIds = []
  }

  if (userProductsIds.length === 0) {
    return []
  }

  const matchedProducts = getProducts().filter((product) =>
    userProductsIds.includes(product.id)
  )

  if (matchedProducts.length === 0) {
    return []
  }

  userProducts = matchedProducts.map((matchedProduct) => {
    const userProduct = userProducts.find(
      (product) => product.id === matchedProduct.id
    )

    if (!userProduct) {
      throw new Error('Не должно быть ситуации, когда userProduct не найден')
    }

    const {
      id,
      shop,
      url,
      title,
      price: actual_price,
      lowest_price,
      highest_price,
      in_stock,
      updated_at,
    } = matchedProduct

    return {
      id,
      shop,
      url,
      title,
      actual_price,
      lowest_price,
      highest_price,
      in_stock,
      updated_at,
      my_price: userProduct.price,
      favorited: userProduct.favorited,
      has_discount: userProduct.price > matchedProduct.price,
    }
  })

  return userProducts
}

const getProducts = () => {
  let products = []

  const files = fs.readdirSync(productsPath)

  files.forEach((file) => {
    if (file.endsWith('.json') && !file.includes('-history')) {
      products.push(fs.readJsonSync(productsPath + '/' + file))
    }
  })

  const productsWithPrices = products.map((product) => {
    const productHistory = getProductHistory(product.id)

    const lowestOriginalPrice = [...productHistory].sort(
      (a, b) => a.original_price - b.original_price
    )
    const lowestDiscountPrice = [...productHistory].sort(
      (a, b) => a.discount_price - b.discount_price
    )
    const lowestPrice =
      lowestDiscountPrice[0].discount_price ||
      lowestOriginalPrice[0].original_price

    const highestOriginalPrice = [...productHistory].sort(
      (a, b) => b.original_price - a.original_price
    )
    const highestDiscountPrice = [...productHistory].sort(
      (a, b) => b.discount_price - a.discount_price
    )
    const highestPrice =
      highestDiscountPrice[0].discount_price ||
      highestOriginalPrice[0].original_price

    const history = productHistory[0]

    const actualPrice = history.discount_price || history.original_price

    const previousPrice =
      productHistory.length > 1
        ? productHistory[1].discount_price || productHistory[1].original_price
        : actualPrice

    return {
      ...product,
      price: actualPrice,
      original_price: history.original_price,
      discount_price: history.discount_price,
      previous_price: previousPrice,
      in_stock: history.in_stock,
      status: history.status,
      updated_at: history.created_at,
      lowest_price: lowestPrice,
      highest_price: highestPrice,
    }
  })

  return productsWithPrices.sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  )
}

const getOutdatedProducts = (lastUpdateInHours = 1, productsLimit = 20) => {
  let products = []

  const files = fs.readdirSync(productsPath)

  files.forEach((file) => {
    if (file.endsWith('.json') && !file.includes('-history')) {
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

const getUserProduct = (userId, productId) => {
  const userProducts = getUserProducts(userId)

  const userProduct = userProducts.find((product) => product.id === productId)

  if (!userProduct) {
    return null
  }

  const productHistory = getProductHistory(productId)

  // Надо вручную рассчитывать максимальную цену
  const highestPrice = [...productHistory].sort(
    (a, b) => new Date(b.original_price) - new Date(a.original_price)
  )[0].original_price

  return {
    product: {
      ...userProduct,
      highest_price: highestPrice,
    },
    history: productHistory,
  }
}

const getProduct = (id) => {
  const productPath = productsPath + '/' + id + '.json'

  const product = fs.readJsonSync(productPath)
  const productHistory = getProductHistory(product.id)

  const lowestOriginalPrice = [...productHistory]
    .sort((a, b) => a.original_price - b.original_price)
    .filter((a) => a.original_price != 0)

  const lowestDiscountPrice = [...productHistory]
    .sort((a, b) => a.discount_price - b.discount_price)
    .filter((a) => a.discount_price != 0)

  const lowestPrice =
    lowestDiscountPrice[0].discount_price ||
    lowestOriginalPrice[0].original_price

  const highestOriginalPrice = [...productHistory].sort(
    (a, b) => b.original_price - a.original_price
  )
  const highestDiscountPrice = [...productHistory].sort(
    (a, b) => b.discount_price - a.discount_price
  )
  const highestPrice =
    highestDiscountPrice[0].discount_price ||
    highestOriginalPrice[0].original_price

  const latestHistory = productHistory[0]

  return {
    ...product,
    price: latestHistory.discount_price || latestHistory.original_price,
    in_stock: productHistory.in_stock,
    status: productHistory.status,
    lowest_price: lowestPrice,
    highest_price: highestPrice,
  }
}

const findProductByURLHash = (urlHash) => {
  const products = getProducts()

  if (products.length === 0) {
    return null
  }

  return products.find((product) => product.url_hash === urlHash)
}

const getNewProductsQueue = () => {
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

const createProduct = ({
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

  return {
    ...newProduct,
    price: discount_price || original_price,
  }
}

const addProductToUser = (userId, productId, productPrice) => {
  let userProducts = getUserProducts(userId)

  const hasProduct = userProducts.find((product) => product.id === productId)

  if (hasProduct) {
    return
  }

  userProducts = userProducts.map((userProduct) => ({
    id: userProduct.id,
    price: userProduct.actual_price,
    created_at: userProduct.updated_at,
    favorited: userProduct.favorited,
  }))

  userProducts.push({
    id: productId,
    price: productPrice,
    created_at: new Date(),
    favorited: false,
  })

  const userProductsPath = usersPath + '/' + userId + '/products.json'

  fs.writeJsonSync(userProductsPath, { products: userProducts }, { spaces: 2 })
}

const addNewProductToQueue = ({ url_hash, url, requested_by }) => {
  const productQueuePath = productsQueuePath + '/' + url_hash + '.json'

  fs.writeJsonSync(
    productQueuePath,
    { url_hash, url, requested_by },
    { spaces: 2 }
  )
}

const getProductHistory = (productId) => {
  const productHistoryPath = productsPath + '/' + productId + '-history.json'

  let productHistory = []

  try {
    productHistory = fs.readJsonSync(productHistoryPath)
  } catch (err) {
    return []
  }

  let history = productHistory
    .filter((item) => typeof item.created_at !== 'undefined')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  history = history.filter((record) => record.status === 'ok')

  return history
}

const addProductHistory = (
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

const removeNewProductFromQueue = (url_hash) => {
  try {
    fs.unlinkSync(productsQueuePath + '/' + url_hash + '.json')
  } catch (err) {

  }
}

module.exports = {
  findUserByLoginAndPassword,
  getUserByToken,
  getUserProducts,
  getUserProduct,
  findUser,
  addProductToUser,
  addProductHistory,
  addNewProductToQueue,
  findProductByURLHash,
  getProducts,
  getOutdatedProducts,
  getProduct,
  getNewProductsQueue,
  createProduct,
  removeNewProductFromQueue,
  getProductHistory,
}
