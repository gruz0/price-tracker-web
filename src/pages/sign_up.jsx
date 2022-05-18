import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import Layout from '../components/Layout'
import RegistrationForm from '../components/RegistrationForm'

const SignUpPage = () => (
  <Grid textAlign="center" style={{ marginTop: '1em' }}>
    <Grid.Column style={{ maxWidth: 450 }}>
      <Header as="h2" textAlign="center">
        Регистрация в системе
      </Header>

      <RegistrationForm />
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
