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

export const isNumber = (value) => {
  if (typeof value === 'number') return true
  if (typeof value !== 'string') return false

  return !isNaN(value) && !isNaN(parseFloat(value))
}

export const isPositiveFloat = (value) => {
  return parseFloat(value) > 0.0
}

// TODO: Добавить тесты
export const isValidUUID = (value) => {
  return validate(value)
}

// TODO: Добавить тесты
export const validateUserId = (userId) => {
  if (isEmptyString(userId)) {
    throw new Error('Не заполнен userId')
  }

  if (!isValidUUID(userId)) {
    throw new Error('ID пользователя должен быть UUID')
  }
}

// TODO: Добавить тесты
export const validateProductId = (productId) => {
  if (isEmptyString(productId)) {
    throw new Error('Не заполнен productId')
  }

  if (!isValidUUID(productId)) {
    throw new Error('ID товара должен быть UUID')
  }
}

// TODO: Добавить тесты
export const validateProductsGroupId = (productsGroupId) => {
  if (isEmptyString(productsGroupId)) {
    throw new Error('Не заполнен productsGroupId')
  }

  if (!isValidUUID(productsGroupId)) {
    throw new Error('ID группы товаров пользователя должен быть UUID')
  }
}

// TODO: Добавить тесты
export const validateUserProductId = (userProductId) => {
  if (isEmptyString(userProductId)) {
    throw new Error('Не заполнен userProductId')
  }

  if (!isValidUUID(userProductId)) {
    throw new Error('ID товара пользователя должен быть UUID')
  }
}

// TODO: Добавить тесты
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

// TODO: Добавить тесты
export const validatePositivePrice = (price) => {
  if (isEmptyString(price)) {
    throw new Error('Не заполнен price')
  }

  if (!isNumber(price)) {
    throw new Error('Price должен быть числом')
  }

  if (!isPositiveFloat(price)) {
    throw new Error('Price должен быть больше нуля')
  }

  return true
}
