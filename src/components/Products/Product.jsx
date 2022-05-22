import React from 'react'
import { Table } from 'semantic-ui-react'
import Link from 'next/link'
import { formatDateTime } from '../../lib/formatDate'
import PriceLabel from './PriceLabel'
import FavoritedIcon from './FavoritedIcon'
import InStock from './InStockIcon'
import Shop from './Shop'

export default function Product({ product }) {
  const formattedDate = formatDateTime(product.price_updated_at)

  return (
    <Table.Row>
      <Table.Cell>
        <PriceLabel product={product} ribbon />
      </Table.Cell>

      <Table.Cell>
        <Link href="/products/[id]" as={`/products/${product.id}`}>
          <a>{product.title || product.url}</a>
        </Link>
      </Table.Cell>

      <Table.Cell>{product.last_price}</Table.Cell>
      <Table.Cell>{product.lowest_price_ever}</Table.Cell>

      <Table.Cell textAlign="center">
        <InStock in_stock={product.in_stock} />
      </Table.Cell>

      <Table.Cell>
        <FavoritedIcon favorited={product.favorited} />
      </Table.Cell>

      <Table.Cell>{formattedDate}</Table.Cell>

      <Table.Cell>
        <Shop product={product} />
      </Table.Cell>
    </Table.Row>
  )
}
