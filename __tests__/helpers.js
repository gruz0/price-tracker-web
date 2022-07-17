import prisma from '../src/lib/prisma'
import { createMocks } from 'node-mocks-http'

export const cleanDatabase = async (prisma) => {
  const deleteUserProductsGroupItem = prisma.userProductsGroupItem.deleteMany()
  const deleteUserProductsGroup = prisma.userProductsGroup.deleteMany()
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
    deleteUserProductsGroupItem,
    deleteUserProductsGroup,
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

export const ensureUserLastActivityHasBeenUpdated = async (user) => {
  const existedUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  })

  expect(+existedUser.last_activity_at).toBeGreaterThan(+user.last_activity_at)
}
