const Discord = require('discord.js');
const client = new Discord.Client();
var auth = require('./auth.json');
var sqlite3 = require('sqlite3');

let db = new sqlite3.Database('./db/faction.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the faction database.');
});

var pingPonger = require('./pingponger.js').PingPonger();
var tornAccountHandler = require('./TornAccountHandling.js').TornAccountHandling(db);

client.on('ready', () => {
  console.log("ready!");
});

// since we strip the commands of casing, these commands should all be lower case
var commandMapping = {
  "!ping" : pingPonger.handler,
  "!profile" : tornAccountHandler.profileHandler,
  "!link": tornAccountHandler.linkHandler,
  "!unlink": tornAccountHandler.unlinkHandler
};

client.on('message', msg => {
  var args = msg.toString().split(" ");
  if (args==undefined) {
    return;
  }
  console.log(args);
  var lowerCasedCommand = args[0].toLowerCase();
  var mappedCommand = commandMapping[lowerCasedCommand];
  if(mappedCommand == undefined) {
    return;
  }
  mappedCommand(msg, args);
});

client.login(auth.token);