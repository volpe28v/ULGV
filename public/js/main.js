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

    self.socket.on("prediction", function(prediction){
      if (prediction == null) return;
      console.log(prediction);

      prediction.data = prediction.data.map(function(d){
        d.m = moment(d.m);
        return d;
      });

      var target = self.predictions.filter(function(p){ return p.id == prediction.id; })[0];
      if (target){
        target.data = prediction.data;
      }else{
        self.addPredictionList(prediction);
      }
    });
  },

  methods: {
    firstDate: function(prediction){
      return prediction.data[0].m.format("YYYY/MM/DD hh:mm");
    },

    dataCount: function(prediction){
      return prediction.data.length;
    },
    
    addPredictionList: function(prediction){
      this.predictions.push(prediction);
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
