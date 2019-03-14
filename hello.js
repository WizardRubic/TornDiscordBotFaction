// const Discord = require('discord.js');
// const client = new Discord.Client();
var auth = require('./auth.json');
// var sqlite3 = require('sqlite3');

// let db = new sqlite3.Database('./db/faction.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
//   if (err) {
//     console.error(err.message);
//   }
//   console.log('Connected to the faction database.');
// });

// var pingPonger = require('./pingponger.js').PingPonger();
// var tornAccountHandler = require('./TornAccountHandling.js').TornAccountHandling(db);

// client.on('ready', () => {
//   console.log("ready!");
// });

// // since we strip the commands of casing, these commands should all be lower case
// var commandMapping = {
//   "!ping" : pingPonger.handler,
//   "!profile" : tornAccountHandler.profileHandler,
//   "!link": tornAccountHandler.linkHandler,
//   "!unlink": tornAccountHandler.unlinkHandler
// };

// client.on('message', msg => {
//   var args = msg.toString().split(" ");
//   if (args==undefined) {
//     return;
//   }
//   console.log(args);
//   var lowerCasedCommand = args[0].toLowerCase();
//   var mappedCommand = commandMapping[lowerCasedCommand];
//   if(mappedCommand == undefined) {
//     return;
//   }
//   mappedCommand(msg, args);
// });

// client.login(auth.token);







const Discord = require("discord.js");
const client = new Discord.Client();
// const fs = require('fs');
var playerList = [];
var lotteryBool = false;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  console.log("hi");
  if(msg.author.bot) return;
  
  // if(msg.content.indexOf(config.prefix) !== 0) return;
  
  const args = msg.content.slice('!').trim().split(/ +/g);
  const command = args.shift().toLowerCase().substr(1);
  console.log(args);
  // msg.reply(command);
  console.log(command);
  if(true){
    if(command === "enter"){
      if(lotteryBool){
        if(playerList.indexOf(msg.author) >= 0){
          msg.reply("you're already in the lottery!");
        } else {
          playerList.push(msg.author);
          console.log(msg.author + " ENTERED the lottery!");
          msg.reply("entered! Good Luck!");
        }
      }
      else{
        msg.reply("sorry there is no lottery running at this moment in time :cry:");
      }
    }
    console.log(command);
    if(command == "lotteryhelp"){
      var line1 = "Here is a list of my commands :D \n";
      var line2 = "```?lotterystart - starts a lottery \n---Can only be used with admin permissions. \n";
      var line3 = "?lotteryend - ends current lottery \n---Can only be used with admin permissions. \n";
      var line4 = "?enter - enters current lottery if one is running\n```"
      var messageToSend = line1 + line2 + line3 + line4;
      msg.author.send(messageToSend);
    }
    if(command === "lotterystart" && msg.member.hasPermission("ADMINISTRATOR")){
      msg.channel.send("@everyone! Lottery has started!");
      console.log(msg.author + " STARTED the lottery!");
      lotteryBool = true;
    }
    if(command === "lotteryend" && msg.member.hasPermission("ADMINISTRATOR")){
      lotteryBool = false;
      if(playerList.length >= 1){
        var winner = playerList[Math.floor(Math.random()*playerList.length)];
        winner.send(":confetti_ball: YOU WON!!! :confetti_ball:");
        msg.channel.send(":confetti_ball: "+ winner + " WON THE LOTTERY! CONGRATS :confetti_ball:");
      }
      else {
        msg.reply("Nobody entered the lottery :cry:");
      }
      console.log(msg.author + " ENDED the lottery!");
      playerList = [];
    }
  }
});

client.login(auth.token);