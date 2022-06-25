import { Chart as GoogleChart } from 'react-google-charts'

export default function Chart({ product, history }) {
  let historyData = [
    [
      { type: 'datetime', label: 'Дата' },
      { type: 'number', label: 'Минимальная цена товара' },
    ],
  ]

  history.forEach((h) => {
    if (h.status !== 'ok') return

    historyData.push([
      new Date(h.created_at),
      h.discount_price || h.original_price,
    ])
  })

  let chartLowestValue =
    product.lowest_price_ever - (product.lowest_price_ever / 100) * 5

  if (chartLowestValue < 0) {
    chartLowestValue = 0
  }

  const options = {
    vAxis: {
      minValue: chartLowestValue,
      maxValue: product.highest_price_ever + 300,
    },
    legend: { position: 'bottom' },
  }

  return (
    <GoogleChart
      chartLanguage="ru"
      chartType="LineChart"
      data={historyData}
      options={options}
      width={'100%'}
      height={'400px'}
    />
  )
}
