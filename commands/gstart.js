const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

module.exports = {
  execute: async (client, message, args) => {
    var isRole = true

    if(isNaN(parseInt(client.cache.guilds[message.guild.id].settings.canHostGiveaways))){
      isRole = false
    }

    if(!isRole && !message.member.hasPermission(client.cache.guilds[message.guild.id].settings.canHostGiveaways) || isRole == true && !message.member.roles.cache.has(client.cache.guilds[message.guild.id].settings.canHostGiveaways)){
      if(isRole){
        return message.channel.send(client.embeds.error(`You cannot use this command, you need to have this role <@&${client.cache.guilds[message.guild.id].settings.canHostGiveaways}>`, message.author))
      } else {
        return message.channel.send(client.embeds.error(`You cannot use this command, you need to have this permission: \`${client.cache.guilds[message.guild.id].settings.canHostGiveaways}\` `, message.author))
      }
      
    }

    if (args.length < 3) {
      return message.channel.send(client.embeds.error(`You forgot to put some of the arguments needed. Please use the command again`, message.author))
    }

    var ags = {
      time: args[0],
      winners: parseInt(args[1]),
      name: args
    }

    ags.name.shift()
    ags.name.shift()

    ags.name = ags.name.join(' ')

    ags.time = ms(ags.time)

    if (parseInt(ags.time) < 5000) {
      return message.channel.send(client.embeds.error(`The time needs to be more than 5 seconds boomer.`, message.author))
    }

    if (ags.name.length > 50) {
      return message.channel.send(client.embeds.error(`The name of your giveaway needs to be less than 50 characters.`, message.author))
    }

    message.delete()

    await client.giveaways.startGiveaway({
      channel: message.channel,
      prize: ags.name,
      reaction: client.cache.guilds[message.guild.id].settings.reaction || config['DEFAULT_GIVEAWAY_SETTINGS'].emoji,
      hostedBy: message.author,
      time: ags.time,
      winners: ags.winners,
      requirements: {
        messageRequirement: 0,
        inviteRequirement: 0
      },
      claimTime: 0
    })

    // var embed = new MessageEmbed()
    //   .setTitle(ags.name)
    //   .setDescription(`A new giveaway has started! React with ${config['DEFAULT_GIVEAWAY_SETTINGS'].emoji} to enter!\n**Giveaway Time**: ${ms(parseInt(ags.time, { long: true }))}\n**Giveaway Winners**: ${ags.winners} winners.\n**Hosted By**: ${message.author}`)
    //   .setTimestamp()
    //   .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
    //   .setColor(config['COLORS'].success)

    // message.channel.send(embed).then(async (m) => {
    //   await m.react(config['DEFAULT_GIVEAWAY_SETTINGS'].emoji)

    //   await client.db.collection('giveaways').insertOne({
    //     channelID: m.channel.id,
    //     messageID: m.id,
    //     reaction: config['DEFAULT_GIVEAWAY_SETTINGS'].emoji,
    //     endsAt: new Date().getTime() + ags.time,
    //     ended: false,
    //     rerolled: [],
    //     name: ags.name,
    //     winners: ags.winners
    //   })

    //   var reactionListener = m.createReactionCollector((reaction, user) => { return reaction.emoji.name == config['DEFAULT_GIVEAWAY_SETTINGS'].emoji }, {
    //     time: ags.time
    //   })

    //   reactionListener.on('collect', (reaction, user) => {
    //     if (user.bot && user.id != client.user.id) {
    //       return reaction.users.remove(user.id)
    //     }

    //     user.send(client.embeds.success(`Your entry in the giveaway **${ags.name}** has been successfully accepted.`, user)).catch((err) => {
    //       // DMs are closed.
    //     })
    //   })

    //   reactionListener.on('end', () => {

    //   })

    //   setTimeout(async () => {
    //     var reactions = m.reactions.cache.array()
    //     var reaction = null
    //     var r = []

    //     await Promise.all(reactions.map((MessageReaction) => {
    //       if (MessageReaction['_emoji'].name == config['DEFAULT_GIVEAWAY_SETTINGS'].emoji) {
    //         reaction = MessageReaction

    //         reaction.users.cache.array().forEach((user) => {
    //           if (user.bot) {
    //             return
    //           }

    //           r.push(user.id)
    //         })
    //       }
    //     }))

    //     if (r.length < ags.winners) {
    //       await client.db.collection('giveaways').updateOne({
    //         messageID: g.messageID
    //       }, { $set: { ended: true } })

    //       return message.channel.send(client.embeds.error(`A winner couldn't be decided for the [${ags.name}](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${m.id}) giveaway.`, message.author))
    //     }

    //     var winner = r[Math.floor(Math.random() * r.length)]

    //     var giveawayMessage = await message.channel.send(`<@${winner}> has won the giveaway.`)

    //     await client.db.collection('giveaways').updateOne({
    //       messageID: m.id
    //     }, { $set: { ended: true } })

    //     giveawayMessage.edit(client.embeds.success(`Congrats <@${winner}> you have won the [${ags.name}](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${m.id}) giveaway.`, message.author))
    //   }, ags.time)
    // })
  },
  help: {
    name: `gstart`,
    description: `Start a new giveaway quickly with no setup.`,
    alias: ['start'],
    cooldown: 0
  }
}