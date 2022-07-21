import React, { useState, useEffect } from 'react'
import {
  Button,
  Grid,
  Header,
  Divider,
  Form,
  Segment,
  Icon,
} from 'semantic-ui-react'
import { ProductsTable } from './ProductsTable'
import { ProductsCards } from './ProductsCards'
import { Pagination } from '../Pagination'

export default function ProductsList({ products, isSmallScreen }) {
  const [view, setView] = useState(isSmallScreen ? 'card' : 'table')

  const [filteredProducts, setFilteredProducts] = useState([])

  const [recordsPerPage, setRecordsPerPage] = useState(isSmallScreen ? 9 : 10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(null)
  const [showPagination, setShowPagination] = useState(null)

  const [search, setSearch] = useState('')
  const [displayWithDiscount, setDisplayWithDiscount] = useState(false)
  // const [displayFavorited, setDisplayFavorited] = useState(false)
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

    /*
    filtered = displayFavorited
      ? filtered.filter((product) => product.favorited)
      : filtered
    */

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
    recordsPerPage,
    products,
    search,
    displayWithDiscount,
    /*
    displayFavorited,
    */
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

  /*
  const toggleDisplayFavorited = () => {
    setDisplayFavorited(!displayFavorited)
  }
  */

  const toggleDisplayInStock = () => {
    setDisplayInStock(!displayInStock)
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
  }

  return (
    <>
      <Segment padded={!isSmallScreen}>
        <Header as="h3">Поиск и фильтры</Header>

        <Grid>
          <Grid.Row verticalAlign="top">
            <Grid.Column width={isSmallScreen ? null : 13}>
              <Form>
                <Form.Input
                  fluid
                  placeholder="Введите любую фразу или часть фразы для поиска..."
                  value={search}
                  onChange={handleSearchChange}
                />

                <Form.Group inline={!isSmallScreen} unstackable={isSmallScreen}>
                  <Form.Checkbox
                    toggle
                    onClick={toggleDisplayWithDiscount}
                    label="Со скидкой"
                  />

                  <Form.Checkbox
                    toggle
                    onClick={toggleDisplayInStock}
                    label="В наличии"
                  />

                  {/*
                  <Form.Checkbox
                    toggle
                    onClick={toggleDisplayFavorited}
                    label="Избранные"
                  />
                  */}
                </Form.Group>
              </Form>
            </Grid.Column>

            {!isSmallScreen && (
              <Grid.Column width={3} textAlign="right">
                <Button.Group icon>
                  <Button
                    onClick={() => {
                      setView('table')
                      setRecordsPerPage(10)
                    }}
                    primary={view === 'table'}
                  >
                    <Icon name="list" title="Таблица" />
                  </Button>

                  <Button
                    onClick={() => {
                      setView('card')
                      setRecordsPerPage(9)
                    }}
                    primary={view === 'card'}
                  >
                    <Icon name="table" title="Карточки" />
                  </Button>
                </Button.Group>
              </Grid.Column>
            )}
          </Grid.Row>
        </Grid>
      </Segment>

      {!isSmallScreen && <Divider hidden />}

      {view === 'table' && <ProductsTable products={filteredProducts} />}
      {view === 'card' && <ProductsCards products={filteredProducts} />}

      {showPagination && (
        <>
          <Divider hidden />

          <Pagination
            showPagination={showPagination}
            totalPages={totalPages}
            changePage={changePage}
            isSmallScreen={isSmallScreen}
          />
        </>
      )}
    </>
  )
}
