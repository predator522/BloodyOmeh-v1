import fs from 'fs'
import path from 'path'

const commands = {}

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const commandPath = path.resolve('./commands', file)
  const command = await import(`file://${commandPath}`)
  if (command.default && command.default.name) {
    commands[command.default.name] = command.default
  }
}

export default commands
