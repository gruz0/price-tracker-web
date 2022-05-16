import React from 'react'
import Head from 'next/head'
import { Container, Grid, Segment } from 'semantic-ui-react'
import Header from '../Header'
import Footer from '../Footer'

import 'semantic-ui-css/semantic.min.css'

const LandingLayout = ({ children, meta = {} }) => {
  const { title, description } = meta

  return (
    <>
      <Head>
        <title>{title || 'Default'}</title>
        <meta name="description" content={description || 'Default'} />

        {/*
          Add Open Graph
        */}
      </Head>

      <Container>
        <Header />

        <Segment basic vertical size="large">
          <Grid container verticalAlign="top">
            <Grid.Row>
              <Grid.Column>{children}</Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>

        <Footer />
      </Container>
    </>
  )
}

export default LandingLayout
