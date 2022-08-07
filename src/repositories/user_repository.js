import prisma from '../lib/prisma'

export const UserRepository = {
  getUserById: async (userId) => {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
  },

  // FIXME: It should be refactored after fixing this issue: https://github.com/prisma/prisma/issues/5598
  updateLastActivity: async (userId) => {
    await prisma.$executeRaw`UPDATE users SET last_activity_at = NOW() WHERE id = ${userId}::UUID`
  },

  findUsersWithTelegramAccountWhoHasProductWithoutPrice: async (productId) => {
    return await prisma.$queryRaw`
      SELECT u.id, u.telegram_account
      FROM user_products up
      JOIN users u ON u.id = up.user_id
      WHERE up.product_id = ${productId}::UUID
        AND u.telegram_account IS NOT NULL
        AND u.telegram_account != ''
        AND up.price = 0
    `
  },
}
