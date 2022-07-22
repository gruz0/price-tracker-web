import { ProductRepository as repo } from '../repositories/product_repository'

export const CrawlersService = {
  getOutdatedProducts: async (lastUpdateInHours = 3, productsLimit = 20) => {
    return await repo.getOutdatedProducts(lastUpdateInHours, productsLimit)
  },
}
