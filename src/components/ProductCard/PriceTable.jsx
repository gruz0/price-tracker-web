import { useState, useEffect } from 'react'
import { Form, Segment, Table, Icon } from 'semantic-ui-react'
import { formatDateTime } from '../../lib/formatDate'

const statuses = {
  ok: 'Товар найден',
  not_found: 'Товар не существует',
}

export default function PriceTable({ history }) {
  const [displayAllRecords, setDisplayAllRecords] = useState(false)
  const [data, setData] = useState([])

  const toggleDisplayAllRecords = () => {
    setDisplayAllRecords(!displayAllRecords)
  }

  useEffect(() => {
    if (displayAllRecords) {
      setData(history)
    } else {
      let d = []

      history.forEach((h, idx) => {
        if (idx === 0) {
          d.push(h)
        } else {
          const prev = history[idx - 1]
          const next = history[idx]

          if (
            h.original_price !== prev.original_price ||
            h.discount_price !== prev.discount_price ||
            h.status !== prev.status ||
            h.in_stock !== prev.in_stock ||
            h.original_price !== next.original_price ||
            h.discount_price !== next.discount_price ||
            h.status !== next.status ||
            h.in_stock !== next.in_stock
          ) {
            d.push(h)
          }
        }
      })

      setData(d)
    }
  }, [displayAllRecords, history])

  return (
    <>
      <Segment>
        <Form.Checkbox
          toggle
          label="Отобразить все данные за последний месяц"
          onClick={toggleDisplayAllRecords}
        />
      </Segment>
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
          {data.map((h) => (
            <Table.Row key={h.created_at}>
              <Table.Cell>{formatDateTime(h.created_at)}</Table.Cell>
              <Table.Cell>{h.discount_price}</Table.Cell>
              <Table.Cell>{h.original_price}</Table.Cell>
              <Table.Cell>
                {h.in_stock ? (
                  <Icon color="green" name="checkmark" size="large" />
                ) : (
                  <Icon color="red" name="close" size="large" />
                )}
              </Table.Cell>
              <Table.Cell>{statuses[h.status] || 'Неизвестен'}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  )
}
