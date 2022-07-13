import React from 'react'
import { Image, Table } from 'semantic-ui-react'
import Link from 'next/link'
import { formatDateTime } from '../../lib/formatDate'
import { TrueFalseIcon } from '../TrueFalseIcon'

export default function GroupItem({ groupItem }) {
  const formattedDate = formatDateTime(groupItem.history_updated_at)

  return (
    <Table.Row>
      <Table.Cell>
        <Link href="/products/[id]" as={`/products/${groupItem.product_id}`}>
          <a>{groupItem.product_title}</a>
        </Link>
      </Table.Cell>
      <Table.Cell textAlign="right">{groupItem.history_min_price}</Table.Cell>
      <Table.Cell textAlign="center">
        <TrueFalseIcon value={groupItem.history_in_stock} />
      </Table.Cell>
      <Table.Cell textAlign="center">
        <TrueFalseIcon value={groupItem.product_exists} />
      </Table.Cell>
      <Table.Cell>{formattedDate}</Table.Cell>
      <Table.Cell>
        <a
          href={groupItem.product_url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          title={`Открыть страницу товара в магазине ${groupItem.product_shop}`}
        >
          <Image
            src={'/' + groupItem.product_shop + '.ico'}
            width={24}
            height={24}
            rounded
            alt={`Открыть страницу товара в магазине ${groupItem.product_shop}`}
          />
        </a>
      </Table.Cell>
    </Table.Row>
  )
}
