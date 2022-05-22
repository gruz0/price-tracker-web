import { Icon } from 'semantic-ui-react'

export default function InStockIcon({ in_stock }) {
  return (
    <>
      {in_stock ? (
        <Icon color="green" name="checkmark" size="large" title="В наличии" />
      ) : (
        <Icon color="red" name="close" size="large" title="Нет в наличии" />
      )}
    </>
  )
}
