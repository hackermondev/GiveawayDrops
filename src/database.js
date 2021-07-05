const MongoClient = require('mongodb').MongoClient
var db = null

var dev = process.env.NODE_ENV != 'production'
var config = require('../config.json')
var chalk = require('chalk')

async function startDatabase() {

  if(dev){
    var mongo = await MongoClient.connect(config['DATABASE'].development, { useUnifiedTopology: true })
  } else {
    var mongo = await MongoClient.connect(config['DATABASE'].production, { useUnifiedTopology: true })
  }

  db = mongo.db('gdrops')
  console.log(chalk.green(`Connected to database.`))

  module.exports = {
    db: db
  }

  return db
}


module.exports = {
  db: db,
  loadDatabase: startDatabase
}