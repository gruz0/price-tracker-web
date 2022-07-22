import { Card, Divider } from 'semantic-ui-react'
import { ProductCard } from './ProductCard'

export const ProductsCards = ({ products }) => {
  return (
    <>
      {products.length > 0 && (
        <>
          <Divider hidden />
          <Card.Group itemsPerRow={3} stackable>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Card.Group>
        </>
      )}
    </>
  )
}
