import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import LandingLayout from '../components/LandingLayout'

const HomePage = () => (
  <Grid textAlign="center" style={{ marginTop: '1em' }}>
    <Grid.Column>
      <Header as="h1" textAlign="center">
        Трекер цен
      </Header>
    </Grid.Column>
  </Grid>
)

HomePage.getLayout = (page) => (
  <LandingLayout
    meta={{
      title: 'Трекер цен',
      description: 'Покупайте вовремя!',
    }}
  >
    {page}
  </LandingLayout>
)

export default HomePage
