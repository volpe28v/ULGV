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
      projectID: 100,
      predictions: [],
      predictionsHistory: [],
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
  },

  methods: {
    addPrediction: function(){
      var prediction = {
        projectID: this.projectID,
      };

      var addedPrediction = this.addHistory(prediction);
      this.addPredictionList(addedPrediction);
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

    addHistory: function(history){
      var targetHistory = this.getSamePrediction(this.predictionsHistory, history);
      if (targetHistory == null){
        this.predictionsHistory.unshift(history);
        return history;
      }else{
        return targetHistory;
      }
    },

    getSamePrediction: function(list, target){
      return list.filter(function(p){
        return p.projectID == target.projectID
      })[0];
    },

    selectHistory: function(history){
      this.selectedPrediction = history;
      this.addPredictionList(history);

      this.projectID = history.projectID;
    },

    deleteHistory: function(history){
      var index = this.predictionsHistory.indexOf(history);
      this.predictionsHistory.splice(index,1);

      this.deletePrediction(history);
    },

    isSelected: function(history){
      return this.predictions.indexOf(history) != -1;
    },
  }
});
