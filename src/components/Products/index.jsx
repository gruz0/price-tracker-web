import React, { useState, useMemo } from 'react'
import { Table, Input, Checkbox, Icon, Pagination } from 'semantic-ui-react'
import Product from './Product'

export default function ProductsList({ products }) {
  const recordsPerPage = 10

  const [currentPage, setCurrentPage] = useState(1)
  const productsCount = products.length
  const totalPages = Math.ceil(productsCount / recordsPerPage)
  const showPagination = productsCount / recordsPerPage > 1

  const currentTableData = useMemo(() => {
    const startFrom = (currentPage - 1) * recordsPerPage

    return products.slice(startFrom, startFrom + recordsPerPage)
  }, [currentPage])

  const changePage = (_e, { activePage }) => {
    setCurrentPage(activePage)
  }

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
          <Table.HeaderCell>
            <Icon
              name="arrow alternate circle up"
              title="Самая высокая цена с момента добавления товара в систему"
            />
          </Table.HeaderCell>
          <Table.HeaderCell>Наличие</Table.HeaderCell>
          <Table.HeaderCell>Избр.</Table.HeaderCell>
          <Table.HeaderCell>Обновлено</Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell title="Показать только товары со скидкой">
            <Checkbox toggle />
          </Table.HeaderCell>
          <Table.HeaderCell title="Поиск по любому совпадению в названии товара">
            <Input
              fluid
              size="mini"
              placeholder="Введите любую фразу или часть фразы для поиска..."
              id="search"
            />
          </Table.HeaderCell>
          <Table.HeaderCell colspan={3}></Table.HeaderCell>
          <Table.HeaderCell title="Показать только товары в наличии">
            <Checkbox toggle />
          </Table.HeaderCell>
          <Table.HeaderCell title="Показать только избранные товары">
            <Checkbox toggle />
          </Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {currentTableData.map((product) => (
          <Product key={product.id} product={product} />
        ))}
      </Table.Body>
      {showPagination && (
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan={9}>
              <Pagination
                defaultActivePage={1}
                totalPages={totalPages}
                onPageChange={changePage}
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      )}
    </Table>
  )
}
