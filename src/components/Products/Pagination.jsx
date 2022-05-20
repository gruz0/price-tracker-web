import { Pagination } from 'semantic-ui-react'

export default function PaginationComponent({
  showPagination,
  totalPages,
  changePage,
}) {
  if (!showPagination) return null

  return (
    <Pagination
      defaultActivePage={1}
      totalPages={totalPages}
      onPageChange={changePage}
    />
  )
}
