import React from 'react'
import { Header, Segment, Message } from 'semantic-ui-react'
import Statistics from './Statistics'
import Chart from './Chart'
import PriceTable from './PriceTable'

export default function ProductCard({ product, history }) {
  return (
    <>
      <Header as="h1">{product.title}</Header>

      <Segment padded>
        <Statistics product={product} history={history} />
      </Segment>

      <Header as="h3">Динамика цен</Header>

      {history.length < 3 ? (
        <Message info>
          <Message.Header>
            В данный момент не достаточно информации для построения графика
          </Message.Header>
          <p>
            Вернитесь, пожалуйста, через несколько часов, мы обновим цены и
            сможем построить график для вас.
          </p>
        </Message>
      ) : (
        <Segment>
          <Chart product={product} history={history} />
        </Segment>
      )}

      <Header as="h3">Таблица цен</Header>

      <PriceTable history={history} />
    </>
  )
}
