import { Menu, Image, Dropdown } from 'semantic-ui-react'

export default function SearchInOtherShops({ product, shops }) {
  return (
    <Menu.Menu position="right">
      <Dropdown item text="Найти в других магазинах">
        <Dropdown.Menu>
          {Object.values(shops).map((shop) => {
            if (shop.name === product.shop) return null

            return (
              <Dropdown.Item
                key={shop.name}
                as="a"
                href={`https://${shop.domain}${shop.search_path}${product.title}`}
                title={`Найти в ${shop.name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  alt={`Найти в ${shop.name}`}
                  src={`/${shop.name}.ico`}
                  size="32"
                  avatar
                  verticalAlign="middle"
                />
                <span>{shop.name}</span>
              </Dropdown.Item>
            )
          })}
        </Dropdown.Menu>
      </Dropdown>
    </Menu.Menu>
  )
}
