const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

module.exports = {
  execute: async (client, message, args) => {

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

    delete giveaway[0]['_id']
    var hasWon = false

    await Promise.all(giveaway[0].winner.map((w) => {
      if (w.replace('<@', '').replace('>', '') == message.author.id) {
        hasWon = true
      }
    }))

    if (!hasWon || !giveaway[0].ended) {
      return message.channel.send(client.embeds.error(`You have not won this giveaway`, message.author))
    }

    if (giveaway[0].claimTime != 0 && (new Date().getTime() - giveaway[0].endAt) > giveaway[0].claimTime && !channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.infiniteClaimtime) ) {
      return message.channel.send(client.embeds.error(`You did not claim it in time.`, message.author))
    }

    giveaway[0].claimed[message.author.id] = true

    var channel = client.channels.cache.get(giveaway[0].channelID)

    if (!channel) {
      return
    }

    if(!giveaway[0].claimMessage){
      return message.channel.send(client.embeds.error(`You do not have to claim this giveaway since there is no claim time.`, message.author))
    }

    var m = await channel.messages.fetch(giveaway[0].claimMessage)

    await channel.send(`<@${message.author.id}> has claimed. (<@${giveaway[0].hostedBy}>)`, { embed: client.embeds.success(`<@${message.author.id}> has successfully claimed the [**${giveaway[0].name}**](https://discord.com/channels/${message.guild.id}/${giveaway[0].channelID}/${giveaway[0].messageID}) giveaway.`, message.author) })

    if (!m) {
      return
    }

    m.edit(`Claimed: \n${
      Object.keys(giveaway[0].claimed).map((winner) => {
        if (giveaway[0].claimed[winner] == false) {
          return `<@${winner}>: :x:\n`
        } else {
          return `<@${winner}>: :white_check_mark: \n`
        }
      })
      }`)

    message.channel.send(client.embeds.success(`You have successfully claimed it in time.`, message.author))
  },
  help: {
    name: `gclaim`,
    description: `Claim a giveaway that you have won.`,
    alias: ['claim', 'c'],
    cooldown: 0
  }
}