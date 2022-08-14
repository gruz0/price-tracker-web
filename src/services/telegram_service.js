import { TelegramRepository as repo } from '../repositories/telegram_repository'
import { UserRepository } from '../repositories/user_repository'
import { getTelegramAccountsSubscribedToProductChangeStatusToInStock } from './products'

const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN
const service_products_url = process.env.SERVICE_PRODUCTS_URL
const telegram_tech_group_id = process.env.TELEGRAM_TECH_GROUP_ID

const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(telegram_bot_token)

export const TelegramService = {
  // TODO: Добавить тесты
  // TODO: Добавить сюда Sentry, что сообщение не доставлено в Telegram
  productIsInStock: async (product, price) => {
    const usersWithTelegramAccount =
      await getTelegramAccountsSubscribedToProductChangeStatusToInStock(
        product.id
      )

    if (usersWithTelegramAccount.length === 0) {
      return
    }

    for (const user of usersWithTelegramAccount) {
      const message =
        `Добавленный вами товар [${product.title}](${product.url}) появился в наличии!\n\n` +
        `Текущая цена товара: ${price}.\n` +
        `[Карточка товара в Chartik](${service_products_url}/${product.id}).`

      await repo.addMessageToUser(user.id, message)

      if (process.env.NODE_ENV !== 'test') {
        bot.sendMessage(user.telegram_account, message, {
          parse_mode: 'markdown',
        })
      }
    }
  },

  // TODO: Добавить тесты
  // TODO: Добавить сюда Sentry, что сообщение не доставлено в Telegram
  productFirstTimeIsInStock: async (product, price) => {
    const usersWithTelegramAccount =
      await UserRepository.findUsersWithTelegramAccountWhoHasProductWithoutPrice(
        product.id
      )

    if (usersWithTelegramAccount.length === 0) {
      return
    }

    for (const user of usersWithTelegramAccount) {
      const message =
        `Добавленный вами товар [${product.title}](${product.url}) первый раз появился в наличии!\n\n` +
        `Текущая цена товара: ${price}.\n` +
        `[Карточка товара в Chartik](${service_products_url}/${product.id}).`

      await repo.addMessageToUser(user.id, message)

      if (process.env.NODE_ENV !== 'test') {
        bot.sendMessage(user.telegram_account, message, {
          parse_mode: 'markdown',
        })
      }
    }
  },

  // TODO: Добавить тесты
  // TODO: Добавить сюда Sentry, что сообщение не доставлено в Telegram
  newUserRegistration: async (userId) => {
    const message =
      `***Зарегистрирован новый пользователь!***\n` + `ID: ${userId}`

    await repo.addMessageToUser(userId, message)

    if (process.env.NODE_ENV === 'test') {
      return
    }

    bot.sendMessage(telegram_tech_group_id, message, { parse_mode: 'markdown' })
  },
}
