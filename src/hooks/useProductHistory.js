import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

export default function useProductHistory(id, token) {
  const { data, error } = useSWR(
    id && token ? [`/api/v1/products/${id}/history`, token] : null,
    fetchWithToken
  )

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
