import { Message, Table, List } from 'semantic-ui-react'
import { GroupItem } from './GroupItem'

export const GroupItems = ({ groupItems }) => {
  return (
    <>
      <Message>
        <Message.Header>Порядок отображения товаров</Message.Header>
        <List ordered>
          <List.Item>
            Сначала показываются товары, которые существуют в маркетплейсах
          </List.Item>
          <List.Item>Затем товары в наличии</List.Item>
          <List.Item>И потом по цене по возрастанию</List.Item>
        </List>
      </Message>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Название товара</Table.HeaderCell>
            <Table.HeaderCell collapsing>Последняя цена</Table.HeaderCell>
            <Table.HeaderCell collapsing>Наличие</Table.HeaderCell>
            <Table.HeaderCell collapsing>Существует</Table.HeaderCell>
            <Table.HeaderCell collapsing>Обновлено</Table.HeaderCell>
            <Table.HeaderCell collapsing></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {groupItems.length > 0 &&
            groupItems.map((groupItem) => (
              <GroupItem key={groupItem.product_id} groupItem={groupItem} />
            ))}
        </Table.Body>
      </Table>
    </>
  )
}
