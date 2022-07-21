import { Pagination as PaginationComponent } from 'semantic-ui-react'

export const Pagination = ({
  showPagination,
  totalPages,
  changePage,
  isSmallScreen,
}) => {
  if (!showPagination) return null

  const renderOnSmallScreen = isSmallScreen ? null : undefined

  return (
    <PaginationComponent
      ellipsisItem={renderOnSmallScreen}
      prevItem={renderOnSmallScreen}
      nextItem={renderOnSmallScreen}
      siblingRange={1}
      defaultActivePage={1}
      totalPages={totalPages}
      onPageChange={changePage}
    />
  )
}
