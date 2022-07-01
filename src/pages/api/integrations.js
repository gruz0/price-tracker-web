import { withSentry } from '@sentry/nextjs'

import { METHOD_NOT_ALLOWED } from '../../lib/messages'
import { responseJSON } from '../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  const chartikBaseURL =
    process.env.NODE_ENV === 'production'
      ? 'https://chartik.ru'
      : 'http://localhost:3000'

  return responseJSON(res, 200, {
    routes: {
      check_product_url: `${chartikBaseURL}/api/v1/3rdparty/check_product`,
      add_product_url: `${chartikBaseURL}/api/v1/3rdparty/add_product`,
    },
  })
}

export default withSentry(handler)
