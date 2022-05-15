// NOTE: https://dockyard.com/blog/2020/02/14/you-probably-don-t-need-moment-js-anymore

// NOTE: date in iso8601 format
export function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU')
}

// NOTE: date in iso8601 format
export function formatTime(date) {
  const options = {
    hour: 'numeric',
    minute: 'numeric',
  }
  return new Date(date).toLocaleTimeString('ru-RU', options)
}

// NOTE: date in iso8601 format
export function formatDateTimeWithoutYear(date) {
  const options = {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }
  return new Date(date).toLocaleDateString('ru-RU', options)
}

// NOTE: date in iso8601 format
export function formatDateTime(date) {
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }
  return new Date(date).toLocaleDateString('ru-RU', options)
}
