import React from 'react'
import { Container, Divider, Header } from 'semantic-ui-react'
import ErrorWrapper from '../../../components/ErrorWrapper'
import JustOneSecond from '../../../components/JustOneSecond'
import { useAuth } from '../../../hooks'

export const DashboardScreen = ({ isSmallScreen }) => {
  const { isLoading: userLoading, isAuthenticated } = useAuth()

  if (userLoading) {
    return <JustOneSecond title="Загружаем пользователя..." />
  }

  if (!isAuthenticated) {
    return <ErrorWrapper header="Пожалуйста, войдите в систему" />
  }

  return (
    <Container textAlign="center" fluid>
      <Header
        as="h1"
        content="Дашборд"
        style={{
          fontSize: isSmallScreen ? '2.5em' : '4em',
          fontWeight: 'normal',
          marginBottom: 0,
          marginTop: isSmallScreen ? null : '0.7em',
        }}
      />

      <Divider hidden />

      <p>Скоро тут появятся графики и полезная информация</p>
    </Container>
  )
}
