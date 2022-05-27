import React from 'react'
import Head from 'next/head'
import { Container, Grid, Segment } from 'semantic-ui-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

import 'semantic-ui-css/semantic.min.css'

const LandingLayout = ({ children, meta = {} }) => {
  const { title, description } = meta

  return (
    <>
      <Head>
        <title>{title || 'Default'}</title>
        <meta name="description" content={description || 'Default'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/*
          Add Open Graph
        */}
      </Head>

      <Container>
        <Header />

        <Segment basic vertical size="large">
          {children}
        </Segment>

        <Footer />
      </Container>
    </>
  )
}

export default LandingLayout
