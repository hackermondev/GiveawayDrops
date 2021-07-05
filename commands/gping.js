const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')


module.exports = {
  execute: async (client, message, args)=>{
    var time = 0

    var timeInterval = setInterval(()=>{
      time++
    }, 01)

    var m = await message.channel.send(`Ping: **Pinging**, Websocket: **${client.ws.ping}ms**, Database Ping: **Pinging**`)

    clearInterval(timeInterval)

    var databaseping = 0

    var databaseInterval = setInterval(()=>{
      databaseping++
    }, 01)

    await client.db.collection('giveaways').find({}).toArray()

    clearInterval(databaseInterval)

    m.edit(`Ping: **${time}ms**, Websocket: **${client.ws.ping}ms**, Database Ping: **${databaseping}ms**`) 
  },
  help: {
    name: `gping`,
    description: `See the bots ping.`,
    alias: ['ping'],
    cooldown: 0
  }
}