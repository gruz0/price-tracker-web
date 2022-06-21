import { isEmptyString, isNotDefined } from '../../src/lib/validators'

describe('isEmptyString', () => {
  describe('when undefined', () => {
    test('returns false', () => {
      expect(isEmptyString(undefined)).toBeFalsy
    })
  })

  describe('when null', () => {
    test('returns false', () => {
      expect(isEmptyString(null)).toBeFalsy
    })
  })

  describe('when empty string', () => {
    test('returns false', () => {
      expect(isEmptyString(' ')).toBeFalsy
    })
  })

  describe('when not empty string', () => {
    test('returns true', () => {
      expect(isEmptyString(' q ')).toBeTruthy
    })
  })

  describe('when number', () => {
    test('returns true', () => {
      expect(isEmptyString(1)).toBeTruthy
    })
  })
})

describe('isNotDefined', () => {
  describe('when undefined', () => {
    test('returns false', () => {
      expect(isNotDefined(undefined)).toBeFalsy
    })
  })

  describe('when null', () => {
    test('returns false', () => {
      expect(isNotDefined(null)).toBeFalsy
    })
  })

  describe('when empty string', () => {
    test('returns true', () => {
      expect(isNotDefined(' ')).toBeTruthy
    })
  })

  describe('when not empty string', () => {
    test('returns true', () => {
      expect(isNotDefined(' q ')).toBeTruthy
    })
  })

  describe('when number', () => {
    test('returns true', () => {
      expect(isNotDefined(1)).toBeTruthy
    })
  })
})
