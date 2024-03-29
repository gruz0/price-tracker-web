import React from 'react'
import { Card, List, Divider, Image } from 'semantic-ui-react'
import Link from 'next/link'
import { formatDateTime } from '../../lib/formatDate'
import { PriceLabel } from './PriceLabel'
import { TrueFalseIcon } from '../TrueFalseIcon'
import { Shop } from './Shop'

export const ProductCard = ({ product }) => {
  const formattedDate = formatDateTime(product.price_updated_at)

  const imagePath = product.image && '/uploads/' + product.image

  const truncateString = (str, num) => {
    if (str.length <= num) {
      return str
    }

    return str.slice(0, num) + '...'
  }

  return (
    <Card>
      {imagePath && (
        <Image
          src={imagePath}
          centered
          alt={product.title}
          style={{
            padding: '1rem',
            height: '230px',
            backgroundColor: '#fff',
          }}
        />
      )}

      <Card.Content style={{ borderTop: '0' }}>
        {/*
        <Label corner="right" as="a">
          <FavoritedIcon favorited={product.favorited} />
        </Label>
        */}

        <Card.Header style={{ marginBottom: '10px' }}>
          <Link href="/products/[id]" as={`/products/${product.id}`}>
            <a>{truncateString(product.title, 70)}</a>
          </Link>
        </Card.Header>

        <Card.Description>
          <Divider />
          <List>
            <List.Item>Последняя цена: {product.last_price} р.</List.Item>
            <List.Item>Ваша цена: {product.my_price} р.</List.Item>
            <List.Item>
              Самая низкая цена: {product.lowest_price_ever} р.
            </List.Item>
          </List>
        </Card.Description>
      </Card.Content>

      <Card.Content extra>
        <List horizontal floated="right">
          <List.Item>
            <Shop product={product} />
          </List.Item>
        </List>

        <List horizontal>
          <List.Item>
            <PriceLabel product={product} />
          </List.Item>
          <List.Item>
            <TrueFalseIcon value={product.in_stock} />
          </List.Item>
        </List>
      </Card.Content>

      <Card.Content extra textAlign="right">
        <Card.Meta>Обн.: {formattedDate}</Card.Meta>
      </Card.Content>
    </Card>
  )
}
