const fs = require('fs-extra')

import { encryptPassword } from '../lib/auth'
import { usersPath } from './const'

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
