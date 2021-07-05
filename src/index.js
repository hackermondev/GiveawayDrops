require('dotenv').config()
const Discord = require('discord.js')

const config = require('../config.json')
const Statcord = require("statcord.js")
var client = new Discord.Client({
  partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION']
})

var statcord = null

if (config['STATCORD']) {
  statcord = new Statcord.Client({
    client,
    key: config['STATCORD'],
    postCpuStatistics: true,
    postMemStatistics: true,
    postNetworkStatistics: false,
  })
} else {
  statcord = null
}

var dev = process.env.NODE_ENV != 'production'
var database = require('./database')

var { getDuration } = require('../utils/++')
var fs = require('fs')
var chalk = require('chalk')

var db = null
const Giveaway = require('../utils/giveaways.js')

console.info = (text) => {
  console.log(chalk.yellow(text))
}

console.error = (text) => {
  console.log(chalk.red(text))
}

client.cache = {
  guilds: {}
}

client.embeds = {
  success: (message, author) => {
    var embed = new Discord.MessageEmbed()

    embed.setTitle(`Whoo-hoo, it worked!`)
    embed.setColor(config['COLORS'].success)

    embed.setDescription(message)
    embed.setFooter(`Requested by ${author.tag}`, author.displayAvatarURL())
    embed.setTimestamp()

    return embed
  },
  simple: (title, message, author) => {
    var embed = new Discord.MessageEmbed()

    embed.setTitle(title)
    embed.setColor(config['COLORS'].success)

    embed.setDescription(message)
    embed.setFooter(`Requested by ${author.tag}`, author.displayAvatarURL())
    embed.setTimestamp()

    return embed
  },
  error: (message, author) => {
    var embed = new Discord.MessageEmbed()

    embed.setTitle(`Oh no, something bad happened :(`)
    embed.setColor(config['COLORS'].error)

    embed.setDescription(message)
    embed.setFooter(`Requested by ${author.tag}`, author.displayAvatarURL())
    embed.setTimestamp()

    return embed
  }
}

client.commands = new Discord.Collection()
client.members = {}

client.on('ready', async () => {
  if (!dev) {
    if(statcord != null){
      statcord.autopost()
    }
  }

  console.log(chalk.green(`${config['NAME']} (${client.user.tag}) has started with ${client.guilds.cache.size} servers and ${client.users.cache.size} cached users.`))

  db = await database.loadDatabase()

  client.giveaways = new Giveaway(client, db)
  client.db = db
  var status = config['DISCORD_STATUS'][Math.floor(Math.random() * config['DISCORD_STATUS'].length)]

  client.user.setActivity(status.text, { type: status.type })

  setInterval(() => {
    if (config.VERSION == 'dev') {
      console.info(`Changing status.`)
    }

    var status = config['DISCORD_STATUS'][Math.floor(Math.random() * config['DISCORD_STATUS'].length)]

    client.user.setActivity(status.text, { type: status.type })
  }, 25000)

  /* Load Commands */

  var commands = fs.readdirSync(`${__dirname}/../commands`)

  await Promise.all(commands.map((commandFile) => {
    if (!commandFile.endsWith('.js')) {
      return
    }

    var command = require(`../commands/${commandFile}`)

    if (!command.help || !command.execute) {
      return console.error(`Could not load command "${commandFile}": Invalid config`)
    }

    client.commands.set(command.help.name, command)

    if (command.help.alias) {
      command.help.alias.forEach((alias) => {
        client.commands.set(alias, command)
      })
    }
  }))

  /* Load Guilds */

  var guilds = await db.collection('servers').find({}).toArray()

  console.log(`Loading ${guilds.length} guilds.`)

  await Promise.all(guilds.map(async (guild) => {
    delete guild['_id']

    var guild = await client.guilds.fetch(guild.id).then(() => {
      client.cache.guilds[guild.id] = guild
    })
      .catch(async (err) => {
        await db.collection('servers').deleteOne({ id: guild.id })
        // console.log(`Couldn't load guild ${guild.id}`)
      })
  }))

  /* Load Past Giveaways */

  var giveaways = await client.db.collection('giveaways').find({
    ended: false
  }).toArray()

  console.log(`Continuing ${giveaways.length} giveaways.`)

  await Promise.all(giveaways.map(async (g) => {
    if (g.endsAt < new Date().getTime() || g.endsAt == new Date().getTime()) {
      await client.giveaways.checkGiveaway({
        giveawayID: g.giveawayID
      })

      await client.giveaways.endGiveaway({
        giveawayID: g.giveawayID
      })
    } else {
      await client.giveaways.checkGiveaway({
        giveawayID: g.giveawayID
      })

      setInterval(async () => {
        if (g.endsAt == new Date().getTime()) {
          await client.giveaways.endGiveaway({
            giveawayID: g.giveawayID
          })
        }
      }, 01)
    }
  }))

  var pastGiveaways = await client.db.collection('giveaways').find({ ended: true }).toArray()

  console.log(`Clearing unneeded giveaways.`)

  var pastGiveawaysCount = 0

  await Promise.all(pastGiveaways.map(async (pastGiveaway) => {
    if ((new Date().getTime() - pastGiveaway.endsAt) > 432000000) {
      await client.db.collection('giveaways').deleteOne({
        messageID: pastGiveaway.messageID
      })

      pastGiveawaysCount += 1
    }
  }))

  console.log(`Cleared ${pastGiveawaysCount} giveaways.`)
})

