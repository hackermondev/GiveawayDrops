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

    var ags = {
      time: null,
      winners: null,
      name: null,
      messageRequirement: 0,
      inviteRequirement: 0
    }

    var embed = new MessageEmbed()
      .setTitle(`Giveaway Setup`)
      .setAuthor(message.author.username, message.author.displayAvatarURL())
      .setFooter(`Thank you for using this bot.`)
      .setColor(config['COLORS'].success)

    embed.setDescription(`How long should the giveaway be hosted for? (Time: 2h, 1h, 1w, 2y)`)

    await message.channel.send(embed)

    var m = await message.channel.awaitMessages((m) => { return m.author.id == message.author.id }, {
      max: 1
    })

    m = await m.first()

    ags.time = ms(m.content)

    embed.setDescription(`How many winners should there be?`)

    await message.channel.send(embed)

    var m = await message.channel.awaitMessages((m) => { return m.author.id == message.author.id }, {
      max: 1
    })

    m = await m.first()

    ags.winners = parseInt(m.content)

    if (isNaN(ags.winners)) {
      return message.channel.send(client.embeds.error(`This value must be a number`, message.author))
    }

    embed.setDescription(`What is the message requirements? (Say **None** if none.) \n*The bot will count the messages after the giveaway and automatically only pick people who do the requirement*`)

    await message.channel.send(embed)

    var m = await message.channel.awaitMessages((m) => { return m.author.id == message.author.id }, {
      max: 1
    })

    m = await m.first()

    ags.messageRequirement = parseInt(m.content)

    if (m.content.toLowerCase() == 'none') {
      ags.messageRequirement = 0
    }

    if (isNaN(ags.messageRequirement)) {
      return message.channel.send(client.embeds.error(`This value must be a number`, message.author))
    }

    // embed.setDescription(`What is the invite requirements? (Say **None** if none.) \n*The bot will count how many people the user has invited after the giveaway and only pick people who do the requirement*`)

    // await message.channel.send(embed)

    // var m = await message.channel.awaitMessages((m)=>{return m.author.id == message.author.id}, {
    //   max: 1
    // })

    // m = await m.first()

    ags.inviteRequirement = 0

    // if(m.content.toLowerCase() == 'none'){
    //   ags.inviteRequirement = 0
    // }

    // if(isNaN(ags.inviteRequirement)){
    //   return message.channel.send(client.embeds.error(`This value must be a number`, message.author))
    // }

    embed.setDescription(`How long do the users have to claimed? (Example 2m, 2h, 10m)\n*Say \`none\` if there is no claim time*`)

    await message.channel.send(embed)

    var m = await message.channel.awaitMessages((m) => { return m.author.id == message.author.id }, {
      max: 1
    })

    m = await m.first()

    if (m.content.toLowerCase() == 'none') {
      ags.claimedTime = 0
    } else {
      ags.claimedTime = ms(m.content)
    }


    embed.setDescription(`What channel is the giveaway hosted in?`)

    await message.channel.send(embed)

    var m = await message.channel.awaitMessages((m) => { return m.author.id == message.author.id }, {
      max: 1
    })

    m = await m.first()

    var channel = m.mentions.channels.first()

    if (!channel) {
      return message.channel.send(client.embeds.error(`You need to provide a valid channel`, message.author))
    }

    ags.channel = channel

    embed.setDescription(`What are you giving away?`)

    await message.channel.send(embed)

    var m = await message.channel.awaitMessages((m) => { return m.author.id == message.author.id }, {
      max: 1
    })

    m = await m.first()

    ags.name = m.content
    await client.giveaways.startGiveaway({
      channel: ags.channel,
      reaction: client.cache.guilds[message.guild.id].settings.reaction || config['DEFAULT_GIVEAWAY_SETTINGS'].emoji,
      prize: ags.name,
      winners: ags.winners,
      hostedBy: message.author,
      requirements: {
        messageRequirement: ags.messageRequirement,
        inviteRequirement: ags.inviteRequirement
      },
      time: ags.time,
      claimTime: ags.claimedTime
    })
  },
  help: {
    name: `gsetup`,
    description: `Setup a new giveaway in a channel.`,
    alias: ['setup'],
    cooldown: 0
  }
}