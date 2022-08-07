import {
  isEmptyString,
  isNotDefined,
  isNumber,
  isPositiveFloat,
} from '../../src/lib/validators'

describe('isEmptyString', () => {
  describe('when undefined', () => {
    test('returns true', () => {
      expect(isEmptyString(undefined)).toEqual(true)
    })
  })

  describe('when null', () => {
    test('returns true', () => {
      expect(isEmptyString(null)).toEqual(true)
    })
  })

  describe('when empty string', () => {
    test('returns true', () => {
      expect(isEmptyString(' ')).toEqual(true)
    })
  })

  describe('when not empty string', () => {
    test('returns false', () => {
      expect(isEmptyString(' q ')).toEqual(false)
    })
  })

  describe('when number', () => {
    test('returns false', () => {
      expect(isEmptyString(1)).toEqual(false)
    })
  })
})

describe('isNotDefined', () => {
  describe('when undefined', () => {
    test('returns true', () => {
      expect(isNotDefined(undefined)).toEqual(true)
    })
  })

  describe('when null', () => {
    test('returns true', () => {
      expect(isNotDefined(null)).toEqual(true)
    })
  })

  describe('when empty string', () => {
    test('returns false', () => {
      expect(isNotDefined(' ')).toEqual(false)
    })
  })

  describe('when not empty string', () => {
    test('returns false', () => {
      expect(isNotDefined(' q ')).toEqual(false)
    })
  })

  describe('when number', () => {
    test('returns false', () => {
      expect(isNotDefined(1)).toEqual(false)
    })
  })
})

describe('isNumber', () => {
  describe('when undefined', () => {
    test('returns false', () => {
      expect(isNumber(undefined)).toEqual(false)
    })
  })

  describe('when null', () => {
    test('returns false', () => {
      expect(isNumber(null)).toEqual(false)
    })
  })

  describe('when empty string', () => {
    test('returns false', () => {
      expect(isNumber(' ')).toEqual(false)
    })
  })

  describe('when not empty string', () => {
    test('returns false', () => {
      expect(isNumber(' q ')).toEqual(false)
    })
  })

  describe('when number', () => {
    test('returns true', () => {
      expect(isNumber(1)).toEqual(true)
    })
  })

  describe('when stringified number', () => {
    test('returns true', () => {
      expect(isNumber('1')).toEqual(true)
    })
  })
})

describe('isPositiveFloat', () => {
  describe('when undefined', () => {
    test('returns false', () => {
      expect(isPositiveFloat(undefined)).toEqual(false)
    })
  })

  describe('when null', () => {
    test('returns false', () => {
      expect(isPositiveFloat(null)).toEqual(false)
    })
  })

  describe('when empty string', () => {
    test('returns false', () => {
      expect(isPositiveFloat(' ')).toEqual(false)
    })
  })

  describe('when not empty string', () => {
    test('returns false', () => {
      expect(isPositiveFloat(' q ')).toEqual(false)
    })
  })

  describe('when zero', () => {
    test('returns false', () => {
      expect(isPositiveFloat(0)).toEqual(false)
    })
  })

  describe('when positive float', () => {
    test('returns true', () => {
      expect(isPositiveFloat(0.01)).toEqual(true)
    })
  })

  describe('when number', () => {
    test('returns true', () => {
      expect(isPositiveFloat(1)).toEqual(true)
    })
  })

  describe('when stringified float', () => {
    test('returns true', () => {
      expect(isPositiveFloat('0.01')).toEqual(true)
    })
  })
})

describe('isValidUUID', () => {
  test.todo('not implemented')
})

describe('validateUserId', () => {
  test.todo('not implemented')
})

describe('validateProductId', () => {
  test.todo('not implemented')
})

describe('validateProductsGroupId', () => {
  test.todo('not implemented')
})

describe('validateUserProductId', () => {
  test.todo('not implemented')
})

describe('isValidUser', () => {
  test.todo('not implemented')
})

describe('validatePositivePrice', () => {
  test.todo('not implemented')
})
