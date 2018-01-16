var moment = require("moment");

var g_io = null;
var graphs = [];
module.exports.setup = function(io){
  g_io = io;

  io.sockets.on('connection', function(client) {
    console.log("New Connection from " + client.client.id);

    graphs.forEach(function(g){
      client.emit('graph_data', g);
    });
  });
}

module.exports.sendAll = function(data){
  var graph = graphs.filter(function(g){ return g.id == data.id; })[0];

  if (graph){
    graph.status = data.status;
    graph.data = data.data;
  }else{
    graphs.push(data);
  }

  g_io.sockets.emit('graph_data', data);
}

module.exports.clearAll = function(){
  g_io.sockets.emit('clear_data');
}
