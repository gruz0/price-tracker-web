import { Table, Icon } from 'semantic-ui-react'
import { Product } from './Product'

export const ProductsTable = ({ products }) => {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell></Table.HeaderCell>
          <Table.HeaderCell>Название</Table.HeaderCell>
          <Table.HeaderCell>Цена</Table.HeaderCell>
          <Table.HeaderCell>
            <Icon
              name="arrow alternate circle down"
              title="Самая низкая цена с момента добавления товара в систему"
            />
          </Table.HeaderCell>
          <Table.HeaderCell>Наличие</Table.HeaderCell>
          {/*
          <Table.HeaderCell>Избр.</Table.HeaderCell>
          */}
          <Table.HeaderCell>Обновлено</Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {products.length > 0 &&
          products.map((product) => (
            <Product key={product.id} product={product} />
          ))}
      </Table.Body>
    </Table>
  )
}
