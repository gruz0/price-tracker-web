import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

export default function useProduct(id, token) {
  const { data, error } = useSWR(
    id ? [`/api/v1/products/${id}`, token] : null,
    fetchWithToken
  )

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
