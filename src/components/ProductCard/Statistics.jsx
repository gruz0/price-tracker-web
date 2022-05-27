import React from 'react'
import { Icon, Statistic } from 'semantic-ui-react'
import { formatTime } from '../../lib/formatDate'

export default function Statistics({ product, isSmallScreen }) {
  return (
    <Statistic.Group
      size="small"
      widths={isSmallScreen ? 1 : 5}
      horizontal={isSmallScreen}
    >
      <Statistic>
        <Statistic.Value>{product.last_price || 'Нет'}</Statistic.Value>
        <Statistic.Label>Последняя цена, руб.</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>{product.lowest_price_ever || 'Нет'}</Statistic.Value>
        <Statistic.Label>Самая низкая, руб.</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>{product.highest_price_ever || 'Нет'}</Statistic.Value>
        <Statistic.Label>Самая высокая, руб.</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>
          {formatTime(product.price_updated_at)}
        </Statistic.Value>
        <Statistic.Label>Обновлено</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>
          {product.in_stock ? (
            <Icon color="green" name="checkmark" />
          ) : (
            <Icon color="red" name="close" />
          )}
        </Statistic.Value>
        <Statistic.Label>
          {product.in_stock ? 'В наличии' : 'Нет в наличии'}
        </Statistic.Label>
      </Statistic>
    </Statistic.Group>
  )
}
