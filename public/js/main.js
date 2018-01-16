// vue vm
var graph = require("./graph");
var graphList = require("./graph_list");
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
      graphs: [],
      socket: socket,
      graph_detail: null,
      detailDataIndex: 0,
    }
  },

  computed: {
    selectedGraphs: function(){
      return this.graphs
        .filter(function(g){
          return g.isSelected;
        });
    },
    firstGraphs: function(){
      return this.graphs
        .filter(function(g){
          return g.isSelected;
        })
        .filter(function(g,i){
          return i < 3;
        });
    },
    secondGraphs: function(){
      return this.graphs
        .filter(function(g){
          return g.isSelected;
        })
        .filter(function(g,i){
          return 3 <= i && i < 6;
        });
    },
    secondGraphsDummy: function(){
      var dummyCount = 6 - this.graphs.filter(function(g){ return g.isSelected; }).length;
      dummyCount = dummyCount > 3 ? 3 : dummyCount;
      dummyCount = dummyCount < 0 ? 0 : dummyCount;
      return new Array(dummyCount);
    },
 
    thirdGraphs: function(){
      return this.graphs
        .filter(function(g){
          return g.isSelected;
        })
        .filter(function(g,i){
          return i >= 6;
        });
    },
    thirdGraphsDummy: function(){
      var dummyCount = 9 - this.graphs.filter(function(g){ return g.isSelected; }).length;
      dummyCount = dummyCount > 3 ? 3 : dummyCount;
      dummyCount = dummyCount < 0 ? 0 : dummyCount;
      return new Array(dummyCount);
    },
  },

  mounted: function(){
    var self = this;

    self.socket.on("graph_data", function(graph){
      if (graph == null) return;

      graph.data = graph.data.map(function(d){
        d.m = moment(d.t);
        return d;
      });

      var target = self.graphs.filter(function(g){ return g.id == graph.id; })[0];
      if (target){
        target.data = graph.data;
        target.status = graph.status;
        if (target.status == null){
          target.status = "Normal";
        }

        // データ更新でグラフを目立たせる
        target.isUpdating = true;
        setTimeout(function(){
          target.isUpdating = false;
        },500);
      }else{
        graph.redraw = true;
        graph.isSelected = false;
        graph.isFocused = false;
        graph.isUpdating = false;
        if (graph.status == null){
          graph.status = "Normal";
        }
        self.addGraphList(graph);

        self.graphs.forEach(function(g){
          if (g != graph){
            g.redraw = !g.redraw;
          }
        });
      }
    });

    self.socket.on("clear_data", function(graph){
        self.graphs = [];
        self.graph_detail = null;
    });

    window.addEventListener('resize', function (event) {
      self.redrawAll();
    });
  },

  methods: {
    redrawAll: function(){
      var self = this;
      // 状態変更後に遅延描画する
      setTimeout(function(){
        self.graphs
          .filter(function(p){
            return p.isSelected;
          })
          .forEach(function(p){
            p.redraw = !p.redraw;
          });
      },10);
    },

    addGraphList: function(graph){
      this.graphs.push(graph);
      var numbers = this.graphs.filter(function(g){
        return !isNaN(g.id);
      }).sort(function(a,b){
        return Number(a.id) - Number(b.id);
      });
      var strings = this.graphs.filter(function(g){
        return isNaN(g.id);
      }).sort(function(a,b){
        return a.id < b.id ? -1 : 1;
      });

      this.graphs = numbers.concat(strings);
    },

    deleteGraph: function(graphId){
      var self = this;
      self.graphs.filter(function(g) { return g.id == graphId; })[0].isSelected = false;
      self.redrawAll();
    },

    detailGraph: function(graphId){
      var self = this;
      if (self.graph_detail == null || self.graph_detail.id != graphId){
        self.graph_detail = self.graphs.filter(function(g) { return g.id == graphId; })[0];
      }else{
        self.graph_detail = null;
      }
    },

    focusDataIndex: function(index){
      this.detailDataIndex = index;
    },
  }
});
