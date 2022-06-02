import { postWithToken, deleteWithToken } from './fetcher'

export async function subscribeUserToProductEvent(
  token,
  productId,
  subscriptionType,
  payload = {}
) {
  return await postWithToken(
    `/api/v1/products/${productId}/subscriptions`,
    token,
    {
      subscription_type: subscriptionType,
      payload,
    }
  )
}

export async function unsubscribeUserFromProductEvent(
  token,
  productId,
  subscriptionId
) {
  return await deleteWithToken(
    `/api/v1/products/${productId}/subscriptions/${subscriptionId}`,
    token
  )
}

export async function removeAllProductSubscriptionsFromUser(token, productId) {
  return await deleteWithToken(
    `/api/v1/products/${productId}/subscriptions`,
    token
  )
}
