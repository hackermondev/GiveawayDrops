const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

module.exports = {
  execute: async (client, message, args)=>{
    if(!client.lastCommand){
      client.lastCommand = new Date().getTime()
    }

    var giveaway = await client.db.collection('giveaways').find({ ended: true }).toArray()

    var embed = new MessageEmbed()
      .setTitle(`Bot Info`)
      .addField(`USERNAME`, client.user.username, true)
      .addField(`VERSION`, `1.0`, true)
      .addField(`UPTIME`, ms(client.uptime, { long: true }), true)
      .addField(`CURRENT GIVEAWAYS`, `${giveaway.length} giveaways.`, true)
      .addField(`SERVERS`, `${client.guilds.cache.size} servers`, true)
      .addField(`LAST COMMAND`, ms(new Date().getTime() - client.lastCommand, { long: true }), true)
      .setColor(config['COLORS'].success)
      .setTimestamp()
      .setAuthor(client.user.username, client.user.displayAvatarURL())
    
    message.channel.send(embed)
  },
  help: {
    name: `botinfo`,
    description: `View information about the bot.`,
    alias: ['stats', 'gbotinfo', 'about', 'gabout'],
    cooldown: 0
  }
}