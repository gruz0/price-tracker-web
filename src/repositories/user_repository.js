import prisma from '../lib/prisma'

export const UserRepository = {
  getUserById: async (userId) => {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })
  },
}
