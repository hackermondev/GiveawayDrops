const { MessageEmbed, MessageAttachment } = require('discord.js')
var ms = require('ms')
var config = require('../config.json')

var uuid = require('uuid')
// var fetch = require('node-fetch')

var textToImage = require('text-to-image')

class Giveaways {
  constructor(client, db) {
    this.client = client
    this.db = db
  }

  async startGiveaway({ channel, reaction, prize, time, winners, hostedBy, requirements, claimTime }) {
    var giveawayID = uuid.v4()

    var embed = new MessageEmbed()
      .setTitle(prize)
      .setDescription(`A new giveaway has started! React with ${reaction} to enter!\n**Giveaway Time**: ${ms(parseInt(time, { long: true }))}\n**Giveaway Winners**: ${winners} winners.\n**Hosted By**: ${hostedBy}\n**Claim Time**: ${ms(claimTime, { long: true })}`)
      .setTimestamp(new Date().getTime() + time)
      .setAuthor(hostedBy.username, hostedBy.displayAvatarURL({ dynamic: true }))
      .setColor(config['COLORS'].success)

    if (requirements.messageRequirement != 0 || requirements.inviteRequirement != 0) {
      embed.setDescription(`A new giveaway has started! React with ${reaction} to enter!\n**Giveaway Time**: ${ms(parseInt(time, { long: true }))}\n**Giveaway Winners**: ${winners} winners.\n**Hosted By**: ${hostedBy}\n**Claim Time**: ${ms(claimTime, { long: true })}\n\n**Requirements**:\n- ${requirements.messageRequirement} messages\n- ${requirements.inviteRequirement} invites`)
    }

    channel.send(embed).then(async (m) => {
      var giveawayCreated = new Date().getTime()
      var allowed = {}

      await m.react(reaction)

      await this.db.collection('giveaways').insertOne({
        channelID: m.channel.id,
        messageID: m.id,
        reaction: this.client.cache.guilds[channel.guild.id].settings.reaction || config['DEFAULT_GIVEAWAY_SETTINGS'].emoji,
        reactionID: this.client.cache.guilds[channel.guild.id].settings.reactionID,
        endsAt: new Date().getTime() + time,
        ended: false,
        rerolled: [],
        name: prize,
        winners: winners,
        giveawayID: giveawayID,
        hostedBy: hostedBy.id,
        requirements,
        claimTime,
        giveawayTime: time,
        serverID: m.channel.guild.id
      })

      var reactionListener = m.createReactionCollector((reaction, user) => { return reaction.emoji.name == this.client.cache.guilds[channel.guild.id].settings.reaction || config['DEFAULT_GIVEAWAY_SETTINGS'].emoji }, {
        time: time
      })

      reactionListener.on('collect', async (reaction, user) => {
        if (user.bot && user.id != client.user.id) {
          return reaction.users.remove(user.id)
        }

        if (channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.giveawayBlacklist)) {
          user.send(`You couldn't join the giveaway because you are blacklisted.`)
          return reaction.users.remove(user.id)
        }

        var reputation = 0

        if (allowed[user.id] == false) {
          reputation -= 3
        }

        if ((new Date().getTime() - giveawayCreated) < 15000) {
          reputation -= 1
        }

        if (!channel.guild.member(user.id).lastMessageID) {
          reputation -= 1
        }

        if (user.presence.status == 'offline') {
          reputation -= 1
        }

        if (channel.guild.member(user.id).roles.cache.array() < 2) {
          reputation -= 1
        }

        if (user.avatar == null) {
          reputation -= 1
        }

        if (new Date().getTime() - user.createdAt.getTime() < 7.88923149e9) {
          reputation -= 1
        }

        if (reputation < -3 || reputation == -3) {
          if (allowed[user.id] == true) {
            return
          }

          reaction.users.remove(user.id)
          allowed[user.id] = false

          var captcha = Math.random().toString(36).slice(2, 8)

          /* Generate image from text */

          var image = await textToImage.generate(captcha, {
            bgColor: `#046307`,
            fontFamily: `arial`,
            fontSize: 10,
            textColor: `#50c878`
          })

          var imagebuff = new Buffer.from(image.split(",")[1], "base64")

          // var req = await fetch(`http://api.img4me.com/?text=${captcha}&font=arial&fcolor=50c878&size=10&bcolor=046307&type=png`)

          // var image = await req.text()

          var embed = new MessageEmbed()
            .setTitle(`Captcha`)
            .setDescription(`Your entry in the giveaway **${prize}** has been removed. Please complete this simple captcha to prove that you are not an auto-reactor.`)
            .setColor(config['COLORS'].success)
            // .setImage(image)
            .setFooter(`:)`)

          var attachment = new MessageAttachment(imagebuff, "output.png")

          user.send({embed, files: [attachment] })
            .catch((err) => {
              console.error(err)
              channel.send(`${user}, please open your DMs so I can send you a message.`).then((m) => {
                setTimeout(() => {
                  m.delete()
                }, 3000)
              })
            })
            .then(async (m) => {
              if(!m){
                return
              }

              var m = await m.channel.awaitMessages((m) => {
                return m.author.id == user.id
              }, {
                max: 1,
                time: 3 * 60000
              })

              var m = await m.first()

              if(!m){
                m = {
                  content: uuid.v4()
                }
              }

              if (m.content == captcha) {
                allowed[user.id] = true

                user.send(this.client.embeds.success(`Your captcha has been successful. You may now react again to the giveaway.`, user))
              } else {
                var result = this.client.cache.guilds[channel.guild.id].settings.autoReactors.result

                user.send(this.client.embeds.error(`Your captcha was failed.`, user))

                if(result == 'GIVEAWAY_BLACKLIST'){
                  channel.guild.member(user.id).roles.add(this.client.cache.guilds[channel.guild.id].settings.giveawayBlacklist)
                } else if(result == 'KICK'){
                  await user.send(`You have been kicked from the server.`)

                  channel.guild.member(user.id).kick(`Auto reactor detected.`)
                } else if(result == 'BAN'){
                  await user.send(`You have been banned from the server.`)

                  channel.guild.member(user.id).ban({
                    reason: `Auto reactor detected.`
                  })
                }
              }
            })
        } else {
          var users = await this.client.db.collection('users').find({ id: user.id }).toArray()

          if (!users[0]) {
            await this.client.db.collection('users').insertOne({
              id: user.id,
              giveaways: [{
                id: giveawayID,
                messages: 0,
                invites: 0
              }]
            })

            if (requirements.messageRequirement != 0 && !channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.bypassGiveaways) ) {
              reaction.users.remove(user.id)

              user.send(this.client.embeds.error(`Your entry in the giveaway **${prize}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
                // DMs are closed.
              })
              return
            }
          } else if(!channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.bypassGiveaways)) {
            if (!users[0].giveaways[0]) {
              users[0].giveaways.push({
                id: giveawayID,
                messages: 0,
                invites: 0
              })

              if (requirements.messageRequirement != 0) {
                reaction.users.remove(user.id)

                user.send(this.client.embeds.error(`Your entry in the giveaway **${prize}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
                  // DMs are closed.
                })
                return
              }

            } else {
              var alreadyExists = false
              var doesntMeetRequirement = false

              await Promise.all(users[0].giveaways.map((giveaway, index) => {
                if (giveaway.id == giveawayID) {
                  alreadyExists = true

                  if (requirements.messageRequirement != 0 && giveaway.messages != requirements.messageRequirement) {
                    doesntMeetRequirement = true
                  }
                }
              }))

              if (!alreadyExists) {
                users[0].giveaways.push({
                  id: giveawayID,
                  messages: 0,
                  invites: 0
                })

                if (requirements.messageRequirement != 0) {
                  reaction.users.remove(user.id)

                  user.send(this.client.embeds.error(`Your entry in the giveaway **${prize}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
                    // DMs are closed.
                  })
                  return
                }

              }

              if (doesntMeetRequirement == true) {
                reaction.users.remove(user.id)

                user.send(this.client.embeds.error(`Your entry in the giveaway **${prize}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
                  // DMs are closed.
                })
                return
              }
            }

            await this.client.db.collection('users').updateOne({
              id: user.id
            }, { $set: users[0] })
          }

          user.send(this.client.embeds.success(`Your entry in the giveaway **${prize}** has been successfully accepted.`, user)).catch((err) => {
            // DMs are closed.
          })
        }
      })

      reactionListener.on('end', () => {

      })

      var endsAt = new Date().getTime() + time

      var interval = setInterval(() => {
        if (new Date().getTime() == endsAt || new Date().getTime() > endsAt) {
          this.endGiveaway({
            giveawayID
          })

          clearInterval(interval)
        }
      }, 1)

      // setTimeout(async () => {
      //   this.endGiveaway({
      //     giveawayID
      //   })
      // }, time)
    })

    return giveawayID
  }

  async endGiveaway({ giveawayID }) {
    var giveaway = await this.db.collection('giveaways').find({
      giveawayID: giveawayID
    }).toArray()

    if (!giveaway[0]) {
      throw new Error(`Giveaway does not exist.`)
    }

    var giveaway = giveaway[0]

    // if (giveaway.ended) {
    //   throw new Error(`Giveaway already ended`)
    // }

    var channel = this.client.channels.cache.get(giveaway.channelID)

    if (!channel) {
      return
    }

    var m = await channel.messages.fetch(giveaway.messageID)

    if (!m) {
      return
    }

    /* Make sure the owner and reactions is cached */

    this.client.users.fetch(giveaway.hostedBy, { cached: true })


    var reactions = m.reactions.cache.array()

    var reaction = null
    var r = []

    await Promise.all(reactions.map((MessageReaction) => {
      if (MessageReaction['_emoji'].id != null && MessageReaction['_emoji'].id == giveaway.reactionID || MessageReaction['_emoji'].id == null && MessageReaction['_emoji'].name == giveaway.reaction) {
        reaction = MessageReaction

        reaction.users.fetch()
        reaction.users.cache.array().forEach((user) => {
          if (user.bot) {
            return
          }

          if (channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.giveawayBlacklist)) {
            user.send(`You couldn't join the giveaway because you are blacklisted.`)
            return reaction.users.remove(user.id)
          }

          r.push(user.id)
        })
      }
    }))

    if (r.length < giveaway.winners) {
      await this.client.db.collection('giveaways').updateOne({
        messageID: giveaway.messageID
      }, { $set: { ended: true, endAt: new Date().getTime() } })

      if (!this.client.users.cache.get(giveaway.hostedBy)) {
        giveaway.hostedBy = this.client.user.id
      }

      var giveawayEmbed = new MessageEmbed()
        .setTitle(giveaway.name)
        .setDescription(`The giveaway has ended.\n**Giveaway Time**:  ${ms(giveaway.giveawayTime, { long: true })}\n**Giveaway Winners**: ${giveaway.winners} winners\n**Hosted By**: ${this.client.users.cache.get(giveaway.hostedBy)}\n**Winner**: **Could not be decided.**`)
        .setColor(`#964b00`)
        .setAuthor(this.client.users.cache.get(giveaway.hostedBy).username, this.client.users.cache.get(giveaway.hostedBy).displayAvatarURL())

      await m.edit(giveawayEmbed)

      return channel.send(this.client.embeds.error(`A winner couldn't be decided for the [${giveaway.name}](https://discord.com/channels/${channel.guild.id}/${channel.id}/${m.id}) giveaway.`, this.client.user))
    }

    var winnersList = []

    for (var i = 0; i < giveaway.winners; i++) {
      var winner = r[Math.floor(Math.random() * r.length)]

      winnersList.push(`<@${winner}>`)
    }


    var giveawayEmbed = new MessageEmbed()
      .setTitle(giveaway.name)
      .setDescription(`The giveaway has ended.\n**Giveaway Time**:  ${ms(new Date().getTime() - giveaway.endsAt)}\n**Giveaway Winners**: ${giveaway.winners} winners\n**Hosted By**: ${this.client.users.cache.get(giveaway.hostedBy)}\n**Winner**: **${winnersList.join(',')}**`)
      .setColor(`#9531a8`)
      .setAuthor(this.client.users.cache.get(giveaway.hostedBy).username, this.client.users.cache.get(giveaway.hostedBy).displayAvatarURL())

    await m.edit(giveawayEmbed)

    if (giveaway.claimTime == 0) {
      var giveawayMessage = await channel.send(`${winnersList.join(',')} has won the giveaway.`)
    } else {
      var giveawayMessage = await channel.send(`${winnersList.join(',')} has won the giveaway. They have ${ms(giveaway.claimTime, { long: true })} to claim.`)
    }

    winnersList.forEach((winner) => {
      var w = winner.replace('<@', '').replace('>', '')

      var user = this.client.users.cache.get(w)

      if (!user) {
        return
      }

      if (giveaway.claimTime == 0) {
        user.send(`Congrats, you have won the giveaway in <#${channel.id}>.`).catch((err) => {

        })
      } else {
        user.send(`Congrats, you have won the giveaway in <#${channel.id}>, use \`${this.client.cache.guilds[channel.guild.id].settings.prefix}gclaim ${m.id}\` to claim your prize.`).catch((err) => {

        })
      }
    })

    if(giveaway.claimTime == 0){
      giveawayMessage.edit(this.client.embeds.success(`Congrats ${winnersList.join(',')} you have won the [${giveaway.name}](https://discord.com/channels/${channel.guild.id}/${channel.id}/${m.id}) giveaway.`, this.client.user))
    } else {
      giveawayMessage.edit(this.client.embeds.success(`Congrats ${winnersList.join(',')} you have won the [${giveaway.name}](https://discord.com/channels/${channel.guild.id}/${channel.id}/${m.id}) giveaway. If your DMs are open you have been sent a DM, otherwise you can use the \`${this.client.cache.guilds[channel.guild.id].settings.prefix}gclaim ${m.id}\` `, this.client.user))
    }

    var claimed = {}

    if (giveaway.claimTime != 0) {
      var claimMessage = await channel.send(`Claimed: \n${
        winnersList.map((winners) => {
          claimed[winners.replace('<@', '').replace('>', '')] = false
          return `${winners}: :x:\n`
        })
        }`)
    }

    if (claimMessage) {
      await this.client.db.collection('giveaways').updateOne({
        messageID: m.id
      }, { $set: { ended: true, winner: winnersList, claimed, endAt: new Date().getTime(), claimMessage: claimMessage.id } })
    } else {
      await this.client.db.collection('giveaways').updateOne({
        messageID: m.id
      }, { $set: { ended: true, winner: winnersList, claimed, endAt: new Date().getTime() } })
    }
  }

  async rerollGiveaways({ giveawayID }) {
    var giveaway = await this.db.collection('giveaways').find({
      giveawayID: giveawayID
    }).toArray()

    if (!giveaway[0]) {
      throw new Error(`Giveaway does not exist.`)
    }

    var giveaway = giveaway[0]

    delete giveaway['_id']

    giveaway.ended = true
    giveaway.rerolled = giveaway.rerolled.concat(giveaway.winner)

    giveaway.winner = null

    await this.client.db.collection('giveaways').updateOne({
      messageID: giveaway.messageID
    }, { $set: giveaway })

    this.endGiveaway({ giveawayID })
  }

  /* Make sure giveaway reactions have correct requirement */

  async checkGiveaway({ giveawayID }) {
    var giveaway = await this.db.collection('giveaways').find({
      giveawayID: giveawayID
    }).toArray()

    if (!giveaway[0]) {
      throw new Error(`Giveaway does not exist.`)
    }

    var giveaway = giveaway[0]

    // if (giveaway.ended) {
    //   throw new Error(`Giveaway already ended`)
    // }

    var channel = this.client.channels.cache.get(giveaway.channelID)

    if (!channel) {
      return
    }

    var m = await channel.messages.fetch(giveaway.messageID)

    if (!m) {
      return
    }

    var requirements = giveaway.requirements
    /* Make sure the owner and reactions is cached */

    this.client.users.fetch(giveaway.hostedBy, { cached: true })


    var reactions = m.reactions.cache.array()

    var reaction = null
    var r = []

    await Promise.all(reactions.map(async (MessageReaction) => {
      if (MessageReaction['_emoji'].id != null && MessageReaction['_emoji'].id == giveaway.reactionID || MessageReaction['_emoji'].id == null && MessageReaction['_emoji'].name == giveaway.reaction) {
        reaction = MessageReaction

        // console.log(reaction)
        await reaction.users.fetch()
        await Promise.all(reaction.users.cache.array().map(async (user) => {
          if (user.bot) {
            return
          }

          var u = await channel.guild.members.fetch(user.id)

          if (channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.giveawayBlacklist)) {
            user.send(`You couldn't join the giveaway because you are blacklisted.`)
            return reaction.users.remove(user.id)
          }

          r.push(user.id)
        }))
      }
    }))

    r.forEach(async (user) => {
      var user = this.client.users.cache.get(user)
      if (user.bot && user.id != client.user.id) {
        return reaction.users.remove(user.id)
      }

      if (channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.giveawayBlacklist)) {
        user.send(`You couldn't join the giveaway because you are blacklisted.`)
        return reaction.users.remove(user.id)
      }


      var users = await this.client.db.collection('users').find({ id: user.id }).toArray()

      if (!users[0]) {
        await this.client.db.collection('users').insertOne({
          id: user.id,
          giveaways: [{
            id: giveawayID,
            messages: 0,
            invites: 0
          }]
        })

        if (requirements.messageRequirement != 0 && !channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.bypassGiveaways)) {
          reaction.users.remove(user.id)

          user.send(this.client.embeds.error(`Your entry in the giveaway **${giveaway.name}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
            // DMs are closed.
          })
          return
        }
      } else if(!channel.guild.member(user.id).roles.cache.has(this.client.cache.guilds[channel.guild.id].settings.bypassGiveaways)) {
        if (!users[0].giveaways[0]) {
          users[0].giveaways.push({
            id: giveawayID,
            messages: 0,
            invites: 0
          })

          if (requirements.messageRequirement != 0) {
            reaction.users.remove(user.id)

            user.send(this.client.embeds.error(`Your entry in the giveaway **${giveaway.name}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
              // DMs are closed.
            })
            return
          }

        } else {
          var alreadyExists = false
          var doesntMeetRequirement = false

          await Promise.all(users[0].giveaways.map((giveaway, index) => {
            if (giveaway.id == giveawayID) {
              alreadyExists = true

              if (requirements.messageRequirement != 0 && giveaway.messages != requirements.messageRequirement) {
                doesntMeetRequirement = true
              }
            }
          }))

          if (!alreadyExists) {
            users[0].giveaways.push({
              id: giveawayID,
              messages: 0,
              invites: 0
            })

            if (requirements.messageRequirement != 0) {
              reaction.users.remove(user.id)

              user.send(this.client.embeds.error(`Your entry in the giveaway **${giveaway.name}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
                // DMs are closed.
              })
              return
            }

          }

          if (doesntMeetRequirement == true) {
            reaction.users.remove(user.id)

            user.send(this.client.embeds.error(`Your entry in the giveaway **${giveaway.name}** has been denied. You did not meet the message requirement.`, user)).catch((err) => {
              // DMs are closed.
            })
            return
          }
        }

        await this.client.db.collection('users').updateOne({
          id: user.id
        }, { $set: users[0] })
      }

      user.send(this.client.embeds.success(`Your entry in the giveaway **${giveaway.name}** has been successfully accepted.`, user)).catch((err) => {
        // DMs are closed.
      })
    })
  }
}


module.exports = Giveaways