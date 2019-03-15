exports.HelpHandling = function() {
	var objectToReturn = {};
	objectToReturn.helpHandler = function(msg) {
		msg.reply(`* denotes mandatory parameter, don't include [] in the actual command
			**Available commands**:
			!link [*TornID]
				links Discord account to Torn Account 
			!unlink
				unlinks Discord account with Torn account
			!profile [@DiscordID]
				Brings up your profile if no argument is given, if an argument is given it'll bring up the Discord's user torn profile
			!displaylinked
				Shows all linked members and provides links to torn profiles
			!lotterystart [reward]
				Starts a lottery
			!lotteryend
				Ends current lottery
			!enter
				Enters current lottery
			`);
	}
	return objectToReturn;
}