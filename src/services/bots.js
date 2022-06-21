import prisma from '../lib/prisma'

export const findBotByToken = async (token) => {
  return await prisma.bot.findUnique({ where: { token: token } })
}
