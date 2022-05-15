import React, { useState } from 'react'
import Router from 'next/router'
import { Form, Input, Message, Segment } from 'semantic-ui-react'
import { addProduct } from '../lib/api'

export default function AddNewProductForm({ token }) {
  const initialFields = { url: '' }
  const [fields, setFields] = useState(initialFields)
  const [errors, setErrors] = useState(undefined)
  const [message, setMessage] = useState(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddProduct = (e) => {
    setIsLoading(true)

    e.preventDefault()

    setErrors(null)
    setMessage(null)

    addProduct(token, fields.url)
      .then((response) => {
        setFields({ url: '' })

        if (response?.message) {
          setMessage(response.message)
        }

        if (response?.location) {
          Router.push(response.location)
        }
      })
      .catch((err) => {
        setErrors(err?.info?.message || err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleInputChange = (e) => {
    setFields({ ...fields, ...{ [e.target.id]: e.target.value } })
  }

  return (
    <Segment loading={isLoading} padded>
      {errors && (
        <Message
          error
          header="Ошибки при добавлении товара"
          list={Array.isArray(errors) ? errors : [errors]}
        />
      )}

      {message && <Message positive header={message} />}

      <Form onSubmit={handleAddProduct}>
        <Input
          id="url"
          action={{ type: 'submit', content: 'Добавить товар', primary: true }}
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
