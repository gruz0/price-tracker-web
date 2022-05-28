import React from 'react'
import Head from 'next/head'
import { Container, Segment, Grid } from 'semantic-ui-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

import 'semantic-ui-css/semantic.min.css'

const UsersLayout = ({ children, meta = {} }) => {
  const { title, description } = meta

  return (
    <>
      <Head>
        <title>{title || 'Chartik'}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.png"></link>
      </Head>

      <Container>
        <Header />

        <Segment basic vertical padded>
          <Grid.Column>{children}</Grid.Column>
        </Segment>

        <Footer />
      </Container>
    </>
  )
}

export default UsersLayout
