import { calculateHash } from '../../src/lib/helpers'

describe('calculateHash', () => {
  test.todo('when empty string it must raise an error')

  test('returns hash', () => {
    expect(calculateHash('https://www.ozon.ru/product/42')).toEqual(
      '7bb40729dde6700a1540e342904e73696d3ffdb5ed222b7c4a69d3181d78d87f'
    )
  })
})
