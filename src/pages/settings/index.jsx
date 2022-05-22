import React from 'react'

import { Header } from 'semantic-ui-react'
import Layout from '../../components/Layout'
import ChangePassword from '../../forms/ChangePassword'
import { useAuth } from '../../hooks'

const SecurityPage = () => {
  const { token, authenticate } = useAuth()

  // FIXME: Здесь надо разобраться, почему не происходит логаут при заходе из другого браузера.
  // В других вьюхах вызывается дополнительный вызов стороннего хука, который отдаёт ошибку, а здесь такого нет.

  return (
    <>
      <Header as="h1">Настройки</Header>

      <Header as="h3">Смена пароля</Header>

      <ChangePassword token={token} authenticate={authenticate} />
    </>
  )
}

SecurityPage.requiresAuth = true

SecurityPage.getLayout = (page) => (
  <Layout
    meta={{
      title: 'Настройки | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </Layout>
)

export default SecurityPage
