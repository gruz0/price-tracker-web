import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import LoginForm from '../components/LoginForm'

const SignInPage = () => (
  <Grid textAlign="center" style={{ marginTop: '1em' }}>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as="h2" textAlign="center">
        Вход в систему
      </Header>

      <LoginForm />
    </Grid.Column>
  </Grid>
)

SignInPage.getLayout = (page) => (
  <Layout
    meta={{
      title: 'Вход в систему | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </Layout>
)

export default SignInPage
