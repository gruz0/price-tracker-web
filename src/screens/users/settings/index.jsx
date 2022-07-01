import React from 'react'
import { Segment, Grid, Header } from 'semantic-ui-react'

import { useAuth } from '../../../hooks'
import JustOneSecond from '../../../components/JustOneSecond'
import ApiKey from '../../../forms/ApiKey'
import ChangePassword from '../../../forms/ChangePassword'

const Screen = () => {
  const { isLoading, user, token, authenticate } = useAuth()

  // FIXME: Здесь надо разобраться, почему не происходит логаут при заходе из другого браузера.
  // В других вьюхах вызывается дополнительный вызов стороннего хука, который отдаёт ошибку, а здесь такого нет.
  if (isLoading || !user) {
    return <JustOneSecond />
  }

  return (
    <>
      <Header as="h1">Настройки</Header>

      <Grid padded stackable>
        <Grid.Row>
          <Grid.Column width={8}>
            <Header as="h3">Ключ API</Header>

            <Segment>
              <ApiKey apiKey={user.api_key} />
            </Segment>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width={8}>
            <Header as="h3">Смена пароля</Header>

            <Segment>
              <ChangePassword token={token} authenticate={authenticate} />
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  )
}

export default Screen
