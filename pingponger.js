exports.PingPonger = function() {
    var objectToReturn = {};
    objectToReturn.handler = function(msg) {
        msg.reply("pong2");
    }
    return objectToReturn;
}