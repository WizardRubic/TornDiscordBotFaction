/**
 * LotteryHandling is a class that lets us host lotteries
 * Enter will let users enter the lottery
 */
exports.LotteryHandling = function(db, client) {
    var currentOwnerMsg; // discord msg of the current lottery runner, useful so we can notify 
    var currentEntrants = {}; // contains msg objects of current entrants so we can look up their profile later
    var currentAmountOfEntrants = 0; // amount of entrants needed to do math
    var isLotteryOccurring = false;
    var currentReward; // current prize
    var objectToReturn = {}; // object to return for lottery spawner
    var tornAccountHandler = require('./TornAccountHandling').TornAccountHandling(db, client);

    objectToReturn.enterHandler = function(msg) {
        if(!isLotteryOccurring) {
            msg.reply("No lottery occurring");
            return;
        }
        if(currentEntrants[msg.author.id] != undefined) {
            msg.reply("NO CHEATING MOTHER FUCKER");
            return;
        }
        currentEntrants[msg.author.id] = msg; 
        currentAmountOfEntrants++;

        tornAccountHandler.checkIfLinked(msg.author.id, enterLotteryCallback, [currentReward, currentAmountOfEntrants, msg]);

        
    }
    objectToReturn.startLotteryHandler = function(msg, args) {
        if(isLotteryOccurring) {
            msg.reply(`There is already a lottery occuring hosted by ${currentOwnerMsg.author} for a ${currentReward}`);
            return;
        }

        // remove the first arg then collapse em all with space seperators
        args.shift();
        currentReward = args.join(' ');
        if(args.length==0) {
            currentReward = 'TBA';
        }
        currentAmountOfEntrants = 0;
        currentOwnerMsg = msg;
        msg.reply(`Lottery started with currentReward: ${currentReward}`);
        isLotteryOccurring = true;
    }
    objectToReturn.endLotteryHandler = function(msg, args) {
        if(!isLotteryOccurring) {
            msg.reply('No lottery is occurring at the moment.');
            return;
        }
        if(!(msg.member.hasPermissions('Faction Leaders') || msg.author == currentOwnerMsg)) {
            msg.reply('You must either be a Faction Leader or have started the lottery to end it!');
            return
        }
        if(Object.keys(currentEntrants).length == 0) {
            msg.reply(`Lottery ended without entrants`);
        } else {
            var keys = Object.keys(currentEntrants);
            var winningMsg = currentEntrants[keys[generateRandomNumber(keys.length)]];
            tornAccountHandler.checkIfLinked(winningMsg.author.id, endLotteryCallback, [winningMsg, msg, currentReward, currentOwnerMsg.author]);
        }
        isLotteryOccurring = false;
        currentAmountOfEntrants = 0;
        currentOwnerMsg = undefined;
        currentReward = undefined;
        currentEntrants = {};
    }
    return objectToReturn;

    
    function generateRandomNumber(rangeEnd) {
        return Math.floor(Math.random() * rangeEnd);
    }

    function enterLotteryCallback(args, isLinked) {
        var linkReminderMessage = '';
        if(!isLinked) {
            linkReminderMessage = `, Remember to link your account so it's easier to give you your reward!`;
        }
        args[2].reply(`entered the lottery for a ${args[0]}, current entrants: ${args[1]}` + linkReminderMessage);
    }

    function endLotteryCallback(args, isLinked, rows) {
        var winningMsg = args[0];
        var msg = args[1];
        var reward = args[2];
        var lotteryOwner = args[3];
        if(isLinked) {
            var tornID = rows.TornID;
            link = `, https://www.torn.com/profiles.php?XID=${tornID}`;
            msg.reply(`Lottery ended for ${reward} from ${lotteryOwner}, Winner: ${winningMsg.author}` + link);
        } else {
            msg.reply(`Lottery ended for ${reward} from ${lotteryOwner}, Winner: ${winningMsg.author}`);
        }
    }
}