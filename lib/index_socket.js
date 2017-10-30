var moment = require("moment");

var g_io = null;
var predictions = [];
module.exports.setup = function(io){
  g_io = io;

  io.sockets.on('connection', function(client) {
    console.log("New Connection from " + client.client.id);

    predictions.forEach(function(p){
      client.emit('prediction', p);
    });
  });
}

module.exports.sendAll = function(data){
  var prediction = predictions.filter(function(p){ return p.id == data.id; })[0];

  if (prediction){
    prediction.data = data.data;
  }else{
    predictions.push(data);
  }

  g_io.sockets.emit('prediction', data);
}
