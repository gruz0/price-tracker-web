const fs = require('fs-extra')
const uuid = require('uuid')
import crypto from 'crypto'

import { usersPath } from './const'
import { isEmptyString } from '../lib/validators'

const encryptPassword = (userId, login, password) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}${login}${password}`)
    .digest('hex')
}

const getUsers = () => {
  let users = []
  const files = fs.readdirSync(usersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const { id, login, password, token, telegram_account } = fs.readJsonSync(
        usersPath + '/' + file
      )

      users.push({ id, login, password, token, telegram_account })

      return
    }
  })

  return users
}

export const getUsersById = (ids) => {
  const users = getUsers()

  const matchedUsers = users.filter((user) => ids.includes(user.id))

  return matchedUsers.map((user) => buildUser(user))
}

export const getUserByToken = (token) => {
  const users = getUsers()

  const user = users.find((u) => {
    return u.token === token
  })

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const findUserByLoginAndPassword = (login, password) => {
  const users = getUsers()

  const user = users.find((u) => {
    return (
      u.login.toLowerCase().trim() === login.toLowerCase().trim() &&
      u.password === encryptPassword(u.id, u.login, password)
    )
  })

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const isUserExists = (login) => {
  const users = getUsers()

  return users.find((u) => u.login.toLowerCase() === login.toLowerCase())
}

export const findUserByTelegramAccount = (telegram_account) => {
  if (isEmptyString(telegram_account)) {
    throw new Error(`Не заполнен telegram_account`)
  }

  const users = getUsers()

  const usersWithTelegramAccounts = users.filter(
    (u) => !isEmptyString(u.telegram_account)
  )

  if (usersWithTelegramAccounts.length === 0) {
    return null
  }

  return usersWithTelegramAccounts.find(
    (u) => u.telegram_account.toString().trim() === telegram_account.trim()
  )
}

export const findUser = (id) => {
  const users = getUsers()

  const user = users.find((u) => {
    return u.id === id
  })

  if (!user) {
    return null
  }

  return buildUser(user)
}

// Используется только для того, чтобы получить хеш пароля.
const findRawUser = (id) => {
  const users = getUsers()

  const user = users.find((u) => {
    return u.id === id
  })

  if (!user) {
    return null
  }

  return user
}

export const createUser = (login, password) => {
  if (isEmptyString(login)) {
    throw new Error('Логин пустой')
  }

  if (isEmptyString(password)) {
    throw new Error('Пароль пустой')
  }

  const userId = uuid.v4()
  const userToken = uuid.v4()
  const lowercasedLogin = login.toLowerCase().trim()

  const newUser = buildUser({
    id: userId,
    login: lowercasedLogin,
    token: userToken,
    created_at: new Date(),
    updated_at: new Date(),
  })

  const userPath = usersPath + '/' + userId + '.json'

  fs.writeJsonSync(
    userPath,
    {
      ...newUser,
      password: encryptPassword(userId, lowercasedLogin, password),
    },
    { spaces: 2 }
  )

  const userDirectoryPath = usersPath + '/' + userId

  fs.mkdirSync(userDirectoryPath)

  fs.writeJsonSync(
    userDirectoryPath + '/products.json',
    {
      products: [],
    },
    { spaces: 2 }
  )

  return buildUser(newUser)
}

export const updateUserPasswordAndToken = (userId, newPassword) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  if (isEmptyString(newPassword)) {
    throw new Error('Новый пароль пустой')
  }

  const user = findUser(userId)

  if (!user) {
    throw new Error('Пользователь по ID не найден')
  }

  const userAttributes = {
    ...user,
    token: uuid.v4(),
    updated_at: new Date(),
  }

  const userPath = usersPath + '/' + userId + '.json'

  fs.writeJsonSync(
    userPath,
    {
      ...userAttributes,
      password: encryptPassword(userId, user.login, newPassword),
    },
    { spaces: 2 }
  )

  return buildUser(userAttributes)
}

export const updateUserToken = (userId) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  const user = findRawUser(userId)

  if (!user) {
    throw new Error('Пользователь по ID не найден')
  }

  const userAttributes = {
    ...user,
    token: uuid.v4(),
    updated_at: new Date(),
  }

  const userPath = usersPath + '/' + userId + '.json'

  fs.writeJsonSync(userPath, userAttributes, { spaces: 2 })

  return buildUser(userAttributes)
}

export const updateUserTelegramAccount = (userId, telegramAccount) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  const user = findRawUser(userId)

  if (!user) {
    throw new Error('Пользователь по ID не найден')
  }

  const userAttributes = {
    ...user,
    telegram_account: telegramAccount,
    updated_at: new Date(),
  }

  const userPath = usersPath + '/' + userId + '.json'

  fs.writeJsonSync(userPath, userAttributes, { spaces: 2 })

  return buildUser(userAttributes)
}

const buildUser = ({
  id,
  login,
  token,
  created_at,
  updated_at,
  telegram_account,
}) => {
  return {
    id,
    login: login.toLowerCase().trim(),
    token,
    created_at,
    updated_at,
    telegram_account,
  }
}
