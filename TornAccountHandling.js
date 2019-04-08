exports.TornAccountHandling = function(db, client) {
	if(db == undefined) {
		console.trace("Error: DB missing");
	}

	/**
	 * Checks 
	 * @return {[type]} [description]
	 */
	var insertTornID = function(msg, args) {
		var rows = db.getCollection('DiscordToTorn').insert({DiscordID: msg.author.id, TornID: args[1]});
		msg.reply(`Linked ${msg.author.username} to TornID: ${args[1]}`);
	};

	/**
	 * [removeTornID description]
	 * @param  {Object} msg      discordjs message
	 * @param  {Object} tableRow object with properties: DiscordID and TornID
	 * @return {undefined}          
	 */
	var removeTornID = function(msg, tableRow) {
    var rows = db.getCollection('DiscordToTorn').findAndRemove({'DiscordID' : msg.author.id});
		msg.reply(`Unlinked ${msg.author.username} from TornID: ${tableRow.TornID}`);
	};

	var lookupTornProfile = function (msg, discordID, entry) {
        var rows = db.getCollection('DiscordToTorn').findOne({'DiscordID' : discordID});
        if(rows != undefined) {
            msg.reply(`https://www.torn.com/profiles.php?XID=${rows.TornID}`);
        } else {
            msg.reply(`${entry} wasn't linked and could not be found before !profile`);
        }
	}

	

	var getUserID = function(username) {
		var tempArray = client.users.array();
		for(var i = 0; i < tempArray.length; i++) {
			if(tempArray[i].username == username) {
				return tempArray[i].id;	
			}
		}
		return undefined;
	}

    var objectToReturn = {};

    objectToReturn.checkIfLinked = function(discordID, callback, args) {
    	console.log("in checkiflinked");
        var rows = db.getCollection('DiscordToTorn').findOne({'DiscordID' : discordID});
        callback(args, rows!=undefined, rows);
    }

    objectToReturn.linkHandler = function(msg, args) {
    	if(args[1] == undefined) {
    		msg.reply('TornID parameter missing');
    		return;
    	}
    	var inputSanitizerRegex = RegExp(/^[0-9]*$/g);
    	if(!(inputSanitizerRegex.test(args[1]))){
    		msg.reply('Invalid input');
    		return;
    	}

        var rows = db.getCollection('DiscordToTorn').findOne({'DiscordID' : msg.author.id});
        if(rows == undefined) {
            insertTornID(msg, args);
        } else {
            msg.reply("Your account is already linked to: " + rows.TornID);
        }
    }
    /**
     * unlink handler
     * @param  {[type]} msg  [description]
     * @param  {[type]} args [description]
     * @return {[type]}      [description]
     */
    objectToReturn.unlinkHandler = function(msg, args) {
        var rows = db.getCollection('DiscordToTorn').findOne({'DiscordID' : msg.author.id});
        if(rows != undefined) {
            removeTornID(msg, rows);
        } else {
            msg.reply("Your account wasn't linked before running !unlink");
        }
    }
    
    objectToReturn.profileHandler = function(msg, args) {
    	// look up the torn id, and if it exists then we should construct profile link
    	// if it doesn't exist respond with an error message
    	var inputSanitizerRegex = RegExp(/^<@[0-9]*>$|^<@![0-9]*>$/g);
    	if(args[1]!=undefined && !(inputSanitizerRegex.test(args[1]))){
    		// if it fails we need to check user list to see if our guy is part of the guild
    		var userID = getUserID(args[1]);
    		if(userID == undefined) {
    			msg.reply(`Couldn't find user ${args[1]}`);
    			return;
    		} else {
    			args[1] = `<@${userID}>`;
    		}
    	}

    	// if their name isn't part of the server, 
    	var discordID = args[1] == undefined ? msg.author.id : args[1].replace(/\D/g, '');

    	lookupTornProfile(msg, discordID, args[1]);
    }

    objectToReturn.displayAllHandler = function(msg, args) {
        var rows = db.getCollection('DiscordToTorn').data;
        var message = "";
        if(rows != undefined) {
            rows.forEach((row) => {
                if(client.users.has('' + row.DiscordID)) {
                    message+=client.users.get(`${row.DiscordID}`) + 
                    `, TornID: [${row.TornID}](https://www.torn.com/profiles.php?XID=${row.TornID})`+ '\n';
                }
            });
            msg.reply(`**All Linked Users:**
            ${message}`);
        } else {
            msg.reply(`No accounts have been linked yet.`);
        }
    }
    return objectToReturn;
}