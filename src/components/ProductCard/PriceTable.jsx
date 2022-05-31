import { Table, Icon } from 'semantic-ui-react'
import { formatDateTime } from '../../lib/formatDate'

const statuses = {
  ok: 'Товар найден',
  not_found: 'Товар не существует',
  required_to_change_location: 'Товар не доставляется',
}

export default function PriceTable({ history }) {
  const orderedByDateDescending = [...history].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Дата</Table.HeaderCell>
          <Table.HeaderCell>Цена со скидкой</Table.HeaderCell>
          <Table.HeaderCell>Цена без скидки</Table.HeaderCell>
          <Table.HeaderCell>Наличие</Table.HeaderCell>
          <Table.HeaderCell>Результат проверки</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orderedByDateDescending.map((history) => (
          <Table.Row key={history.created_at}>
            <Table.Cell>{formatDateTime(history.created_at)}</Table.Cell>
            <Table.Cell>
              {history.discount_price || history.original_price}
            </Table.Cell>
            <Table.Cell>{history.original_price}</Table.Cell>
            <Table.Cell>
              {history.in_stock ? (
                <Icon color="green" name="checkmark" size="large" />
              ) : (
                <Icon color="red" name="close" size="large" />
              )}
            </Table.Cell>
            <Table.Cell>{statuses[history.status] || 'Неизвестен'}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )
}
