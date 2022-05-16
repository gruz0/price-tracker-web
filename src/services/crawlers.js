const path = require('path')
const fs = require('fs-extra')
const uuid = require('uuid')

const crawlersPath = path.join(process.cwd(), '/data/crawlers')
const crawlersLogsPath = path.join(process.cwd(), '/data/crawlers_logs')

const getCrawlers = () => {
  let crawlers = []
  const files = fs.readdirSync(crawlersPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const { id, token } = fs.readJsonSync(crawlersPath + '/' + file)

      crawlers.push({ id, token })

      return
    }
  })

  return crawlers
}

export const getCrawlerByToken = (token) => {
  const crawlers = getCrawlers()

  return crawlers.find((c) => c.token === token)
}

export const addCrawlerLog = (crawler, args) => {
  const recordId = uuid.v4()

  const log = {
    id: recordId,
    crawler_id: crawler.id,
    token: crawler.token,
    created_at: new Date(),
    ...args,
  }

  const logPath = crawlersLogsPath + '/' + crawler.id + '.json'

  let logs = []

  try {
    logs = fs.readJsonSync(logPath)
  } catch (err) {
    logs = []
  }

  logs.push(log)

  fs.writeJsonSync(logPath, logs, { spaces: 2 })
}
