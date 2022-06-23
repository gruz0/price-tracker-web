const { PrismaClient } = require('@prisma/client')
const uuid = require('uuid')
const crypto = require('crypto')

const prisma = new PrismaClient()

const encryptPassword = (userId, login, password) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}${login}${password}`)
    .digest('hex')
}

const firstUserId = uuid.v4()
const firstUserLogin = 'user1'
const firstUserPassword = 'password'

const crawlerData = {
  id: uuid.v4(),
  token: uuid.v4(),
  location: 'Somewhere',
}

const productsData = [
  {
    url_hash:
      '5a1bd092e39f5db1343ee3bd9d999212d34d654f3529f0ea7b43a7c383568e16',
    shop: 'ozon',
    url: 'https://www.ozon.ru/product/toksichnye-roditeli-kak-vernut-sebe-normalnuyu-zhizn-333336233/',
    title: 'Токсичные родители. Как вернуть себе нормальную жизнь',
  },
  {
    url_hash:
      'e7d8497085218ed3ccf35afebddd2660cfe806249f2253574e0df24a0c6b3eb7',
    shop: 'ozon',
    url: 'https://www.ozon.ru/product/razumnyy-investor-polnoe-rukovodstvo-po-stoimostnomu-investirovaniyu-28721447/',
    title:
      'Разумный инвестор: Полное руководство по стоимостному инвестированию | Грэм Бенджамин',
    history: {
      create: [
        {
          original_price: 1986.0,
          discount_price: 1490.1,
          in_stock: true,
          status: 'ok',
          title:
            'Разумный инвестор: Полное руководство по стоимостному инвестированию | Грэм Бенджамин',
          crawler_id: crawlerData.id,
        },
        {
          original_price: 1986.0,
          discount_price: 1490.1,
          in_stock: true,
          status: 'ok',
          title:
            'Разумный инвестор: Полное руководство по стоимостному инвестированию | Грэм Бенджамин',
          crawler_id: crawlerData.id,
        },
      ],
    },
  },
]

const usersData = [
  {
    id: firstUserId,
    login: firstUserLogin,
    password: encryptPassword(firstUserId, firstUserLogin, firstUserPassword),
    token: uuid.v4(),
  },
]

async function main() {
  console.log(`Start seeding ...`)

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

  await prisma.crawler.create({ data: crawlerData })

  await prisma.bot.create({
    data: {
      token: uuid.v4(),
      location: 'Somewhere',
    },
  })

  let products = []

  for (const item of productsData) {
    const product = await prisma.product.create({
      data: item,
    })

    products.push(product)

    console.log(`Created product with id: ${product.id}`)
  }

  let users = []

  for (const item of usersData) {
    const user = await prisma.user.create({
      data: item,
    })

    users.push(user)

    console.log(`Created user with id: ${user.id}`)
  }

  await prisma.userProduct.create({
    data: {
      user_id: users[0].id,
      product_id: products[0].id,
      price: 42.2,
      favorited: true,
    },
  })

  await prisma.userProduct.create({
    data: {
      user_id: users[0].id,
      product_id: products[1].id,
      price: 99.9,
      favorited: false,
    },
  })

  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
