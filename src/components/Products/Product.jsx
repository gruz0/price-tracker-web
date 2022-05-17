import React from 'react'
import { Table, Image, Icon, Label } from 'semantic-ui-react'
import Link from 'next/link'
import { formatDateTime } from '../../lib/formatDate'

export default function Product({ product }) {
  const formattedDate = formatDateTime(product.price_updated_at)

  const myBenefit = product.my_benefit
  const myBenefitAbsolute = Math.abs(myBenefit)

  return (
    <Table.Row>
      <Table.Cell>
        <>
          {product.in_stock && (
            <>
              {product.has_discount ? (
                <Label
                  ribbon
                  color="green"
                  title={
                    `Товар подешевел на ` +
                    myBenefitAbsolute +
                    ` р. с момента отслеживания вами этого товара`
                  }
                >
                  -{myBenefitAbsolute} р.{' '}
                </Label>
              ) : (
                <>
                  {myBenefit < 0 && (
                    <Label
                      ribbon
                      color="red"
                      title={
                        `Товар подорожал на ` +
                        myBenefitAbsolute +
                        ` р. с момента отслеживания вами этого товара`
                      }
                    >
                      +{myBenefitAbsolute} р.
                    </Label>
                  )}
                </>
              )}
            </>
          )}
        </>
      </Table.Cell>

      <Table.Cell>
        <Link href="/products/[id]" as={`/products/${product.id}`}>
          <a>{product.title || product.url}</a>
        </Link>
      </Table.Cell>

      <Table.Cell>{product.last_price}</Table.Cell>
      <Table.Cell>{product.lowest_price_ever}</Table.Cell>

      <Table.Cell textAlign="center">
        {product.in_stock ? (
          <Icon color="green" name="checkmark" size="large" />
        ) : (
          <Icon color="red" name="close" size="large" title={product.status} />
        )}
      </Table.Cell>

      <Table.Cell>
        {product.favorited ? (
          <Icon name="star" color="yellow" link />
        ) : (
          <Icon name="star outline" link />
        )}
      </Table.Cell>

      <Table.Cell>{formattedDate}</Table.Cell>

      <Table.Cell>
        <Link href={product.url} passHref>
          <a
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть страницу товара в магазине"
          >
            <Image
              src={'/' + product.shop + '.ico'}
              width={24}
              height={24}
              rounded
              alt="Открыть страницу товара в магазине"
            />
          </a>
        </Link>
      </Table.Cell>
    </Table.Row>
  )
}
