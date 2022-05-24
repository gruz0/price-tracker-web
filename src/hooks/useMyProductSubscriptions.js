import useSWR from 'swr'
import { fetchWithToken } from '../lib/fetcher'

// FIXME: Этот файл надо переписать по аналогии с src/lib/settings.js,
// чтобы вызывать функцию внутри useEffect, а не использовать хук,
// потому что иначе нет вариантов без перезагрузки страницы обновить состояние чекбоксов
// с подписками в карточке товара
//
// В идеале поместить его вообще в src/lib/subscriptions.js, там именно такие функции находятся.
export default function useMyProductSubscriptions(id, token) {
  const { data, error } = useSWR(
    id && token ? [`/api/v1/products/${id}/subscriptions`, token] : null,
    fetchWithToken
  )

  return {
    data,
    isLoading: !error && !data,
    error,
  }
}
