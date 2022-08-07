import prisma from '../lib/prisma'

export const TelegramRepository = {
  addMessageToUser: async (userId, message) => {
    return await prisma.telegramMessage.create({
      data: {
        user_id: userId,
        message: message,
      },
    })
  },
}
