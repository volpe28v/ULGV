// vue vm
var prediction = require("./graph");
var moment = require("moment");
moment.locale('ja');

new Vue({
  el: '#app',
  data: {
    baseUrl: "http://winmuse.cloudapp.net/damapp/",
    projectID: 100,
    stationID: 94,
    delay: 20,
    dispOffset: 0,
    predictions: [],
    predictionsHistory: [],
    offsetSeconds: 70,
    selectedPrediction: null,
    targetDate: moment(),
  },

  computed: {
    targetDispDate: function(){
      return this.targetDate.format('YYYY:MM:DD HH:mm:ss');
    },
    adjustedDate: function(){
      return this.targetDate.add(this.offsetSeconds * -1, 'second');
    },
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

    this.predictionsHistory = this.getHistoryFromLocalstorage();
    setInterval(function(){
      self.targetDate = moment();
    }, 1000);
  },

  methods: {
    addPrediction: function(){
      var prediction = {
        baseUrl: this.baseUrl,
        projectID: this.projectID,
        stationID: this.stationID,
        delay: this.delay,
        dispOffset: this.dispOffset,
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
        this.predictionsHistory.sort(function(a,b){
          return a.baseUrl - b.baseUrl ||
                 Number(a.projectID) - Number(b.projectID) ||
                 Number(a.stationID) - Number(b.stationID) ||
                 Number(a.delay) - Number(b.delay) ||
                 Number(a.dispOffset) - Number(b.dispOffset);
        });
        this.setHistoryToLocalStorage(this.predictionsHistory);
        return history;
      }else{
        return targetHistory;
      }
    },

    getSamePrediction: function(list, target){
      return list.filter(function(p){
        return p.baseUrl == target.baseUrl &&
               p.projectID == target.projectID &&
               p.stationID == target.stationID &&
               p.delay == target.delay &&
               p.dispOffset == target.dispOffset;
      })[0];
    },

    selectHistory: function(history){
      this.selectedPrediction = history;
      this.addPredictionList(history);

      this.projectID = history.projectID;
      this.baseUrl = history.baseUrl;
      this.stationID = history.stationID;
      this.delay = history.delay;
      this.dispOffset = history.dispOffset;
    },

    deleteHistory: function(history){
      var index = this.predictionsHistory.indexOf(history);
      this.predictionsHistory.splice(index,1);

      this.deletePrediction(history);
      this.setHistoryToLocalStorage(this.predictionsHistory);
    },

    getHistoryFromLocalstorage: function(){
      try{
        if (localStorage && localStorage.history){
          return JSON.parse(localStorage.history);
        }
        return [];
      }catch (err){
        return [];
      }
    },

    setHistoryToLocalStorage: function(history){
      try{
        if (localStorage){
          localStorage.history = JSON.stringify(history);
        }
      }catch (err){
      }
    },

    isSelected: function(history){
      return this.predictions.indexOf(history) != -1;
    },
  }
});
