import { Chart as GoogleChart } from 'react-google-charts'
import { formatDateTimeWithoutYear } from '../../lib/formatDate'

export default function Chart({ product, history }) {
  let historyData = [['Дата', 'Цены']]

  const historyAscending = [...history].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  historyAscending.forEach((history) => {
    historyData.push([
      formatDateTimeWithoutYear(history.created_at),
      history.discount_price || history.original_price,
    ])
  })

  const options = {
    vAxis: { minValue: product.lowest_price },
  }

  return (
    <GoogleChart
      chartType="Line"
      data={historyData}
      options={options}
      width={'100%'}
      height={'400px'}
    />
  )
}
