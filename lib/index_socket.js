module.exports.setup = function(io){
  io.sockets.on('connection', function(client) {
    console.log("New Connection from " + client.client.id);

    client.on('get_data', function(data) {
      //client.emit("id_" + data.id, result);
    });
  });
}

