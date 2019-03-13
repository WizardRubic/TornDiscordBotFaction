exports.TornAccountHandling = function(db) {
	if(db == undefined) {
		console.trace("Error: DB missing");
	}
    var objectToReturn = {};
    objectToReturn.linkHandler = function(msg, args) {
    	db.serialize();
        msg.reply("entered linkHandler: " + args);
    }
    objectToReturn.unlinkHandler = function(msg, args) {
        msg.reply("entered unllinkHandler");
    }
    objectToReturn.profileHandler = function(msg, args) {
        msg.reply("entered profileHandler");
    }
    return objectToReturn;
}