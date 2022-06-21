import prisma from '../../lib/prisma'
import { withSentry } from '@sentry/nextjs'
import * as Sentry from '@sentry/nextjs'

import { METHOD_NOT_ALLOWED } from '../../lib/messages'
import { responseJSON } from '../../lib/helpers'

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return responseJSON(res, 405, METHOD_NOT_ALLOWED)
  }

  try {
    const result = await prisma.$queryRaw`SELECT true AS success`

    return responseJSON(res, 200, result[0])
  } catch (err) {
    console.error({ err })

    Sentry.captureException(err)

    return responseJSON(res, 500, {
      status: 'database_is_not_available',
      message: 'Database is not available',
    })
  }
}

export default withSentry(handler)
