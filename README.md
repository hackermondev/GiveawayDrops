# GiveawayDrops

### License

If you are going to use this bot in your server, please credit me in some way (including my github profile, discord, etc). Also this is made for private use only and you are not allowed to publish a version of the bot for other servers to use. There is already a published version [here]() if you want.

### Introduction
This is a discord bot I made a long time ago and I wanted to make it open source because my other bot [bread](https://github.com/hackermondev/bread) got a lot of traffic and I wanted to see if people would like this bot.

### What does it do?
This bot is a discord giveaway bot with extra features that everyone needs :). 

#### Giveaway Requirements (Built-in)
The bot has giveaway requirements built in (only supports message requirements).

![image](https://i.matdoes.dev/image/c0999fc1ab792ab4a0c2b70859ba359c)

#### Stop autoreactors!
This bot has a feature that no other bot has. The ability to stop autoreactors with captcha. We send a captcha in a users DM if they react too fast or if they are suspicious. You can customize what happens if the user fails the captcha and much more!

![image](https://i.matdoes.dev/image/c426c12f1d3cb16e85ae17c726029e41)

![image](https://i.matdoes.dev/image/0f33adcee2ed079662d63091cc57cffb)

### How to run this bot for your server!

First, you need a hosting platform. If you have a developer for your server, they probably have a VPS or you can use [heroku](https://heroku.com). Fork this github repo and edit config.json with the required values:

```json
{
  "NAME": "The name of your bot.",
  "DEFAULT_PREFIX": "The prefix of your bot (you can change this later in the bot settings)",
  "DISCORD_STATUS": [
    {
      "type": "PLAYING",
      "text": "The discord status of your bot"
    }
  ],
  "TOKENS": {
    "DEV": "The token for your bot (development token). If you are not change anything in the bot use the same token for DEV and PRODUCTION.",
    "PRODUCTION": "The token for your bot (production token). If you are not change anything in the bot use the same token for DEV and PRODUCTION."
  },
  "COLORS": {
    "success": "#50c878",
    "error": "#ff3333",
    "idle": "#ffff00"
  },
  "DATABASE": {
    "production": "The mongodb database for your bot. Scroll down for more info.",
    "development": "The mongodb database for your bot. Scroll down for more info."
  },
  "DEFAULT_GIVEAWAY_SETTINGS": {
    "emoji": "🎉"
  },
  "OWNERS": [
    "Your ID."
  ],
  "API": {
    "PASTEBIN": "NOT REQUIRED but a pastebin api key for the eval command"
  },
  "STATCORD": "STATCORD API KEY if you are using STATCORD"
}
```

and then deploy the bot!

### MongoDB

To setup a mongodb database, go to [mongodb](https://mongodb) create an account, create a team, create a project and then create a cluster. Once the cluster is created, get the connection uri string and put it on the config file. Make sure to create a database on the cluster called ``gdrops`` (with an empty collection `servers`) and then run the bot.

### Issues

If you have any issues or need help setting something up, feel free to DM me on Discord. ``hAcKeRmOn#5686``

``npm start`` to start the bot.