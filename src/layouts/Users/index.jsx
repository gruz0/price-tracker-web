import React from 'react'
import Head from 'next/head'
import { Container, Grid, Segment, Message } from 'semantic-ui-react'
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
      </Head>

      <Container>
        <Header />

        <Grid>
          <Grid.Row only="mobile">
            <Grid.Column>
              <Message negative>
                <Message.Header>
                  В данный момент интерфейс не оптимизирован для мобильных
                  устройств
                </Message.Header>
                <p>
                  Воспользуйтесь браузерной версией, пожалуйста.
                  <br />
                  Мы работаем над улучшением интерфейса и скоро всё будет
                  хорошо.
                </p>
              </Message>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Segment basic vertical padded size="large">
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

export default UsersLayout
