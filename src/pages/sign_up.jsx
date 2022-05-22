import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import SignUp from '../forms/SignUp'

const SignUpPage = () => (
  <Grid textAlign="center" style={{ marginTop: '1em' }}>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as="h2" textAlign="center">
        Регистрация в системе
      </Header>

      <SignUp />
    </Grid.Column>
  </Grid>
)

SignUpPage.getLayout = (page) => (
  <Layout
    meta={{
      title: 'Регистрация в системе | Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </Layout>
)

export default SignUpPage
