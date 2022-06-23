import { buildCleanURL } from '../../src/lib/helpers'

describe('buildCleanURL', () => {
  test('returns scheme, host and pathname', () => {
    const url =
      'https://www.ozon.ru/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/?sh=xLFoe3qKbA'

    expect(buildCleanURL(url)).toEqual(
      'https://www.ozon.ru/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/'
    )
  })

  describe('when host mapping exists', () => {
    describe('m.ozon.ru', () => {
      test('replaces host with matched host', () => {
        const url =
          'https://m.ozon.ru/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/?sh=xLFoe3qKbA'

        expect(buildCleanURL(url)).toEqual(
          'https://www.ozon.ru/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/'
        )
      })
    })

    describe('m.lamoda.ru', () => {
      test('replaces host with matched host', () => {
        const url =
          'https://m.lamoda.ru/p/mp002xm1i1jv/clothes-befree-kurtka-uteplennaya/'

        expect(buildCleanURL(url)).toEqual(
          'https://www.lamoda.ru/p/mp002xm1i1jv/clothes-befree-kurtka-uteplennaya/'
        )
      })
    })
  })
})
