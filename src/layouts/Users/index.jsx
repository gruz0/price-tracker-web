import React from 'react'
import Head from 'next/head'
import { Container, Segment, Grid, Message } from 'semantic-ui-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

import 'semantic-ui-css/semantic.min.css'

const UsersLayout = ({ children, meta = {} }) => {
  const { title, description } = meta

  return (
    <>
      <Head>
        <title>{title || 'Default'}</title>
        <meta name="description" content={description || 'Default'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
