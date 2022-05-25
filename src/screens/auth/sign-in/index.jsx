import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import SignIn from '../../../forms/SignIn'

const Screen = () => (
  <Grid textAlign="center" style={{ marginTop: '1em' }}>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as="h2" textAlign="center">
        Вход в систему
      </Header>

      <SignIn />
    </Grid.Column>
  </Grid>
)

export default Screen
