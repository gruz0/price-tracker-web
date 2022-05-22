import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

export default function useProducts(token) {
  const { data, error } = useSWR(
    token ? ['/api/v1/products', token] : null,
    fetchWithToken
  )

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
