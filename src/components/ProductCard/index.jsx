import React from 'react'
import { Header, Segment, Message } from 'semantic-ui-react'
import Statistics from './Statistics'
import Chart from './Chart'
import PriceTable from './PriceTable'
import { useAuth } from '../../hooks'
import JustOneSecond from '../JustOneSecond'
import useProductHistory from '../../hooks/useProductHistory'
import ErrorWrapper from '../ErrorWrapper'

export default function ProductCard({ product }) {
  const { token } = useAuth()
  const { data, isLoading, error } = useProductHistory(product.id, token)

  return (
    <>
      <Header as="h1">{product.title}</Header>

      {error ? (
        <ErrorWrapper
          header="Не удалось загрузить историю товара"
          error={error}
        />
      ) : (
        <>
          {isLoading ? (
            <JustOneSecond />
          ) : (
            <>
              {data?.history && data.history.length > 2 ? (
                <>
                  <Segment padded>
                    <Statistics product={data.product} />
                  </Segment>

                  <Header as="h3">Динамика цен</Header>

                  <Segment>
                    <Chart product={product} history={data.history} />
                  </Segment>

                  <Header as="h3">Таблица цен</Header>

                  <PriceTable history={data.history} />
                </>
              ) : (
                <Message info>
                  <Message.Header>
                    В данный момент не достаточно информации для отображения
                    графиков и таблиц
                  </Message.Header>
                  <p>
                    Вернитесь, пожалуйста, через несколько часов, мы обновим
                    цены и сможем отобразить все необходимые элементы страницы.
                  </p>
                </Message>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
