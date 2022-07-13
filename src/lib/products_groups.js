import { postWithToken, deleteWithToken } from './fetcher'

export async function createNewProductsGroup(token, title) {
  return await postWithToken(`/api/v1/products_groups`, token, { title })
}

export async function addUserProductToProductsGroup(
  token,
  productsGroupId,
  userProductId
) {
  return await postWithToken(
    `/api/v1/products_groups/${productsGroupId}`,
    token,
    {
      user_product_id: userProductId,
    }
  )
}

export async function removeProductsGroup(token, productsGroupId) {
  return await deleteWithToken(
    `/api/v1/products_groups/${productsGroupId}`,
    token
  )
}
