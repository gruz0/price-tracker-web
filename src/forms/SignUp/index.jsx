import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Form, Message, Segment } from 'semantic-ui-react'
import { useAuth } from '../../hooks'

export const SignUp = () => {
  const { signUp, authenticate } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialFields = {
    login: '',
    password: '',
  }
  const [fields, setFields] = useState(initialFields)
  const [errors, setErrors] = useState(undefined)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setErrors(null)
    setIsSubmitting(true)

    try {
      const response = await signUp(fields.login, fields.password)
      const json = await response.json()

      if (response.ok) {
        await authenticate(json.token)

        router.push('/products')
      } else {
        setErrors(json.message)
      }
    } catch (error) {
      setErrors(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    setFields({ ...fields, ...{ [e.target.id]: e.target.value } })
  }

  return (
    <>
      {errors && (
        <Message
          error
          header="Не удалось зарегистрироваться"
          list={Array.isArray(errors) ? errors : [errors]}
        />
      )}

      <Form size="large" onSubmit={handleSignUp}>
        <Segment>
          <Form.Input
            id="login"
            fluid
            icon="user"
            iconPosition="left"
            placeholder="Логин"
            required
            autoComplete="username"
            value={fields.login}
            onChange={handleInputChange}
          />

          <Form.Input
            id="password"
            fluid
            icon="lock"
            iconPosition="left"
            placeholder="Пароль"
            type="password"
            required
            autoComplete="new-password"
            value={fields.password}
            onChange={handleInputChange}
          />

          <Button primary fluid size="large" disabled={isSubmitting}>
            Зарегистрироваться
          </Button>
        </Segment>
      </Form>
    </>
  )
}