client.on('guildCreate', async (guild) => {
  // if (db == null) {
  //   return client.emit('guildCreate', guild)
  // }

  var s = await db.collection('servers').find({
    id: guild.id
  }).toArray()

  if (s[0]) {
    return
  }

  console.info(`I have been added to "${guild.name}"`)

  var serverObject = {
    id: guild.id,
    createdAt: new Date().toString(),
    roles: {
      'blacklisted': false,
      'premium': false,
      'beta': false
    },
    settings: {
      prefix: config['DEFAULT_PREFIX'],
      reaction: config['DEFAULT_GIVEAWAY_SETTINGS'].emoji,
      canHostGiveaways: 'manage_messages'.toUpperCase(),
      autoReactors: {
        enabled: true,
        result: 'GIVEAWAY_BLACKLIST',
        recaptcha: true
      },
      infiniteClaimtime: 'NONE',
      bypassGiveaways: 'NONE'
    }
  }

  await db.collection('servers').insertOne(serverObject)

  client.cache.guilds[guild.id] = serverObject

})

client.on('guildDelete', (guild) => {
  console.info(`I was removed from "${guild.name}"`)
})

client.on('message', async (message) => {
  if (db == null) {
    return
  }

  if (message.author.bot || message.author.system || message.channel.type == 'dm') {
    if (message.channel.type == 'dm' && !message.author.bot) {
      // message.channel.send(`We don't support commands from DMs yet!`)
    }

    return
  }

  var user = await client.db.collection('users').find({
    id: message.author.id
  }).toArray()

  user = user[0]

  if (user) {
    await Promise.all(user.giveaways.map(async (giveaway, index) => {
      var giveawayDatabase = await client.db.collection('giveaways').find({ giveawayID: giveaway.id }).toArray()

      if (!giveawayDatabase[0] || giveawayDatabase[0].ended) {
        return user.giveaways.splice(index, 1)
      }

      giveawayDatabase = giveawayDatabase[0]

      if (giveawayDatabase.serverID != message.guild.id) {
        return
      }

      user.giveaways[index].messages += 1

      if (user.giveaways[index].messages == giveawayDatabase.requirements.messageRequirement) {
        message.author.send(client.embeds.success(`You can now have the valid message requirements for the  [**${giveawayDatabase.name}**](https://discord.com/channels/${message.guild.id}/${giveawayDatabase.channelID}/${giveawayDatabase.messageID}) giveaway.`, message.author))
      }
    }))


    delete user['_id']
    if (user.giveaways.length == 0) {
      await client.db.collection('users').deleteOne({
        id: message.author.id
      })
    } else {
      await client.db.collection('users').updateOne({
        id: message.author.id
      }, { $set: user })
    }
  }

  if (!client.cache.guilds[message.guild.id]) {
    var s = await db.collection('servers').find({
      id: message.guild.id
    }).toArray()

    if (!s[0]) {
      client.emit('guildCreate', message.guild)

      return message.reply(`Please run this command again in 5 seconds. I need to setup a few things.`)
    } else {
      return
    }
  }


  if (message.mentions.has(client.user) && !message.mentions.everyone) {
    return message.channel.send(client.embeds.simple(`Hi! Welcome!`, `Hi, welcome to **${client.user.username}**! I am a **Giveaway Bot** created by Hackermon#1059. I have a lot of cool features that you should check out. Use \`${config['DEFAULT_PREFIX']}ghelp\` to see what i can do.`, message.author))
  }

  if (!message.content.startsWith(client.cache.guilds[message.guild.id].settings.prefix)) {
    return
  }

  let args = message.content.slice(client.cache.guilds[message.guild.id].settings.prefix.length || config['DEFAULT_PREFIX'].length).trim().split(" ")

  let commandName = args.shift().toLowerCase()

  var command = client.commands.get(commandName)

  if (!command) {
    return
  }

  if (!dev) {
    if(statcord){
      statcord.postCommand(command.help.name, message.author.id)
    }
  }

  var perms = message.channel.permissionOverwrites.get(client.user.id)

  // if (!perms || perms.deny.has('SEND_MESSAGES')) {
  //   return message.author.send(`I do not have permission to send messages in **${message.guild.name}** (<#${message.channel.id}>)`).catch((err) => {

  //   })
  // }

  // if(perms.deny.has('EMBED_LINKS')){
  //   return message.channel.send(`I need the permission to \`EMBED_LINKS\` for the bot to work correctly.`)
  // }

  if (command.help.cooldown) {

    if (!client.members[message.author.id]) {
      client.members[message.author.id] = {}
    }

    if (!client.members[message.author.id].commandCooldown) {
      client.members[message.author.id].commandCooldown = {}
    }

    if (!client.members[message.author.id].commandCooldown[command.name]) {
      client.members[message.author.id].commandCooldown[command.name] = new Date().getTime() - (command.help.cooldown + 1)
    } else if ((new Date().getTime() - client.members[message.author.id].commandCooldown[command.name]) < command.help.cooldown) {
      var timeRemaining = command.help.cooldown - (new Date().getTime() - client.members[message.author.id].commandCooldown[command.name])

      return message.channel.send(client.embeds.error(`You need to wait **${getDuration(timeRemaining).toString()}** before using that command.`, message.author))
    } else {
      client.members[message.author.id].commandCooldown[command.name] = new Date().getTime()
    }

  }

  await command.execute(client, message, args)

  client.lastCommand = new Date().getTime()
})

if (dev) {
  client.login(config['TOKENS']['DEV'])
} else {
  client.login(config['TOKENS']['PRODUCTION'])
}

process.on('uncaughtException', (err) => {
  console.error(err)
})