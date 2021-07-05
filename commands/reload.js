const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

module.exports = {
  execute: (client, message, args)=>{
    if(!config['OWNERS'].includes(message.author.id)){
      return
    }

    if(args.length < 1){
      return message.channel.send(client.embeds.error(`You forgot to put some of the arguments needed. Please use the command again`, message.author))
    }

    var command = args[0]

    try{
      delete require.cache[require.resolve(`../commands/${command}.js`)]

      var command = require(`../commands/${command}.js`)

      if(!command.help || !command.execute){
        throw new Error(`Invalid command handler`)
      }
    }
    catch(err){
      return message.channel.send(client.embeds.error(`Error while reloading command.\n\n \`\`\`${err.toString()}\`\`\` `, message.author)) 
    }

    client.commands.set(command.help.name, command)

    command.help.alias.forEach((alias)=>{
      client.commands.set(alias, command)
    })

    message.channel.send(client.embeds.success(`The command \`${command.help.name}\` has been reloaded.`, message.author))
  },
  help: {
    name: `reload`,
    description: `Reload a command on the bot. This is mostly useful for developers.`,
    alias: [],
    cooldown: 0
  }
}