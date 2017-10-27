var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var bodyParser = require('body-parser');

var io = require('socket.io').listen(server,{ 'destroy buffer size': Infinity });
var index_socket = require('./lib/index_socket');
index_socket.setup(io);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var program = require('commander');
program
  .version('1.0.0')
  .option('-p, --port <n>', 'port no. default is 3000.')
  .parse(process.argv);

app.set('port', program.port || process.env.PORT || 3000);

app.post('/prediction', function(req, res){
  var data = req.body;

  console.log(data);

  io.sockets.emit('prediction', data);

  res.json({});
});

server.listen(app.get('port'), function () {
  console.log('ULGV listening on port ' + app.get('port'));
});


