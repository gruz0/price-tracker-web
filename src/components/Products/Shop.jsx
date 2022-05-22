import Link from 'next/link'
import { Image } from 'semantic-ui-react'

export default function Shop({ product }) {
  return (
    <Link href={product.url} passHref>
      <a
        target="_blank"
        rel="noopener noreferrer"
        title="Открыть страницу товара в магазине"
      >
        <Image
          src={'/' + product.shop + '.ico'}
          width={24}
          height={24}
          rounded
          alt="Открыть страницу товара в магазине"
        />
      </a>
    </Link>
  )
}
