const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

module.exports = {
  execute: async (client, message, args) => {
    var isRole = true

    if (isNaN(parseInt(client.cache.guilds[message.guild.id].settings.canHostGiveaways))) {
      isRole = false
    }

    if (!isRole && !message.member.hasPermission(client.cache.guilds[message.guild.id].settings.canHostGiveaways) || isRole == true && !message.member.roles.cache.has(client.cache.guilds[message.guild.id].settings.canHostGiveaways)) {
      if (isRole) {
        return message.channel.send(client.embeds.error(`You cannot use this command, you need to have this role <@&${client.cache.guilds[message.guild.id].settings.canHostGiveaways}>`, message.author))
      } else {
        return message.channel.send(client.embeds.error(`You cannot use this command, you need to have this permission: \`${client.cache.guilds[message.guild.id].settings.canHostGiveaways}\` `, message.author))
      }

    }

    var messageID = args[0]

    if (!messageID) {
      return message.channel.send(client.embeds.error(`You forgot to put some of the arguments needed. Please use the command again`, message.author))
    }

    var giveaway = await client.db.collection('giveaways').find({
      messageID: messageID
    }).toArray()

    if (!giveaway[0]) {
      return message.channel.send(client.embeds.error(`You need to include a valid message ID.`, message.author))
    }

    await client.giveaways.endGiveaway({
      giveawayID: giveaway[0].giveawayID
    })

    message.channel.send(client.embeds.success(`The giveaway has been ended succesfully.`, message.author))
  },
  help: {
    name: `gend`,
    description: `End a giveaway in the channel.`,
    alias: ['end'],
    cooldown: 0
  }
}