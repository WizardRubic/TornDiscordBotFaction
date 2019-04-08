/**
 * LotteryHandling is a class that lets us host lotteries
 * Enter will let users enter the lottery
 */
exports.LotteryHandling = function(db, client, persist = true) {
    var currentOwnerMsg; // discord msg of the current lottery runner, useful so we can notify 
    var currentEntrants = {}; // contains msg objects of current entrants so we can look up their profile later
    var currentAmountOfEntrants = 0; // amount of entrants needed to do math
    var isLotteryOccurring = false;
    var currentReward; // current prize
    var objectToReturn = {}; // object to return for lottery spawner
    var tornAccountHandler = require('./TornAccountHandling').TornAccountHandling(db, client);

    if(persist) {
        if(db.getCollection('LotteryValues').findOne({'key' : 'isLotteryOccurring'}) == undefined) {
            db.getCollection('LotteryValues').insert({key : 'isLotteryOccurring', value: false});
        }
        if(db.getCollection('LotteryValues').findOne({'key' : 'currentEntrants'}) == undefined) {
            db.getCollection('LotteryValues').insert({key : 'currentEntrants', value: {}});
        }
        if(db.getCollection('LotteryValues').findOne({'key' : 'currentAmountOfEntrants'}) == undefined) {
            db.getCollection('LotteryValues').insert({key : 'currentAmountOfEntrants', value: 0});
        }
        if(db.getCollection('LotteryValues').findOne({'key' : 'currentOwner'}) == undefined) {
            db.getCollection('LotteryValues').insert({key : 'currentOwner', value: undefined});
        }
        if(db.getCollection('LotteryValues').findOne({'key' : 'currentReward'}) == undefined) {
            db.getCollection('LotteryValues').insert({key : 'currentReward', value: undefined});
        }
    }

    objectToReturn.enterHandler = function(msg) {
        if(persist) {
            // check if the lottery is already occurring
            if (!dbIsLotteryOccurring()) {
                msg.reply("No lottery occurring");
                return;
            }

            if(dbIsAlreadyEntered(msg.author.id, msg)) {
                msg.reply("NO CHEATING MOTHER FUCKER");
                return;
            }

            // insert the user as an entrant
            dbInsertCurrentEntrant(msg.author.id, msg);

            // increment the amount of users entered
            dbIncrementCurrentAmountOfEntrants(msg);
            console.log("dbGetCurrentReward(): " + dbGetCurrentReward() + ", dbGetCurrentAmountOfEntrants(msg): " + dbGetCurrentAmountOfEntrants(msg));
            tornAccountHandler.checkIfLinked(msg.author.id, enterLotteryCallback, [dbGetCurrentReward(), dbGetCurrentAmountOfEntrants(msg), msg]); 
        } else {
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
               
    }

    objectToReturn.startLotteryHandler = function(msg, args) {
        if (persist) {
            // check if the lottery is currently running
            if (dbIsLotteryOccurring()) {
                var currentOwner = dbGetCurrentOwner('name');
                var currentReward = dbGetCurrentReward();
                msg.reply(`There is already a lottery occuring hosted by ${currentOwner} for a ${currentReward}`);
                return;
            }

            args.shift();
            var reward = args.join(' ');
            dbSetCurrentReward(args.join(' '));
            if(args.length==0) {
                dbSetCurrentReward('TBA');
                reward = 'TBA';
            }
            dbSetCurrentAmountOfEntrants(0);
            dbSetCurrentOwner(msg.author.id);
            msg.reply(`Lottery started with currentReward: ${reward}`);
            dbSetIsLotteryOccurring(true);

        } else {
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
    }
    objectToReturn.endLotteryHandler = function(msg, args) {
        if(persist) {
            if(!dbIsLotteryOccurring()) {
                msg.reply('No lottery is occurring at the moment.');
                return;
            }
            // console.log('+++++++++++');
            // console.log(msg.author.id);
            // console.log(dbGetCurrentOwner());
            // console.log('+++++++++++');
            if(msg.author.id!=dbGetCurrentOwner('id') && !hasLotteryControl(msg)) {
                msg.reply('You must either be a Faction Leader or have started the lottery to end it!');
                return;
            }
            var entrants = dbGetCurrentEntrants(msg);
            if(Object.keys(entrants).length == 0) {
                msg.reply(`Lottery ended without entrants`);
            } else {
                var keys = Object.keys(entrants);
                var winningID = entrants[keys[generateRandomNumber(keys.length)]];
                // console.log("");
                tornAccountHandler.checkIfLinked(winningID, endLotteryCallbackDB, [winningID, msg, dbGetCurrentReward(), dbGetCurrentOwner('name')]);
            }
            dbSetIsLotteryOccurring(false);
            dbSetCurrentAmountOfEntrants(0);
            dbSetCurrentOwner(undefined);
            dbSetCurrentReward(undefined);
            dbClearCurrentEntrants();
        } else {
            if(!isLotteryOccurring) {
                msg.reply('No lottery is occurring at the moment.');
                return;
            }
            if(msg.author!=currentOwnerMsg.author && !hasLotteryControl(msg)) {
                msg.reply('You must either be a Faction Leader or have started the lottery to end it!');
                return;
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
        
    }
    return objectToReturn;

    function dbGetCurrentOwner(idOrName) {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentOwner'});
        console.log("rows.value");
        console.log(rows.value);
        if(rows == undefined) {
            msg.reply(`Database error!`);
            return;
        }
        if(rows.value == undefined) {
            return undefined;
        }
        if(idOrName == 'name') {
            return client.users.get(rows.value);
        } else if(idOrName == 'id') {
            return rows.value;
        } else {
            console.log("error in dbGetCurrentOwner");
        }
        
    } 
    function dbSetCurrentOwner(val) {
        db.getCollection('LotteryValues').findAndRemove({'key' : 'currentOwner'});
        db.getCollection('LotteryValues').insert({key : 'currentOwner', value: val});
    } 

    function dbIsLotteryOccurring() {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'isLotteryOccurring'});
        if(rows == undefined) {
            msg.reply(`Database error!`);
            return;
        }
        return rows.value;
    } 

    function dbSetIsLotteryOccurring(val) {
        db.getCollection('LotteryValues').findAndRemove({'key' : 'isLotteryOccurring'});
        db.getCollection('LotteryValues').insert({key : 'isLotteryOccurring', value: val});
    }

    function dbGetCurrentReward() {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentReward'});
        if(rows == undefined) {
            msg.reply(`Database error!`);
            return;
        } 
        console.log("000000000");
        console.log(rows.value);
        return rows.value;
    } 

    function dbSetCurrentReward(val) {
        db.getCollection('LotteryValues').findAndRemove({'key' : 'currentReward'});
        db.getCollection('LotteryValues').insert({key : 'currentReward', value: val});
    }

    function dbGetCurrentEntrants(msg) {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentEntrants'});
        if(rows == undefined) {
            msg.reply(`Database error!`);
            return;
        } 
        return rows.value;
    } 
    function dbClearCurrentEntrants() {
        db.getCollection('LotteryValues').findAndRemove({'key' : 'currentEntrants'});
        db.getCollection('LotteryValues').insert({key : 'currentEntrants', value: {}});
        dbSetCurrentAmountOfEntrants(0);
    }

    function dbGetCurrentAmountOfEntrants(msg) {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentAmountOfEntrants'});
        if(rows == undefined) {
            msg.reply(`Database error!`);
            return;
        } 
        return rows.value;
    } 

    function dbIncrementCurrentAmountOfEntrants(msg) {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentAmountOfEntrants'});
        db.getCollection('LotteryValues').findAndRemove({'key' : 'currentAmountOfEntrants'});
        if(rows == undefined) { 
            msg.reply(`Database error!`);
            return;
        }
        db.getCollection('LotteryValues').insert({key : 'currentAmountOfEntrants', value: rows.value + 1});
    }

    function dbSetCurrentAmountOfEntrants(val) {
        db.getCollection('LotteryValues').findAndRemove({'key' : 'currentAmountOfEntrants'});
        db.getCollection('LotteryValues').insert({key : 'currentAmountOfEntrants', value: val});
    }

    function dbInsertCurrentEntrant(id, msg) {
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentEntrants'});
        db.getCollection('LotteryValues').findAndRemove({'key' : 'currentEntrants'});
        if(rows == undefined) { 
            msg.reply(`Database error!`);
            return;
        }
        rows.value[id] = id;
        db.getCollection('LotteryValues').insert({key : 'currentEntrants', value: rows.value});
    }

    function dbIsAlreadyEntered(id, msg) {
        // check if the user is already an entrant in the lottery
        var rows = db.getCollection('LotteryValues').findOne({'key' : 'currentEntrants'});
        if(rows == undefined) { 
            msg.reply(`Database error!`);
            return;
        }
        return rows.value[msg.author.id];
    }



    function hasLotteryControl(msg) {
        var roles = msg.member.roles;
        var lotteryControl = false;
        roles.forEach(function(key){
            console.log(`|${key.name}|`);
            var newStr = key.name.replace(/(^\s+|\s+$)/g,'');
            if(newStr == 'Faction Leaders') {
                lotteryControl = true;
                return;
            }
        });
        return lotteryControl;
    }
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

    function endLotteryCallbackDB(args, isLinked, rows) {
        var winningID = args[0];
        var winnerName = client.users.get(winningID);
        var msg = args[1];
        var reward = args[2];
        var lotteryOwner = args[3];
        if(isLinked) {
            var tornID = rows.TornID;
            link = `, https://www.torn.com/profiles.php?XID=${tornID}`;
            msg.reply(`Lottery ended for ${reward} from ${lotteryOwner}, Winner: ${winnerName}` + link);
        } else {
            msg.reply(`Lottery ended for ${reward} from ${lotteryOwner}, Winner: ${WinnerName}`);
        }
    }
}