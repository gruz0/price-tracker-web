const path = require('path')
const fs = require('fs-extra')
const uuid = require('uuid')

const botsPath = path.join(process.cwd(), '/data/bots')
const botsLogsPath = path.join(process.cwd(), '/data/bots_logs')

const getBots = () => {
  let bots = []
  const files = fs.readdirSync(botsPath)

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const { id, token } = fs.readJsonSync(botsPath + '/' + file)

      bots.push({ id, token })

      return
    }
  })

  return bots
}

export const getBotByToken = (token) => {
  const bots = getBots()

  return bots.find((c) => c.token === token)
}

export const addBotLog = (bot, args) => {
  const recordId = uuid.v4()

  const log = {
    id: recordId,
    bot_id: bot.id,
    token: bot.token,
    created_at: new Date(),
    ...args,
  }

  const logPath = botsLogsPath + '/' + bot.id + '.json'

  let logs = []

  try {
    logs = fs.readJsonSync(logPath)
  } catch (err) {
    logs = []
  }

  logs.push(log)

  fs.writeJsonSync(logPath, logs, { spaces: 2 })
}
