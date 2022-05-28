import React from 'react'
import { Header } from 'semantic-ui-react'

import { useAuth } from '../../../hooks'
import ChangePassword from '../../../forms/ChangePassword'

const Screen = () => {
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

export default Screen