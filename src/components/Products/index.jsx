import React, { useState, useEffect } from 'react'
import { Table, Input, Checkbox, Icon } from 'semantic-ui-react'
import PaginationComponent from './Pagination'
import ProductsTable from './ProductsTable'

export default function ProductsList({ products }) {
  const recordsPerPage = 10

  const [filteredProducts, setFilteredProducts] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(null)
  const [showPagination, setShowPagination] = useState(null)

  const [search, setSearch] = useState('')
  const [displayWithDiscount, setDisplayWithDiscount] = useState(false)
  const [displayFavorited, setDisplayFavorited] = useState(false)
  const [displayInStock, setDisplayInStock] = useState(false)

  useEffect(() => {
    let filtered = products

    filtered =
      search.trim().length > 0
        ? filtered.filter((product) =>
            product.title.toLowerCase().includes(search.trim().toLowerCase())
          )
        : filtered

    filtered = displayWithDiscount
      ? filtered.filter((product) => product.has_discount)
      : filtered

    filtered = displayFavorited
      ? filtered.filter((product) => product.favorited)
      : filtered

    filtered = displayInStock
      ? filtered.filter((product) => product.in_stock)
      : filtered

    const recordsCount = filtered.length
    const pagesCount = Math.ceil(recordsCount / recordsPerPage)

    if (currentPage > pagesCount) {
      setCurrentPage(1)
    }

    const startFrom = (currentPage - 1) * recordsPerPage

    setTotalPages(pagesCount)
    setShowPagination(pagesCount > 1)
    setFilteredProducts(filtered.slice(startFrom, startFrom + recordsPerPage))
  }, [
    products,
    search,
    displayWithDiscount,
    displayFavorited,
    displayInStock,
    currentPage,
    totalPages,
    showPagination,
  ])

  const changePage = (_e, { activePage }) => {
    setCurrentPage(activePage)
  }

  const toggleDisplayWithDiscount = () => {
    setDisplayWithDiscount(!displayWithDiscount)
  }

  const toggleDisplayFavorited = () => {
    setDisplayFavorited(!displayFavorited)
  }

  const toggleDisplayInStock = () => {
    setDisplayInStock(!displayInStock)
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
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
          <Table.HeaderCell>Наличие</Table.HeaderCell>
          <Table.HeaderCell>Избр.</Table.HeaderCell>
          <Table.HeaderCell>Обновлено</Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell title="Показать только товары со скидкой">
            <Checkbox toggle onClick={toggleDisplayWithDiscount} />
          </Table.HeaderCell>
          <Table.HeaderCell title="Поиск по любому совпадению в названии товара">
            <Input
              fluid
              size="mini"
              placeholder="Введите любую фразу или часть фразы для поиска..."
              value={search}
              onChange={handleSearchChange}
            />
          </Table.HeaderCell>
          <Table.HeaderCell colSpan={2}></Table.HeaderCell>
          <Table.HeaderCell title="Показать только товары в наличии">
            <Checkbox toggle onClick={toggleDisplayInStock} />
          </Table.HeaderCell>
          <Table.HeaderCell title="Показать только избранные товары">
            <Checkbox toggle onClick={toggleDisplayFavorited} />
          </Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
          <Table.HeaderCell></Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {filteredProducts.length > 0 && (
          <ProductsTable products={filteredProducts} />
        )}
      </Table.Body>
      {showPagination && (
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan={9}>
              <PaginationComponent
                showPagination={showPagination}
                totalPages={totalPages}
                changePage={changePage}
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      )}
    </Table>
  )
}
