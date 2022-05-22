import { Card, Divider } from 'semantic-ui-react'
import ProductCard from './ProductCard'

export default function ProductsItems({ products }) {
  return (
    <>
      {products.length > 0 && (
        <Card.Group itemsPerRow={3} stackable>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Card.Group>
      )}

      <Divider hidden />
    </>
  )
}
