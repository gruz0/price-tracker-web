import React from 'react'
import { Container, Header } from 'semantic-ui-react'

const Screen = () => {
  return (
    <Container textAlign="center" fluid>
      <Header
        as="h1"
        content="Дашборд"
        style={{
          fontSize: '4em',
          fontWeight: 'normal',
          marginBottom: 0,
          marginTop: '0.7em',
        }}
      />
    </Container>
  )
}

export default Screen
