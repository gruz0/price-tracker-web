import { getTelegramAccountsSubscribedToProductChangeStatusToInStock } from './products'

const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN
const service_products_url = process.env.SERVICE_PRODUCTS_URL
const telegram_tech_group_id = process.env.TELEGRAM_TECH_GROUP_ID

const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(telegram_bot_token)

// TODO: Добавить сюда проверки, что сообщение доставлено в Telegram
export const sendMessageToTelegramThatProductIsInStock = async (
  product,
  price
) => {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const telegramAccounts =
    await getTelegramAccountsSubscribedToProductChangeStatusToInStock(
      product.id
    )

  if (telegramAccounts.length === 0) {
    return
  }

  const flattenTelegramAccounts = telegramAccounts.map(
    (account) => account.telegram_account
  )

  flattenTelegramAccounts.forEach((telegramAccount) => {
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
  if (process.env.NODE_ENV === 'test') {
    return
  }

  bot.sendMessage(
    telegram_tech_group_id,
    `***Зарегистрирован новый пользователь!***\n` + `ID: ${userId}`,
    {
      parse_mode: 'markdown',
    }
  )
}
