export const fetcher = async (url) => {
  const headers = { 'Content-Type': 'application/json' }

  const payload = {
    method: 'GET',
    headers,
    mode: 'cors',
  }

  const res = await fetch(url, payload)

  if (!res.ok) {
    const error = new Error('Ошибка при загрузке данных из API')

    // Attach extra info to the error object.
    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}

export const fetchWithToken = async (url, token) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const payload = {
    method: 'GET',
    headers,
    mode: 'cors',
  }

  const res = await fetch(url, payload)

  if (!res.ok) {
    const error = new Error('Ошибка при загрузке данных из API')

    // Attach extra info to the error object.
    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}

export const postWithToken = async (url, token, body = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const payload = {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    mode: 'cors',
  }

  const res = await fetch(url, payload)

  if (!res.ok) {
    const error = new Error('Ошибка при отправке данных в API')

    // Attach extra info to the error object.
    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}

export const deleteWithToken = async (url, token) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const payload = {
    method: 'DELETE',
    headers,
    mode: 'cors',
  }

  const res = await fetch(url, payload)

  if (!res.ok) {
    const error = new Error('Ошибка при отправке данных в API')

    // Attach extra info to the error object.
    error.info = await res.json()
    error.status = res.status

    throw error
  }

  return res.json()
}
