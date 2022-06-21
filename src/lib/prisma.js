import { PrismaClient } from '@prisma/client'

let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      errorFormat: 'pretty',
      log: [{ level: 'query', emit: 'event' }],
    })
  }
  prisma = global.prisma

  if (typeof process.env.STDOUT_SQL_QUERIES !== 'undefined') {
    prisma.$on('query', (e) => {
      console.log(e)
    })
  }
}

export default prisma
