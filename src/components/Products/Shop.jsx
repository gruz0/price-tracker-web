import Link from 'next/link'
import { Image } from 'semantic-ui-react'

export const Shop = ({ product }) => {
  return (
    <Link href={product.url} passHref>
      <a
        target="_blank"
        rel="noopener noreferrer"
        title={`Открыть страницу товара в магазине ${product.shop}`}
      >
        <Image
          src={'/' + product.shop + '.ico'}
          width={24}
          height={24}
          rounded
          alt={`Открыть страницу товара в магазине ${product.shop}`}
        />
      </a>
    </Link>
  )
}
