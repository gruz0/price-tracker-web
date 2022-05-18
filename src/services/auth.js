const fs = require('fs-extra')
const uuid = require('uuid')

import { encryptPassword } from '../lib/auth'
import { usersPath } from './const'
import { isEmptyString } from '../lib/validators'

const getUsers = () => {
  let users = []
  const files = fs.readdirSync(usersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const { id, login, password, token } = fs.readJsonSync(
        usersPath + '/' + file
      )

      users.push({ id, login, password, token })

      return
    }
  })

  return users
}

export const getUserByToken = (token) => {
  let user
  const users = getUsers()

  users.forEach((u) => {
    if (u.token === token) {
      user = u

      return
    }
  })

  return user
}

export const findUserByLoginAndPassword = (login, password) => {
  const users = getUsers()

  const user = users.find((u) => {
    return (
      u.login.toLowerCase() === login.toLowerCase() &&
      u.password === encryptPassword(u.id, u.login, password)
    )
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    login: user.login,
    token: user.token,
  }
}

export const isUserExists = (login) => {
  const users = getUsers()

  return users.find((u) => u.login.toLowerCase() === login.toLowerCase())
}

export const findUser = (id) => {
  let user
  const users = getUsers()

  users.forEach((u) => {
    if (u.id === id) {
      user = u

      return
    }
  })

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

  const newUser = {
    id: userId,
    login: login,
    token: userToken,
    created_at: new Date(),
  }

  const userPath = usersPath + '/' + userId + '.json'

  fs.writeJsonSync(
    userPath,
    {
      ...newUser,
      password: encryptPassword(userId, login, password),
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

  return newUser
}
