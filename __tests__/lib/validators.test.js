import {
  isEmptyString,
  isNotDefined,
  isNumber,
  isPositiveFloat,
} from '../../src/lib/validators'

describe('isEmptyString', () => {
  describe('when undefined', () => {
    it('returns true', () => {
      expect(isEmptyString(undefined)).toEqual(true)
    })
  })

  describe('when null', () => {
    it('returns true', () => {
      expect(isEmptyString(null)).toEqual(true)
    })
  })

  describe('when empty string', () => {
    it('returns true', () => {
      expect(isEmptyString(' ')).toEqual(true)
    })
  })

  describe('when not empty string', () => {
    it('returns false', () => {
      expect(isEmptyString(' q ')).toEqual(false)
    })
  })

  describe('when number', () => {
    it('returns false', () => {
      expect(isEmptyString(1)).toEqual(false)
    })
  })
})

describe('isNotDefined', () => {
  describe('when undefined', () => {
    it('returns true', () => {
      expect(isNotDefined(undefined)).toEqual(true)
    })
  })

  describe('when null', () => {
    it('returns true', () => {
      expect(isNotDefined(null)).toEqual(true)
    })
  })

  describe('when empty string', () => {
    it('returns false', () => {
      expect(isNotDefined(' ')).toEqual(false)
    })
  })

  describe('when not empty string', () => {
    it('returns false', () => {
      expect(isNotDefined(' q ')).toEqual(false)
    })
  })

  describe('when number', () => {
    it('returns false', () => {
      expect(isNotDefined(1)).toEqual(false)
    })
  })
})

describe('isNumber', () => {
  describe('when undefined', () => {
    it('returns false', () => {
      expect(isNumber(undefined)).toEqual(false)
    })
  })

  describe('when null', () => {
    it('returns false', () => {
      expect(isNumber(null)).toEqual(false)
    })
  })

  describe('when empty string', () => {
    it('returns false', () => {
      expect(isNumber(' ')).toEqual(false)
    })
  })

  describe('when not empty string', () => {
    it('returns false', () => {
      expect(isNumber(' q ')).toEqual(false)
    })
  })

  describe('when number', () => {
    it('returns true', () => {
      expect(isNumber(1)).toEqual(true)
    })
  })

  describe('when stringified number', () => {
    it('returns true', () => {
      expect(isNumber('1')).toEqual(true)
    })
  })
})

describe('isPositiveFloat', () => {
  describe('when undefined', () => {
    it('returns false', () => {
      expect(isPositiveFloat(undefined)).toEqual(false)
    })
  })

  describe('when null', () => {
    it('returns false', () => {
      expect(isPositiveFloat(null)).toEqual(false)
    })
  })

  describe('when empty string', () => {
    it('returns false', () => {
      expect(isPositiveFloat(' ')).toEqual(false)
    })
  })

  describe('when not empty string', () => {
    it('returns false', () => {
      expect(isPositiveFloat(' q ')).toEqual(false)
    })
  })

  describe('when zero', () => {
    it('returns false', () => {
      expect(isPositiveFloat(0)).toEqual(false)
    })
  })

  describe('when positive float', () => {
    it('returns true', () => {
      expect(isPositiveFloat(0.01)).toEqual(true)
    })
  })

  describe('when number', () => {
    it('returns true', () => {
      expect(isPositiveFloat(1)).toEqual(true)
    })
  })

  describe('when stringified float', () => {
    it('returns true', () => {
      expect(isPositiveFloat('0.01')).toEqual(true)
    })
  })
})

describe('isValidUUID', () => {
  it.todo('not implemented')
})

describe('validateUserId', () => {
  it.todo('not implemented')
})

describe('validateProductId', () => {
  it.todo('not implemented')
})

describe('validateProductsGroupId', () => {
  it.todo('not implemented')
})

describe('validateUserProductId', () => {
  it.todo('not implemented')
})

describe('isValidUser', () => {
  it.todo('not implemented')
})

describe('validatePositivePrice', () => {
  it.todo('not implemented')
})
