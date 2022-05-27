import { Pagination } from 'semantic-ui-react'

export default function PaginationComponent({
  showPagination,
  totalPages,
  changePage,
  isSmallScreen,
}) {
  if (!showPagination) return null

  const renderOnSmallScreen = isSmallScreen ? null : undefined

  return (
    <Pagination
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
