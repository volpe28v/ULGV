// vue vm
var graph = require("./graph");
var moment = require("moment");
moment.locale('ja');

var socket = require('socket.io-client')('/', {});

socket.on('connect', function() {
  console.log("connected socket.io");
});

var router = new VueRouter({
  mode: 'history',
  routes: []
});

new Vue({
  router: router,
  el: '#app',
  data: function(){
    return {
      predictions: [],
      selectedPrediction: null,
      socket: socket,
    }
  },

  computed: {
    firstPredictions: function(){
      return this.predictions.filter(function(p,i){
        return i < 3;
      });
    },
    secondPredictions: function(){
      return this.predictions.filter(function(p,i){
        return 3 <= i && i < 6;
      });
    },
    thirdPredictions: function(){
      return this.predictions.filter(function(p,i){
        return i >= 6;
      });
    }
  },

  mounted: function(){
    var self = this;

    this.addPrediction();

    setInterval(function(){
      var data = self.predictions[0].data;

      self.predictions[0].data = 
        data.map(function(d){
          d.v = d.v + 1;
          return d;
        });
    }, 1000);
  },

  methods: {
    addPrediction: function(){
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

      this.addPredictionList(prediction);

      var prediction2= {
        id: 2,
        data: [
          { m: moment("2013-03-04 01:00"), v: 10 },
          { m: moment("2013-03-04 02:00"), v: 10 },
          { m: moment("2013-03-04 03:00"), v: 20 },
          { m: moment("2013-03-04 04:00"), v: 30 },
          { m: moment("2013-03-04 05:00"), v: 20 },
          { m: moment("2013-03-04 06:00"), v: 10 },
          { m: moment("2013-03-04 07:00"), v: 10 },
        ]
      };

      this.addPredictionList(prediction2);
    },

    addPredictionList: function(prediction){
      if (this.getSamePrediction(this.predictions, prediction) == null){
        this.predictions.push(prediction);
      }
    },

    deletePrediction: function(target){
      var index = this.predictions.indexOf(target);
      if (index < 0){ return; }
      this.predictions.splice(index,1);
    },

    getSamePrediction: function(list, target){
      return list.filter(function(p){
        return p.id == target.id
      })[0];
    },

    selectHistory: function(history){
      this.selectedPrediction = history;
      this.addPredictionList(history);
    },

    isSelected: function(history){
      return this.predictions.indexOf(history) != -1;
    },
  }
});
