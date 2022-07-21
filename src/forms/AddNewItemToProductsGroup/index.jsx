import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Grid, Dropdown, Button, Message } from 'semantic-ui-react'
import ErrorWrapper from '../../components/ErrorWrapper'
import { isEmptyString } from '../../lib/validators'
import { addUserProductToProductsGroup } from '../../lib/products_groups'

export const AddNewItemToProductsGroup = ({
  token,
  productsGroup,
  userProducts,
}) => {
  const router = useRouter()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [message, setMessage] = useState(undefined)
  const [error, setError] = useState(undefined)

  const userProductsConverted = userProducts.map((userProduct) => {
    return {
      key: userProduct.user_product_id,
      text: userProduct.title,
      value: userProduct.user_product_id,
    }
  })

  const handleDropdownChange = (_e, { value }) => {
    setSelectedProductId(value)
  }

  const handleAddProductToProductsGroup = (e) => {
    e.preventDefault()

    setMessage(null)
    setError(null)

    if (isEmptyString(selectedProductId)) {
      setError('Выберите товар для добавления')

      return
    }

    try {
      addUserProductToProductsGroup(token, productsGroup.id, selectedProductId)
        .then(() => {
          router.reload()
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

  return (
    <>
      {error && (
        <ErrorWrapper
          header="Не удалось добавить товар в группу"
          error={error}
        />
      )}

      {message && <Message positive header={message} />}

      <Grid>
        <Grid.Row>
          <Grid.Column width={12}>
            <Dropdown
              placeholder="Выберите товар для добавления в группу"
              basic
              clearable
              search
              noResultsMessage="Ничего не найдено"
              selection
              fluid
              value={selectedProductId}
              onChange={handleDropdownChange}
              options={userProductsConverted}
            />
          </Grid.Column>
          <Grid.Column width={4}>
            <Button
              primary
              onClick={handleAddProductToProductsGroup}
              disabled={isEmptyString(selectedProductId)}
            >
              Добавить товар в группу
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  )
}
