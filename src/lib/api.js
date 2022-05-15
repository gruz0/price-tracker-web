import { postWithToken } from './fetcher'

export async function addProduct(token, url) {
  const response = await postWithToken('/api/v1/products', token, { url })

  return response
}
