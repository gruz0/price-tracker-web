import {
  findShopByURL,
  isSingleProductURL,
  replaceHostWithOriginalShopDomain,
  getShops,
} from '../../src/services/shops'

describe('findShopByURL', () => {
  describe('when shop is not supported', () => {
    it('returns null', () => {
      expect(findShopByURL('https://domain.tld/')).toBeNull()
    })
  })

  describe('ozon', () => {
    describe('www.ozon.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://www.ozon.ru').name).toEqual('ozon')
      })
    })

    describe('ozon.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://ozon.ru').name).toEqual('ozon')
      })
    })

    describe('m.ozon.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://m.ozon.ru').name).toEqual('ozon')
      })
    })
  })

  describe('lamoda', () => {
    describe('www.lamoda.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://www.lamoda.ru').name).toEqual('lamoda')
      })
    })

    describe('lamoda.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://lamoda.ru').name).toEqual('lamoda')
      })
    })

    describe('m.lamoda.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://m.lamoda.ru').name).toEqual('lamoda')
      })
    })
  })

  describe('wildberries', () => {
    describe('www.wildberries.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://www.wildberries.ru').name).toEqual(
          'wildberries'
        )
      })
    })

    describe('wildberries.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://wildberries.ru').name).toEqual(
          'wildberries'
        )
      })
    })
  })

  describe('sbermegamarket', () => {
    describe('www.sbermegamarket.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://www.sbermegamarket.ru').name).toEqual(
          'sbermegamarket'
        )
      })
    })

    describe('sbermegamarket.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://sbermegamarket.ru').name).toEqual(
          'sbermegamarket'
        )
      })
    })
  })

  describe('store77', () => {
    describe('www.store77.net', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://www.store77.net').name).toEqual('store77')
      })
    })

    describe('store77.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://store77.net').name).toEqual('store77')
      })
    })
  })

  describe('goldapple', () => {
    describe('www.goldapple.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://www.goldapple.ru').name).toEqual(
          'goldapple'
        )
      })
    })

    describe('goldapple.ru', () => {
      it('returns shop', () => {
        expect(findShopByURL('https://goldapple.ru').name).toEqual('goldapple')
      })
    })
  })
})

