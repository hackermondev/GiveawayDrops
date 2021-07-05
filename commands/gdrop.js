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

    if (!args[0]) {
      return message.channel.send(client.embeds.error(`You need to provide a valid thing to giveaway drop.`, message.author))
    }

    var item = args.join(' ')

    var embed = new MessageEmbed()
      .setTitle(`Giveaway Drop - ${item}`)
      .setDescription(`HEYA! This is a Giveaway Drop! The first person to react to this giveaway with 🎉 will get **${item}**! This drop is hosted by ${message.author}`)
      .setTimestamp()
      .setColor(config['COLORS'].success)

    var m = await message.channel.send(embed)

    await m.react('🎉')

    var time = new Date().getTime()
    var reaction = await m.awaitReactions((reaction, user) => { return reaction.emoji.name == '🎉' }, {
      max: 1
    })

    var reaction = await reaction.first()

    var user = reaction.users.cache.array()[1]

    var embed = new MessageEmbed()
      .setTitle(`CONGRATS!`)
      .setDescription(`${user} was the first person to react first! Congrats you have earned **${item}** in time. They reacted in ${ms(new Date().getTime() - time, { long: true })}.`)
      .setColor(config['COLORS'].success)
      .setTimestamp()
      .setAuthor(user.username, user.displayAvatarURL())

    message.channel.send(embed)
  },
  help: {
    name: `gdrop`,
    description: `Start a new drop.`,
    alias: ['drop', 'd'],
    cooldown: 0
  }
}