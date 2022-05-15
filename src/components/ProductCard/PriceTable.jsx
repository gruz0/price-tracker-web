import { Table, Icon } from 'semantic-ui-react'
import { formatDateTime } from '../../lib/formatDate'

export default function PriceTable({ history }) {
  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Дата</Table.HeaderCell>
          <Table.HeaderCell>Цена</Table.HeaderCell>
          <Table.HeaderCell>Наличие</Table.HeaderCell>
          <Table.HeaderCell>Статус</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {history.map((history) => (
          <Table.Row key={history.created_at}>
            <Table.Cell>{formatDateTime(history.created_at)}</Table.Cell>
            <Table.Cell>
              {history.discount_price || history.original_price}
            </Table.Cell>
            <Table.Cell>
              {history.in_stock ? (
                <Icon color="green" name="checkmark" size="large" />
              ) : (
                <Icon color="red" name="close" size="large" />
              )}
            </Table.Cell>
            <Table.Cell>{history.status}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
