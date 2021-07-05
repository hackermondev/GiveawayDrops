const { MessageEmbed, Permissions } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

module.exports = {
  execute: async (client, message, args) => {
    if (!message.member.hasPermission('administrator'.toUpperCase())) {
      return message.channel.send(client.embeds.error(`You do not have the permission to run his command. You need \`${'administrator'.toUpperCase()}\` to use this command`, message.author))
    }

    var value = args[0]

    if (!value) {
      var embed = new MessageEmbed()
        .setTitle(`Giveaway Settings`)
        .setDescription(`Use \`${client.cache.guilds[message.guild.id].settings.prefix}gsettings <name> <value>\` to change the values`)
        .addField(`Prefix (\`prefix\`)`, client.cache.guilds[message.guild.id].settings.prefix, true)
        .addField(`Emoji (\`emoji\`)`, client.cache.guilds[message.guild.id].settings.reaction, true)
        .addField(`Giveaway Blacklist (\`giveawayblacklist\`)`, client.cache.guilds[message.guild.id].settings.giveawayBlacklist || 'NONE', true)
        .addField(`Giveaway Role/Permissions (\`giveawayperms\`)`, ` **${client.cache.guilds[message.guild.id].settings.canHostGiveaways}**\n\`Anyone with this role and/or permission can start giveaways.\` `, true)
        .addField(`Giveaway Bypass (\`giveawaybypass\`)`, ` **${client.cache.guilds[message.guild.id].settings.bypassGiveaways || 'NONE'}**\n\`Anyone with this role can bypass giveaways requirements.\` `, true)
        .addField(`Infinite Claimtime (\`infclaimtime\`)`, ` **${client.cache.guilds[message.guild.id].settings.infiniteClaimtime || 'NONE'}**\n\`Anyone with this role has infinite claimtime in giveaways..\` `, true)
        .addField(`Auto-Reactors Detection (\`autoreactordetect\`)`, `\`${client.cache.guilds[message.guild.id].settings.autoReactors.enabled.toString().toUpperCase()}\` \nWhether to send a captcha when the bot detect people have autoreactors.`, true)
        .addField(`Auto-Reactors Results (\`autoreactorresults\`)`, `\`${client.cache.guilds[message.guild.id].settings.autoReactors.result.toString().toUpperCase()}\` \n**OPTIONS**: \`GIVEAWAY_BLACKLIST\`,\`BAN\`, \`KICK\` `, true)
        .setAuthor(message.author.username, message.author.displayAvatarURL())
        .setColor(config['COLORS'].success)

      message.channel.send(embed)
      return
    }

    if (value == 'prefix') {
      var prefix = args[1] || '+'

      client.cache.guilds[message.guild.id].settings.prefix = prefix
    }

    if (value == 'emoji') {
      var emoji = args[1] || '🎉'
      var emojiID = null

      if(emoji.split(':')[2]){
        emojiID = emoji.split(':')[2].replace(/ /g,'').replace('>','')
      }

      await message.react(emoji)
        .catch((err) => {
          return message.channel.send(client.embeds.error(`That is not a valid emoji that I can use. (Default emoji or custom emoji in server)`, message.author))
        })
        .then(() => {
          client.cache.guilds[message.guild.id].settings.reaction = emoji

          if(emojiID != null){
            client.cache.guilds[message.guild.id].settings.reactionID = emojiID
          } else {
            delete client.cache.guilds[message.guild.id].settings.reactionID
          }
        })

    }
    
    if(value == 'giveawayperms'){
      var perms = args[1] || 'ADMINISTRATOR'

      var item = null

      try{
        var perms = new Permissions(perms.toUpperCase())
      }
      catch(err){
        perms = args[1]
      }

      perms = perms.replace('<@&', '').replace('>', '')
      
      if(typeof perms == 'string' && !message.guild.roles.cache.get(perms)){
        return message.channel.send(client.embeds.error(`That is not a valid permission or role`, message.author))
      }

      if(typeof perms == 'string'){
        perms = perms.replace('<@&', '').replace('>', '')
      } else {
        perms = args[1].toUpperCase()
      }

      client.cache.guilds[message.guild.id].settings.canHostGiveaways = perms
    }

    if(value == 'autoreactordetect'){
      var option = args[1]

      if(!option){
        option = 'true'
      }

      option = (option == 'true')

      client.cache.guilds[message.guild.id].settings.autoReactors.enabled = option
    }

    if(value == 'autoreactorresults'){
      var results = args[1] || 'GIVEAWAY_BLACKLIST'

      results = results.toUpperCase()
      if(!['GIVEAWAY_BLACKLIST', 'KICK', 'BAN'].includes(results)){
        results = 'GIVEAWAY_BLACKLIST'
      }

      if(results == 'KICK' && !message.guild.member(client.user.id).hasPermission('KICK_MEMBERS')){
        return message.channel.send(client.embeds.error(`You cannot set this permission because the bot doesn't have kick members permission.`, message.author))
      }

      if(results == 'BAN' && !message.guild.member(client.user.id).hasPermission('BAN_MEMBERS')){
        return message.channel.send(client.embeds.error(`You cannot set this permission because the bot doesn't have ban members permission.`, message.author))
      }

      if(results == 'GIVEAWAY_BLACKLIST' && !client.cache.guilds[message.guild.id] .settings.giveawayBlacklist){
        return message.channel.send(client.embeds.error(`You cannot set this permission because there is no giveaway blacklist role.`, message.author))
      }

      client.cache.guilds[message.guild.id].settings.autoReactors.result = results
    }

    if(value == 'giveawayblacklist'){
      var role = args[1]

      if(!role){
        return message.channel.send(client.embeds.error(`You need to include a valid role`, message.author))
      }

      role = role.replace('<@&', '').replace('>', '')
      
      if(!message.guild.roles.cache.get(role)){
        return message.channel.send(client.embeds.error(`You need to include a valid role`, message.author))
      }

      var role = message.guild.roles.cache.get(role)

      if(message.guild.member(client.user.id).roles.highest.position < role.position || message.guild.member(client.user.id).roles.highest.position == role.position){
        return message.channel.send(client.embeds.error(`You need to include a role that is below the bot`, message.author))
      }

      client.cache.guilds[message.guild.id] .settings.giveawayBlacklist = role      
    }

    if(value == 'giveawaybypass'){
      var role = args[1]

      if(!role){
        return message.channel.send(client.embeds.error(`You need to include a valid role`, message.author))
      }

      role = role.replace('<@&', '').replace('>', '')
      
      if(!message.guild.roles.cache.get(role)){
        return message.channel.send(client.embeds.error(`You need to include a valid role`, message.author))
      }

      client.cache.guilds[message.guild.id] .settings.bypassGiveaways = role      
    }

    if(value == 'infclaimtime'){
      var role = args[1]

      if(!role){
        return message.channel.send(client.embeds.error(`You need to include a valid role`, message.author))
      }

      role = role.replace('<@&', '').replace('>', '')
      
      if(!message.guild.roles.cache.get(role)){
        return message.channel.send(client.embeds.error(`You need to include a valid role`, message.author))
      }

      client.cache.guilds[message.guild.id] .settings.infiniteClaimtime = role      
    }

    await client.db.collection('servers').updateOne({
      id: client.cache.guilds[message.guild.id].id
    }, { $set: client.cache.guilds[message.guild.id] })

    message.channel.send(client.embeds.success(`Your changes have been successfully saved.`, message.author))
  },
  help: {
    name: `gsettings`,
    description: `Get the settings for the `,
    alias: ['settings'],
    cooldown: 0
  }
}