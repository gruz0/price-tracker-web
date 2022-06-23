const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const path = require('path')
const fs = require('fs-extra')

const usersPath = path.join(process.cwd(), '/data/users')
const botsPath = path.join(process.cwd(), '/data/bots')
const crawlersPath = path.join(process.cwd(), '/data/crawlers')
const productsPath = path.join(process.cwd(), '/data/products')

const getUsers = () => {
  let users = []
  const files = fs.readdirSync(usersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      users.push(fs.readJsonSync(usersPath + '/' + file))

      return
    }
  })

  return users
}

const getBots = () => {
  let bots = []
  const files = fs.readdirSync(botsPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      bots.push(fs.readJsonSync(botsPath + '/' + file))
    }
  })

  return bots
}

const getCrawlers = () => {
  let crawlers = []
  const files = fs.readdirSync(crawlersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      crawlers.push(fs.readJsonSync(crawlersPath + '/' + file))
    }
  })

  return crawlers
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

const getProductHistory = (productId) => {
  const productHistoryPath = productsPath + '/' + productId + '-history.json'

  let productHistory = []

  try {
    productHistory = fs.readJsonSync(productHistoryPath)
  } catch (err) {
    return []
  }

  return productHistory
}

const getUserProducts = (userId) => {
  const userProductsPath = usersPath + '/' + userId + '/products.json'

  const products = fs.readJsonSync(userProductsPath)

  return products.products
}

const getProductSubscriptions = (productId) => {
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

const getUserProductSubscriptions = (userId, productId) => {
  const productSubscriptions = getProductSubscriptions(productId)

  return productSubscriptions.filter(
    (subscription) => subscription.user_id === userId
  )
}

async function main() {
  console.log(`Start migrating...`)

  const deleteUserProductSubscription =
    prisma.userProductSubscription.deleteMany()
  const deleteProductQueue = prisma.productQueue.deleteMany()
  const deleteUserProduct = prisma.userProduct.deleteMany()
  const deleteProductHistory = prisma.productHistory.deleteMany()
  const deleteProduct = prisma.product.deleteMany()
  const deleteUser = prisma.user.deleteMany()
  const deleteCrawler = prisma.crawler.deleteMany()
  const deleteBot = prisma.bot.deleteMany()

  await prisma.$transaction([
    deleteUserProductSubscription,
    deleteProductQueue,
    deleteUserProduct,
    deleteProductHistory,
    deleteProduct,
    deleteUser,
    deleteCrawler,
    deleteBot,
  ])

  // TODO: Добавить проверку, что все данные из файлов загрузились
  const oldBots = getBots()

  for (const data of oldBots) {
    console.log(`Processing bot ${data.id}`)

    await prisma.bot.create({ data: data })
  }

  // TODO: Добавить проверку, что все данные из файлов загрузились
  const oldCrawlers = getCrawlers()

  const crawlers = []

  for (const data of oldCrawlers) {
    console.log(`Processing crawler ${data.id}`)

    const crawler = await prisma.crawler.create({ data: data })

    crawlers.push(crawler)
  }

  // TODO: Добавить проверку, что все данные из файлов загрузились
  const oldProducts = getProducts()

  for (const data of oldProducts) {
    console.log(`Processing product ${data.id}`)

    const item = await prisma.product.create({
      data: data,
    })

    const productHistory = getProductHistory(item.id)
    for (const history of productHistory) {
      const {
        original_price,
        discount_price,
        in_stock,
        status,
        title,
        crawler_id,
        created_at,
      } = history

      await prisma.productHistory.create({
        data: {
          product_id: item.id,
          original_price,
          discount_price,
          in_stock,
          status,
          title: title.slice(0, 500),
          crawler_id: crawler_id || crawlers[0].id,
          created_at,
        },
      })
    }
  }

  // TODO: Добавить проверку, что все данные из файлов загрузились
  const oldUsers = getUsers()

  for (const data of oldUsers) {
    console.log(`Processing user ${data.id}`)

    const item = await prisma.user.create({
      data: data,
    })

    const userProducts = getUserProducts(item.id)
    for (const userProduct of userProducts) {
      const { id: productId, favorited, price, created_at } = userProduct

      await prisma.userProduct.create({
        data: {
          user_id: item.id,
          product_id: productId,
          price,
          favorited,
          created_at,
        },
      })

      const userProductSubscriptions = getUserProductSubscriptions(
        item.id,
        productId
      )

      for (const userProductSubscription of userProductSubscriptions) {
        await prisma.userProductSubscription.create({
          data: userProductSubscription,
        })
      }
    }
  }

  console.log(`Migrating finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
