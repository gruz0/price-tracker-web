import React from 'react'
import { Segment, Grid, Header } from 'semantic-ui-react'
import ErrorWrapper from '../../../components/ErrorWrapper'
import JustOneSecond from '../../../components/JustOneSecond'
import { ApiKey } from '../../../forms/ApiKey'
import { ChangePassword } from '../../../forms/ChangePassword'
import { useAuth } from '../../../hooks'

export const SettingsScreen = () => {
  const {
    isLoading: userLoading,
    isAuthenticated,
    user,
    token,
    authenticate,
  } = useAuth()

  if (userLoading) {
    return <JustOneSecond title="Загружаем пользователя..." />
  }

  if (!isAuthenticated) {
    return <ErrorWrapper header="Пожалуйста, войдите в систему" />
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
