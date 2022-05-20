import Product from './Product'

export default function ProductsTable({ products }) {
  return (
    <>
      {products.map((product) => (
        <Product key={product.id} product={product} />
      ))}
    </>
  )
}
