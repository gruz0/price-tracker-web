import React, { useState, useEffect } from 'react'
import { Divider } from 'semantic-ui-react'
import { ProductsGroupsTable } from './ProductsGroupsTable'
import { Pagination } from '../Pagination'

export const ProductsGroups = ({ productsGroups, isSmallScreen }) => {
  const recordsPerPage = 10

  const [filteredProductsGroups, setFilteredProductsGroups] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(null)
  const [showPagination, setShowPagination] = useState(null)

  useEffect(() => {
    let filtered = productsGroups

    const recordsCount = filtered.length
    const pagesCount = Math.ceil(recordsCount / recordsPerPage)

    if (currentPage > pagesCount) {
      setCurrentPage(1)
    }

    const startFrom = (currentPage - 1) * recordsPerPage

    setTotalPages(pagesCount)
    setShowPagination(pagesCount > 1)
    setFilteredProductsGroups(
      filtered.slice(startFrom, startFrom + recordsPerPage)
    )
  }, [recordsPerPage, productsGroups, currentPage, totalPages, showPagination])

  const changePage = (_e, { activePage }) => {
    setCurrentPage(activePage)
  }

  return (
    <>
      <ProductsGroupsTable productsGroups={filteredProductsGroups} />

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
