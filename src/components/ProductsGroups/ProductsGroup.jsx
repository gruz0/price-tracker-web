import React from 'react'
import { Table } from 'semantic-ui-react'
import Link from 'next/link'
import { formatDateTime } from '../../lib/formatDate'

export default function ProductsGroup({ productsGroup }) {
  const formattedDate = formatDateTime(productsGroup.created_at)

  return (
    <Table.Row>
      <Table.Cell>
        <Link
          href="/products_groups/[id]"
          as={`/products_groups/${productsGroup.id}`}
        >
          <a>{productsGroup.title || productsGroup.url}</a>
        </Link>
      </Table.Cell>
      <Table.Cell textAlign="right">{productsGroup.products_count}</Table.Cell>
      <Table.Cell>{formattedDate}</Table.Cell>
    </Table.Row>
  )
}
