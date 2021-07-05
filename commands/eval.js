const { MessageEmbed } = require('discord.js')
var config = require('../config.json')
var ms = require('ms')

var PastebinAPI = require('pastebin-js')
var util = require('util')

var pastebin = new PastebinAPI(config['API']['PASTEBIN']);

module.exports = {
  execute: async (client, message, args)=>{
    if(!config['OWNERS'].includes(message.author.id)){
      return
    }

    if(args.length < 1){
      return message.channel.send(client.embeds.error(`Please enter some values to eval.`, message.author))
    }

    var evalCode = args.join(' ')

    try{
      var evalResults = await eval(evalCode)
    }
    catch(err){
      var evalResults = err
    }

    if(typeof evalResults != 'string'){
      evalResults = util.inspect(evalResults)
      // if(typeof evalResults == 'object'){
      //   evalResults = JSON.stringify(evalResults)
      // } 
    }

    evalResults = evalResults.replace(client.token, `BOT_TOKEN`)

    if(evalResults.length > 3000){
      if(!config['API']['PASTEBIN']){
        evalResults = `The text was too big to send on Discord & a pastebin api key is not connected.`
      } else {
        var bin = await pastebin.createPaste({
          text: evalResults,
          title: `Eval ${new Date().getTime()}`,
          format: null
        })

        evalResults = bin
      }
    }

    message.channel.send(client.embeds.success(` \`\`\`${evalResults}\`\`\` `, message.author))

  },
  help: {
    name: `eval`,
    description: `Eval a command for the bot. This is developer only.`,
    alias: ['use', 'execute', 'geval'],
    cooldown: 0
  }
}