var moment = require("moment");

module.exports.setup = function(io){
  io.sockets.on('connection', function(client) {
    console.log("New Connection from " + client.client.id);

    var prediction = {
      id: 1,
      data: [
        { m: moment("2013-02-08 01:00"), v: 100 },
        { m: moment("2013-02-08 02:00"), v: 110 },
        { m: moment("2013-02-08 03:00"), v: 120 },
        { m: moment("2013-02-08 04:00"), v: 130 },
        { m: moment("2013-02-08 05:00"), v: 120 },
        { m: moment("2013-02-08 06:00"), v: 110 },
        { m: moment("2013-02-08 07:00"), v: 100 },
      ]
    };

    client.emit("prediction", prediction);

    prediction.id = 2;

    client.emit("prediction", prediction);

    setInterval(function(){
      prediction.data = prediction.data.map(function(d){
        d.v = d.v + 1;
        return d;
      });

      client.emit("prediction", prediction);
    }, 1000);
  });
}

