import { validate } from 'uuid'
import { isValidObject } from './helpers'

export const isEmptyString = (string) => {
  return (
    typeof string === 'undefined' ||
    string === null ||
    string.toString().trim().length == 0
  )
}

export const isNotDefined = (value) => {
  return typeof value === 'undefined' || value === null
}

export const isValidUUID = (value) => {
  return validate(value)
}

export const validateUserId = (userId) => {
  if (isEmptyString(userId)) {
    throw new Error('Не заполнен userId')
  }

  if (!isValidUUID(userId)) {
    throw new Error('ID пользователя должен быть UUID')
  }
}

export const validateProductId = (productId) => {
  if (isEmptyString(productId)) {
    throw new Error('Не заполнен productId')
  }

  if (!isValidUUID(productId)) {
    throw new Error('ID товара должен быть UUID')
  }
}

export const validateProductsGroupId = (productsGroupId) => {
  if (isEmptyString(productsGroupId)) {
    throw new Error('Не заполнен productsGroupId')
  }

  if (!isValidUUID(productsGroupId)) {
    throw new Error('ID группы товаров пользователя должен быть UUID')
  }
}

export const validateUserProductId = (userProductId) => {
  if (isEmptyString(userProductId)) {
    throw new Error('Не заполнен userProductId')
  }

  if (!isValidUUID(userProductId)) {
    throw new Error('ID товара пользователя должен быть UUID')
  }
}

export const isValidUser = (user) => {
  if (!isValidObject(user)) {
    return false
  }

  if (!isValidUUID(user.id)) {
    return false
  }

  if (isEmptyString(user.login)) {
    return false
  }

  return true
}
