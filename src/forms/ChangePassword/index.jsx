import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Form } from 'semantic-ui-react'
import ErrorWrapper from '../../components/ErrorWrapper'
import { changeUserPassword } from '../../lib/settings'

export default function ChangePassword({ token, authenticate }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialFields = {
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  }

  const [fields, setFields] = useState(initialFields)
  const [error, setError] = useState(undefined)

  const handleChangePassword = async (e) => {
    e.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      const json = await changeUserPassword(token, {
        current_password: fields.current_password,
        new_password: fields.new_password,
        new_password_confirmation: fields.new_password_confirmation,
      })

      await authenticate(json.token)

      router.reload()
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
      {error && (
        <ErrorWrapper header="Не удалось изменить пароль" error={error} />
      )}

      <Form onSubmit={handleChangePassword}>
        <Form.Input
          id="current_password"
          fluid
          icon="lock"
          iconPosition="left"
          placeholder="Текущий пароль"
          type="password"
          required
          autoComplete="current-password"
          value={fields.current_password}
          onChange={handleInputChange}
        />

        <Form.Input
          id="new_password"
          fluid
          icon="lock"
          iconPosition="left"
          placeholder="Новый пароль"
          type="password"
          required
          autoComplete="new-password"
          value={fields.new_password}
          onChange={handleInputChange}
        />

        <Form.Input
          id="new_password_confirmation"
          fluid
          icon="lock"
          iconPosition="left"
          placeholder="Подтверждение пароля"
          type="password"
          required
          autoComplete="new-password"
          value={fields.new_password_confirmation}
          onChange={handleInputChange}
          loading={isSubmitting}
        />

        <Button primary fluid size="large" disabled={isSubmitting}>
          Изменить пароль
        </Button>
      </Form>
    </>
  )
}
