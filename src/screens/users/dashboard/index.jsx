import React, { useContext } from 'react'
import { Container, Divider, Header } from 'semantic-ui-react'
import DisplayContext from '../../../context/display-context'

const Screen = () => {
  const { isSmallScreen } = useContext(DisplayContext)

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

export default Screen
