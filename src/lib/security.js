import crypto from 'crypto'
import { isEmptyString } from './validators'

// TODO: Добавить тесты
export const encryptPassword = (userId, login, password) => {
  if (isEmptyString(userId)) throw new Error('ID пользователя пустой')
  if (isEmptyString(login)) throw new Error('Логин пользователя пустой')
  if (isEmptyString(password)) throw new Error('Пароль пользователя пустой')

  return crypto
    .createHash('sha256')
    .update(`${userId}${login.toLowerCase().trim()}${password}`)
    .digest('hex')
}
