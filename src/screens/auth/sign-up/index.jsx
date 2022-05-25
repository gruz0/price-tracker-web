import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import SignUp from '../../../forms/SignUp'

const Screen = () => (
  <Grid textAlign="center" style={{ marginTop: '1em' }}>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as="h2" textAlign="center">
        Регистрация в системе
      </Header>

      <SignUp />
    </Grid.Column>
  </Grid>
)

export default Screen
