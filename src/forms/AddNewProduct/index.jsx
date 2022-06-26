import React, { useState } from 'react'
import Router from 'next/router'
import {
  Form,
  Divider,
  Header,
  Label,
  Input,
  Message,
  Segment,
} from 'semantic-ui-react'
import { addProduct } from '../../lib/api'
import ErrorWrapper from '../../components/ErrorWrapper'

export default function AddNewProduct({ token, isSmallScreen }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialFields = { url: '' }
  const [fields, setFields] = useState(initialFields)
  const [error, setError] = useState(undefined)
  const [message, setMessage] = useState(undefined)

  const handleAddProduct = async (e) => {
    e.preventDefault()

    setError(null)
    setMessage(null)

    try {
      const response = await addProduct(token, fields.url)

      setFields({ url: '' })

      if (response?.message) {
        setMessage(response.message)
      }

      if (response?.location) {
        Router.push(response.location)
      }
    } catch (error) {
      setError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    setFields({ ...fields, ...{ [e.target.id]: e.target.value } })
  }

  return (
    <>
      {!isSmallScreen && <Divider fitted hidden />}

      <Segment loading={isSubmitting} padded={!isSmallScreen}>
        <Header as="h3">Добавление товара</Header>

        {error && (
          <ErrorWrapper header="Ошибки при добавлении товара" error={error} />
        )}

        {message && <Message positive header={message} />}

        <Form onSubmit={handleAddProduct}>
          <Form.Field>
            <Input
              id="url"
              action={{ type: 'submit', content: 'Добавить', primary: true }}
              placeholder="Вставьте ссылку на товар, цену которого хотите отслеживать"
              value={fields.url}
              onChange={handleInputChange}
              required
              fluid
              float="right"
            />
            <Label pointing>
              Поддерживаются ссылки из: ozon.ru, wildberries.ru, lamoda.ru,
              sbermegamarket.ru, store77.net, goldapple.ru
            </Label>
          </Form.Field>
        </Form>
      </Segment>
    </>
  )
}
