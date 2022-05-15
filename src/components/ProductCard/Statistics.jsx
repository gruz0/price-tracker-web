import Link from 'next/link'
import { Image, Icon, Statistic } from 'semantic-ui-react'
import { formatTime } from '../../lib/formatDate'

export default function Statistics({ product, history }) {
  const actualPrice = product.actual_price

  const updatedAt = history[0].created_at

  const inStock = history[0].in_stock

  return (
    <Statistic.Group size="small" widths={6}>
      <Statistic>
        <Statistic.Value>{actualPrice}</Statistic.Value>
        <Statistic.Label>Последняя цена, руб.</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>{product.lowest_price}</Statistic.Value>
        <Statistic.Label>Самая низкая, руб.</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>{product.highest_price}</Statistic.Value>
        <Statistic.Label>Самая высокая, руб.</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>{formatTime(updatedAt)}</Statistic.Value>
        <Statistic.Label>Обновлено</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>
          {inStock ? (
            <Icon color="green" name="checkmark" />
          ) : (
            <Icon color="red" name="close" />
          )}
        </Statistic.Value>
        <Statistic.Label>Наличие</Statistic.Label>
      </Statistic>
      <Statistic>
        <Statistic.Value>
          <Link href={product.url} passHref>
            <a
              target="_blank"
              rel="noopener noreferrer"
              title="Перейти в магазин"
            >
              <Image
                src={'/' + product.shop + '.ico'}
                width={48}
                height={48}
                rounded
                centered
                alt="Перейти в магазин"
              />
            </a>
          </Link>
        </Statistic.Value>
        <Statistic.Label>Магазин</Statistic.Label>
      </Statistic>
    </Statistic.Group>
  )
}
