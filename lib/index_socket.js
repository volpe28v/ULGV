var moment = require("moment");

module.exports.setup = function(io){
  io.sockets.on('connection', function(client) {
    console.log("New Connection from " + client.client.id);
  });
}

