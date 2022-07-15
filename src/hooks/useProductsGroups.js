import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

export default function useProductsGroups(token) {
  const { data, error } = useSWR(
    token ? ['/api/v1/products_groups', token] : null,
    fetchWithToken
  )

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
