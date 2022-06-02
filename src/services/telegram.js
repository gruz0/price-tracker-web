import { getProductHistory, getProductSubscriptions } from './products'
import { getUsersById } from './auth'

const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN
const service_products_url = process.env.SERVICE_PRODUCTS_URL
const telegram_tech_group_id = process.env.TELEGRAM_TECH_GROUP_ID

const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(telegram_bot_token)

// TODO: Добавить сюда проверки, что сообщение доставлено в Telegram
export const sendMessageToTelegramThatProductIsInStock = ({
  product,
  status,
  price,
  in_stock,
}) => {
  if (status !== 'ok') return
  if (!price) return
  if (!in_stock) return

  const productHistory = getProductHistory(product.id)

  if (productHistory.length === 0) return

  const lastProductHistory = productHistory[0]

  if (lastProductHistory.in_stock) return

  const productSubscriptions = getProductSubscriptions(product.id)

  if (productSubscriptions.length === 0) return

  const inStockSubscriptions = productSubscriptions.filter(
    (productSubscription) =>
      productSubscription.subscription_type === 'on_change_status_to_in_stock'
  )

  if (inStockSubscriptions.length === 0) return

  const userIds = inStockSubscriptions.map(
    (subscription) => subscription.user_id
  )

  const users = getUsersById(userIds)

  if (users.length === 0) return

  const telegramAccounts = users.map((u) => u.telegram_account)

  if (telegramAccounts.length === 0) return

  telegramAccounts.forEach((telegramAccount) => {
    bot.sendMessage(
      telegramAccount,
      `Добавленный вами товар [${product.title}](${product.url}) появился в наличии!\n\n` +
        `Текущая цена товара: ${price}.\n` +
        `[Карточка товара в Chartik](${service_products_url}/${product.id}).`,
      {
        parse_mode: 'markdown',
      }
    )
  })
}

export const newUserRegistration = (userId) => {
  bot.sendMessage(
    telegram_tech_group_id,
    `***Зарегистрирован новый пользователь!***\n` + `ID: ${userId}`,
    {
      parse_mode: 'markdown',
    }
  )
}
