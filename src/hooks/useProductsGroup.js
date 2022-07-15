import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

export default function useProductsGroup(id, token) {
  const { data, error } = useSWR(
    id && token ? [`/api/v1/products_groups/${id}`, token] : null,
    fetchWithToken
  )

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
