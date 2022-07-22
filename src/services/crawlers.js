import prisma from '../lib/prisma'

const path = require('path')
const fs = require('fs-extra')

const uploadsPath = path.join(process.cwd(), '/public/uploads')

export const findCrawlerByToken = async (token) => {
  return await prisma.crawler.findUnique({ where: { token: token } })
}

export const addProductHistory = async (
  productId,
  { originalPrice, discountPrice, inStock, status, title, crawlerId } = {}
) => {
  return await prisma.productHistory.create({
    data: {
      product_id: productId,
      original_price: originalPrice,
      discount_price: discountPrice,
      in_stock: inStock,
      status,
      title,
      crawler_id: crawlerId,
    },
  })
}

export const findProductQueueForUser = async (url, urlHash, userId) => {
  return await prisma.productQueue.findUnique({
    where: {
      url_url_hash_requested_by_id: {
        url: url,
        url_hash: urlHash,
        requested_by_id: userId,
      },
    },
  })
}

export const createProduct = async ({ urlHash, shop, url, title }) => {
  return await prisma.product.create({
    data: {
      url_hash: urlHash,
      shop,
      url,
      title,
    },
  })
}

export const removeNewProductFromQueue = async (urlHash) => {
  return await prisma.productQueue.deleteMany({
    where: {
      url_hash: urlHash,
    },
  })
}

export const getNewProductsQueue = async (skipForCrawlerId = null) => {
  const productsQueue = await prisma.productQueue.findMany({
    where: {
      OR: [
        {
          skip_for_crawler_id: {
            not: skipForCrawlerId,
          },
        },
        {
          skip_for_crawler_id: null,
        },
      ],
    },
    orderBy: {
      url: 'asc',
    },
  })

  return productsQueue.map((product) => {
    return {
      url: product.url,
      url_hash: product.url_hash,
      requested_by: product.requested_by_id,
    }
  })
}

export const skipQueuedProductForCrawler = async (urlHash, crawlerId) => {
  return await prisma.productQueue.updateMany({
    where: { url_hash: urlHash },
    data: {
      skip_for_crawler_id: crawlerId,
    },
  })
}

export const moveProductImageToUploadsDirectory = (originalPath, imageName) => {
  const to = uploadsPath + '/' + imageName

  // Удаляем файл, если такой уже есть
  try {
    fs.unlinkSync(to)
  } catch (err) {}

  fs.moveSync(originalPath, to)
}

export const updateProductImage = async (productId, image) => {
  return await prisma.product.update({
    where: { id: productId },
    data: {
      image: image,
    },
  })
}
