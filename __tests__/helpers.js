import { createMocks } from 'node-mocks-http'

export const cleanDatabase = async (prisma) => {
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
}

export const parseJSON = (res) => {
  return JSON.parse(res._getData())
}

export const hourInMilliseconds = 60 * 60 * 1000

export const mockPOSTRequest = (body = {}) => {
  return createMocks({
    method: 'POST',
    body: body,
  })
}

export const mockGETRequest = () => {
  return createMocks({ method: 'GET' })
}

export const mockAuthorizedGETRequest = (token, query = {}) => {
  return createMocks({
    method: 'GET',
    query: query,
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
}

export const mockAuthorizedPOSTRequest = (token, query = {}, body = {}) => {
  return createMocks({
    method: 'POST',
    query: query,
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: body,
  })
}

export const mockAuthorizedPUTRequest = (token, query = {}, body = {}) => {
  return createMocks({
    method: 'PUT',
    query: query,
    headers: {
      authorization: `Bearer ${token}`,
    },
    body: body,
  })
}

export const mockAuthorizedDELETERequest = (token, query = {}) => {
  return createMocks({
    method: 'DELETE',
    query: query,
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
}
