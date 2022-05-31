const path = require('path')
const fs = require('fs-extra')

const botsPath = path.join(process.cwd(), '/data/bots')

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
