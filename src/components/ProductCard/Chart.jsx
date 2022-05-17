import { Chart as GoogleChart } from 'react-google-charts'

export default function Chart({ product, history }) {
  let historyData = [
    [
      { type: 'datetime', label: 'Дата' },
      { type: 'number', label: 'Цена со скидкой' },
      { type: 'number', label: 'Цена без скидки' },
    ],
  ]

  const historyAscending = [...history].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  historyAscending.forEach((history) => {
    historyData.push([
      new Date(history.created_at),
      history.discount_price || history.original_price,
      history.original_price,
    ])
  })

  const options = {
    vAxis: { minValue: 0, maxValue: product.highest_price_ever + 300 },
    curveType: 'function',
    legend: { position: 'bottom' },
  }

  return (
    <GoogleChart
      chartType="LineChart"
      data={historyData}
      options={options}
      width={'100%'}
      height={'400px'}
    />
  )
}
