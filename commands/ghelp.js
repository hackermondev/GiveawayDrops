const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')


module.exports = {
  execute: async (client, message, args)=>{
    var embed = new MessageEmbed()
      .setTitle(`Help Command - ${client.user.username}`)
      .addField(`MAIN COMMANDS`, ` \`${client.cache.guilds[message.guild.id].settings.prefix}ghelp\`, \`${client.cache.guilds[message.guild.id].settings.prefix}gbotinfo\``)
      .addField(`GIVEAWAYS`, ` \`${client.cache.guilds[message.guild.id].settings.prefix}gsetup\`, \`${client.cache.guilds[message.guild.id].settings.prefix}gstart\`, \`${client.cache.guilds[message.guild.id].settings.prefix}greroll\`, \`${client.cache.guilds[message.guild.id].settings.prefix}gend\`, \`${client.cache.guilds[message.guild.id].settings.prefix}gclaim\``)
      .addField(`OTHER COMMANDS`, `\`${client.cache.guilds[message.guild.id].settings.prefix}gdrop\`,  \`${client.cache.guilds[message.guild.id].settings.prefix}gsettings\` `)
      .setColor(config['COLORS'].success)
      .setTimestamp()
      .setAuthor(message.author.username, message.author.displayAvatarURL())
    
    message.channel.send(embed)

  },
  help: {
    name: `help`,
    description: `See all the commands on the bot.`,
    alias: ['ghelp', 'h'],
    cooldown: 0
  }
}