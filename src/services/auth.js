import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'

const uuid = require('uuid')

import { encryptPassword } from '../lib/security'
import { isEmptyString } from '../lib/validators'

const findUserBy = async (condition) => {
  return await prisma.user.findUnique({
    where: condition,
  })
}

const _findUserByLogin = async (login) => {
  if (isEmptyString(login)) {
    throw new Error('Не заполнен login')
  }

  return await findUserBy({ login: login.toLowerCase().trim() })
}

const updateUser = async (userId, attributes) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  const hasAttributes =
    attributes &&
    !(Object.keys(attributes).length === 0 && attributes.constructor === Object)

  if (!hasAttributes) {
    throw new Error('Атрибуты для обновления не заполнены')
  }

  return await prisma.user.update({
    where: { id: userId },
    data: attributes,
  })
}

export const findUserById = async (id) => {
  const user = await findUserBy({ id: id })

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const findUserByToken = async (token) => {
  if (isEmptyString(token)) {
    throw new Error('Не заполнен token')
  }

  const user = await findUserBy({ token: token.toLowerCase().trim() })

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const findUserByApiKey = async (api_key) => {
  if (isEmptyString(api_key)) {
    throw new Error('Не заполнен api_key')
  }

  const user = await findUserBy({ api_key: api_key.toLowerCase().trim() })

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const findUserByLogin = async (login) => {
  const user = await _findUserByLogin(login)

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const findUserByLoginAndPassword = async (login, password) => {
  const user = await _findUserByLogin(login)

  if (!user) {
    return null
  }

  if (user.password !== encryptPassword(user.id, login, password)) {
    return null
  }

  return buildUser(user)
}

export const findUserByTelegramAccount = async (telegramAccount) => {
  if (isEmptyString(telegramAccount)) {
    throw new Error(`Не заполнен telegramAccount`)
  }

  // NOTE: Здесь не используем findUnique, потому что telegram_account это nullable-поле без уникального ключа в базе
  const user = await prisma.user.findFirst({
    where: {
      telegram_account: telegramAccount.toLowerCase().trim(),
    },
  })

  if (!user) {
    return null
  }

  return buildUser(user)
}

export const createUser = async (login, password, telegramAccount) => {
  if (isEmptyString(login)) {
    throw new Error('Логин пустой')
  }

  if (isEmptyString(password)) {
    throw new Error('Пароль пустой')
  }

  const userId = uuid.v4()
  const cleanLogin = login.toLowerCase().trim()

  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        login: cleanLogin,
        password: encryptPassword(userId, cleanLogin, password),
        telegram_account: isEmptyString(telegramAccount)
          ? null
          : telegramAccount.toString().toLowerCase().trim(),
      },
    })

    return buildUser(user)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (e.code === 'P2002') {
        throw new Error(`Пользователь с логином ${cleanLogin} уже существует`)
      }
    }
    throw e
  }
}

export const updateUserPasswordAndToken = async (userId, newPassword) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  const user = await findUserById(userId)

  if (!user) {
    throw new Error('Пользователь по ID не найден')
  }

  if (isEmptyString(newPassword)) {
    throw new Error('Новый пароль пустой')
  }

  const updatedUser = await updateUser(userId, {
    token: uuid.v4(),
    password: encryptPassword(user.id, user.login, newPassword),
  })

  return buildUser(updatedUser)
}

export const updateUserToken = async (userId) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  const user = await findUserById(userId)

  if (!user) {
    throw new Error('Пользователь по ID не найден')
  }

  const updatedUser = await updateUser(userId, {
    token: uuid.v4(),
    last_sign_in_at: new Date(),
  })

  return buildUser(updatedUser)
}

export const updateUserTelegramAccount = async (userId, telegramAccount) => {
  if (isEmptyString(userId)) {
    throw new Error('ID пользователя пустой')
  }

  const user = await findUserById(userId)

  if (!user) {
    throw new Error('Пользователь по ID не найден')
  }

  const updatedUser = await updateUser(userId, {
    telegram_account: isEmptyString(telegramAccount)
      ? null
      : telegramAccount.toString().toLowerCase().trim(),
  })

  return buildUser(updatedUser)
}

const buildUser = ({
  id,
  login,
  token,
  api_key,
  created_at,
  updated_at,
  telegram_account,
}) => {
  return {
    id,
    login: login.toLowerCase().trim(),
    token,
    api_key,
    created_at,
    updated_at,
    telegram_account,
  }
}
