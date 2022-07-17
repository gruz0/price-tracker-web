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
}
