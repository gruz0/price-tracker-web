import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

export default function useProducts(token) {
  const { data, error } = useSWR(['/api/v1/products', token], fetchWithToken)

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
