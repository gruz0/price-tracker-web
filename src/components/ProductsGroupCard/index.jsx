import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Segment, Message, Divider, Header } from 'semantic-ui-react'
import { useAuth } from '../../hooks'
import JustOneSecond from '../JustOneSecond'
import GroupItems from './GroupItems'
import ErrorWrapper from '../ErrorWrapper'
import AddNewItemToProductsGroup from '../../forms/AddNewItemToProductsGroup'
import { removeProductsGroup } from '../../lib/products_groups'

export default function ProductsGroupCard({
  productsGroup,
  productsGroupItems,
  userProducts,
  isSmallScreen,
}) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [error, setError] = useState(undefined)

  const handleRemoveProductsGroup = (e) => {
    if (!confirm('Удалить группу товаров со всем содержимым?')) {
      return
    }

    e.preventDefault()

    try {
      removeProductsGroup(token, productsGroup.id)
        .then(() => {
          router.push('/products_groups')
          return
        })
        .catch((err) => {
          console.error({ err })
          setError(err)
        })
    } catch (err) {
      console.error({ err })
      setError(err.message)
    }
  }

  if (!user) {
    return <JustOneSecond />
  }

  return (
    <>
      {!isSmallScreen && <Divider hidden fitted />}

      <Header as={isSmallScreen ? 'h2' : 'h1'}>{productsGroup.title}</Header>

      {error && <ErrorWrapper header="Возникла ошибка" error={error} />}

      <Segment>
        <AddNewItemToProductsGroup
          token={token}
          productsGroup={productsGroup}
          userProducts={userProducts}
        />
      </Segment>

      {productsGroupItems.length > 0 ? (
        <GroupItems groupItems={productsGroupItems} />
      ) : (
        <Message info>
          <Message.Header>Нет товаров для отображения</Message.Header>
          <p>Воспользуйтесь формой добавления товаров.</p>
        </Message>
      )}

      <Header as="h3">Полезные кнопки</Header>

      <Segment textAlign="right">
        <Button
          onClick={handleRemoveProductsGroup}
          content="Удалить группу товаров"
          negative
        />
      </Segment>
    </>
  )
}
