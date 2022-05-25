import React, { useState } from 'react'
import Router from 'next/router'
import { Form, Input, Message, Segment } from 'semantic-ui-react'
import { addProduct } from '../../lib/api'
import ErrorWrapper from '../../components/ErrorWrapper'

export default function AddNewProduct({ token }) {
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
    <Segment loading={isSubmitting} padded>
      {error && (
        <ErrorWrapper header="Ошибки при добавлении товара" error={error} />
      )}

      {message && <Message positive header={message} />}

      <Form onSubmit={handleAddProduct}>
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
      </Form>
    </Segment>
  )
}
