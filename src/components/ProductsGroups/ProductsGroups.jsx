import { Table } from 'semantic-ui-react'
import ProductsGroup from './ProductsGroup'

export default function ProductsGroupsTable({ productsGroups }) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Название группы товаров</Table.HeaderCell>
          <Table.HeaderCell collapsing>Товаров в группе</Table.HeaderCell>
          <Table.HeaderCell collapsing>Дата создания</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {productsGroups.length > 0 &&
          productsGroups.map((productsGroup) => (
            <ProductsGroup
              key={productsGroup.id}
              productsGroup={productsGroup}
            />
          ))}
      </Table.Body>
    </Table>
  )
}
