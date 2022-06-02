import { deleteWithToken } from './fetcher'

export async function removeProductFromUser(token, productId) {
  return await deleteWithToken(`/api/v1/products/${productId}`, token)
}
