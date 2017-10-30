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
    selectedPredictions: function(){
      return this.predictions
        .filter(function(p){
          return p.isSelected;
        });
    },
    firstPredictions: function(){
      return this.predictions
        .filter(function(p){
          return p.isSelected;
        })
        .filter(function(p,i){
          return i < 3;
        });
    },
    secondPredictions: function(){
      return this.predictions
        .filter(function(p){
          return p.isSelected;
        })
        .filter(function(p,i){
          return 3 <= i && i < 6;
        });
    },
    thirdPredictions: function(){
      return this.predictions
        .filter(function(p){
          return p.isSelected;
        })
        .filter(function(p,i){
          return i >= 6;
        });
    },
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
        prediction.redraw = true;
        prediction.isSelected = false;
        self.addPredictionList(prediction);

        self.predictions.forEach(function(p){
          if (p != prediction){
            p.redraw = !p.redraw;
          }
        });
      }
    });

    window.addEventListener('resize', function (event) {
      self.redrawAll();
    });
  },

  methods: {
    firstDate: function(prediction){
      return prediction.data[0].m.format("YYYY/MM/DD HH:mm");
    },

    dataCount: function(prediction){
      return prediction.data.length;
    },
    
    redrawAll: function(){
      var self = this;
      // 状態変更後に遅延描画する
      setTimeout(function(){
        self.predictions
          .filter(function(p){
            return p.isSelected;
          })
          .forEach(function(p){
            p.redraw = !p.redraw;
          });
      },10);
    },

    addPredictionList: function(prediction){
      this.predictions.push(prediction);
      this.predictions.sort(function(a,b){
        return (a.id < b.id) ? -1 : 1;
      });
    },

    getSamePrediction: function(list, target){
      return list.filter(function(p){
        return p.id == target.id
      })[0];
    },

    selectListItem: function(prediction){
      var self = this;
      prediction.isSelected = !prediction.isSelected;
      self.redrawAll();
    },

    deletePrediction: function(predictionId){
      var self = this;
      self.predictions.filter(function(p) { return p.id == predictionId; })[0].isSelected = false;
      self.redrawAll();
    },


    isSelected: function(prediction){
      return prediction.isSelected;
    },
  }
});