describe('isSingleProductURL', () => {
  describe('ozon', () => {
    const shopName = 'ozon'

    describe('when single product URL', () => {
      it('returns true', () => {
        expect(
          isSingleProductURL(shopName, 'https://www.ozon.ru/product/42/')
        ).toEqual(true)
      })

      it('returns true', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://www.ozon.ru/products/441313301?sh=y6SDCxnYGA&from=share_ios'
          )
        ).toEqual(true)
      })
    })

    describe('when not a single product URL', () => {
      it('returns false', () => {
        expect(isSingleProductURL(shopName, 'https://ozon.ru')).toEqual(false)
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(shopName, 'https://ozon.ru/product/')
        ).toEqual(false)
      })
    })
  })

  describe('lamoda', () => {
    const shopName = 'lamoda'

    describe('when single product URL', () => {
      it('returns true', () => {
        expect(
          isSingleProductURL(shopName, 'https://www.lamoda.ru/p/42/')
        ).toEqual(true)
      })
    })

    describe('when not a single product URL', () => {
      it('returns false', () => {
        expect(isSingleProductURL(shopName, 'https://www.lamoda.ru')).toEqual(
          false
        )
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(shopName, 'https://www.lamoda.ru/p/')
        ).toEqual(false)
      })
    })
  })

  describe('wildberries', () => {
    const shopName = 'wildberries'

    describe('when single product URL', () => {
      it('returns true', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://www.wildberries.ru/catalog/9677851/detail.aspx'
          )
        ).toEqual(true)
      })
    })

    describe('when not a single product URL', () => {
      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://www.wildberries.ru/brands/redragon'
          )
        ).toEqual(false)
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://www.wildberries.ru/catalog/0/search'
          )
        ).toEqual(false)
      })
    })
  })

  describe('sbermegamarket', () => {
    const shopName = 'sbermegamarket'

    describe('when single product URL', () => {
      it('returns true', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://sbermegamarket.ru/catalog/details/velosiped-stels-12'
          )
        ).toEqual(true)
      })
    })

    describe('when not a single product URL', () => {
      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://sbermegamarket.ru/catalog/detskie-dvuhkolesnye-velosipedy'
          )
        ).toEqual(false)
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://sbermegamarket.ru/catalog/details/'
          )
        ).toEqual(false)
      })
    })
  })

  describe('store77', () => {
    const shopName = 'store77'

    describe('when single product URL', () => {
      it('returns true', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://store77.net/apple_macbook/noutbuk_apple_macbook_air_13_displey_retina_s_tekhnologiey_true_tone_late_2020_m1_8_gb_256_gb_ssd_zo/'
          )
        ).toEqual(true)
      })
    })

    describe('when not a single product URL', () => {
      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://store77.net/plenki_i_stekla/?arrFilter_202_53009198=Y&arrFilter_1024_3068771198=Y&set_filter=Y&PAGEN_2=1/'
          )
        ).toEqual(false)
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(shopName, 'https://store77.net/apple_brand_zone/')
        ).toEqual(false)
      })
    })
  })

  describe('goldapple', () => {
    const shopName = 'goldapple'

    describe('when single product URL', () => {
      it('returns true', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://goldapple.ru/19000064375-bamboo-200-swabs-in-box'
          )
        ).toEqual(true)
      })
    })

    describe('when not a single product URL', () => {
      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://goldapple.ru/uhod/uhod-za-licom/osnovnoj-uhod'
          )
        ).toEqual(false)
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(
            shopName,
            'https://goldapple.ru/brands/100-receptov-krasoty'
          )
        ).toEqual(false)
      })

      it('returns false', () => {
        expect(
          isSingleProductURL(shopName, 'https://goldapple.ru/19760306250-')
        ).toEqual(false)
      })
    })
  })
})

describe('replaceHostWithOriginalShopDomain', () => {
  describe('when alternate domain exists', () => {
    test('replaces alternate domain with original domain', () => {
      const shop = {
        domain: 'www.ozon.ru',
        alternateDomains: ['m.ozon.ru'],
      }

      const url =
        'https://m.ozon.ru/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/?sh=xLFoe3qKbA'

      expect(replaceHostWithOriginalShopDomain(shop, url)).toEqual(
        `https://${shop.domain}/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/`
      )
    })
  })

  describe('when alternate domain does not exist', () => {
    const shop = {
      domain: 'www.ozon.ru',
      alternateDomains: [''],
    }

    test('replaces domain with original domain', () => {
      const url =
        'https://m.ozon.ru/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/?sh=xLFoe3qKbA'

      expect(replaceHostWithOriginalShopDomain(shop, url)).toEqual(
        `https://${shop.domain}/product/otparivatel-tefal-pro-style-it3450-belyy-seryy-161082079/`
      )
    })
  })
})

describe('getShops', () => {
  it('returns shops', () => {
    expect(getShops()).toEqual({
      goldapple: {
        domain: 'goldapple.ru',
        name: 'goldapple',
        search_path: '/catalogsearch/result?q=',
      },
      lamoda: {
        domain: 'www.lamoda.ru',
        name: 'lamoda',
        search_path: '/catalogsearch/result/?q=',
      },
      ozon: {
        domain: 'www.ozon.ru',
        name: 'ozon',
        search_path: '/search?text=',
      },
      sbermegamarket: {
        domain: 'sbermegamarket.ru',
        name: 'sbermegamarket',
        search_path: '/catalog/?q=',
      },
      store77: {
        domain: 'store77.net',
        name: 'store77',
        search_path: '/search/?q=',
      },
      wildberries: {
        domain: 'www.wildberries.ru',
        name: 'wildberries',
        search_path: '/catalog/0/search.aspx?sort=popular&search=',
      },
    })
  })
})
