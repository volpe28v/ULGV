var moment = require("moment");
moment.locale('ja');

var graphComponent = Vue.component('graph',{
  template: '<div>\
    <div class="svg-header">\
      <div class="title-area">ID:{{graphId}} {{firstGraphDate}} - {{lastGraphDate}} - {{graphCount}}</div>\
      <div class="delete-button" v-on:click="deleteGraph">x</div>\
    </div>\
    <div class="svg-area">\
      <svg class="graph-svg"></svg>\
    </div>\
  </div>',

  props: ['graphId','data','redraw'],

  data: function(){
    return {
      graphData: null,
      chartSetting: null,
      svgWidth: 0,
      svgHeight: 0,
      xMinMax: null,
    }
  },

  computed: {
    firstGraphDate: function(){
      if (this.graphData != null){
        return this.graphData[0].moment.format("YYYY/MM/DD HH:mm");
      }else{
        return "";
      }
    },
    lastGraphDate: function(){
      if (this.graphData != null){
        return this.graphData[this.graphData.length-1].moment.format("YYYY/MM/DD HH:mm");
      }else{
        return "";
      }
    },
    graphCount: function(){
      if (this.graphData != null){
        return this.graphData.length;
      }else{
        return 0;
      }
    }
  },

  watch: {
    data: function(){
      this.update();
    },
    redraw: function(){
      this.update();
    }
  },

  mounted: function(){
    this.update();
  },

  methods: {
    update: function(){
      var self = this;

      this.updateData();

      var forceUpdate = true;
      self.updateGraph(forceUpdate);
    },

    updateData: function(){
      var self = this;

      // 水位予測
      self.graphData = self.data
      .map(function(d){
        return {
          moment: d.m,
          date: d.m.toDate(),
          value: d.v
        };
      });

      self.xMinMax = [
        self.graphData[0].moment.toDate(),
        self.graphData[self.graphData.length-1].moment.toDate()
      ];

      var yMax = Math.max.apply(null, self.graphData.map(function(r){ return Number(r.value); }));
      self.chartSetting = {
        YMinValue: 0,
        YMaxValue: yMax + yMax/5,
      };
    },

    updateGraph: function(forceUpdate){
      var self = this;

      // サイズが変わっていたら再描画
      var svg = d3.select(self.$el).select("svg");
      var svg_width = parseInt(svg.style("width"));
      var svg_height = parseInt(svg.style("height"));

      if (!forceUpdate && 
          (self.svgWidth == svg_width && self.svgHeight == svg_height)){
        return;
      }else{
        self.svgWidth = svg_width;
        self.svgHeight = svg_height;
      }

      var margin = {top: 15, right: 50, bottom: 30, left: 50};
      var width = svg_width - margin.left - margin.right;
      var height = svg_height - margin.top - margin.bottom;

      svg.selectAll('g').remove();
      var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // X軸生成
      var x = d3.scaleTime()
        .rangeRound([0, width]);
      var xAxis = d3.axisBottom(x)
        .tickFormat(function(date){
          var m = moment(date);
          return m.format('HH:mm');
        });

      x.domain(self.xMinMax);

      g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      var mouseHandlers = {
        over: [],
        out: [],
        move: [],
      };

      self.drawGraphLine(g, x, width, height, mouseHandlers);
      self.drawFocuses(g, width, height, mouseHandlers);
    },

    drawGraphLine: function(g, x, width, height, mouseHandlers){
      var self = this;

      var adjustedPlan = self.graphData;

      var water_lines = [
        { id: "water-plan"  , color: "lime" , values: adjustedPlan },
      ];

      var y = d3.scaleLinear()
        .rangeRound([height, 0]);

      var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.value); });

      y.domain([self.chartSetting.YMinValue, self.chartSetting.YMaxValue]);

      g.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("fill", "#000")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end");

      var water_line = g.selectAll(".water-line")
        .data(water_lines)
        .enter().append("g")
        .attr("class", "water-line");

      water_line.append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return d.color;})
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2.5)
        .attr("d", function(d){ return line(d.values);});

      // カーソル
      self.drawFocus(g, x, y, width, height, adjustedPlan, mouseHandlers);
    },

    drawFocuses: function(g, width, height, mouseHandlers){
      g.append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mouseout',  mouseout)
        .on('mousemove', mousemove);

      g.select('.overlay')
        .styles({
          fill: 'none',
          'pointer-events': 'all'
        });

      function mouseover(){
        var context = this;
        mouseHandlers.over.forEach(function(f){ f(context); });
      }

      function mouseout(){
        var context = this;
        mouseHandlers.out.forEach(function(f){ f(context); });
      }

      function mousemove() {
        var context = this;
        mouseHandlers.move.forEach(function(f){ f(context); });
      }
    },

    createFocus: function(g){
			var focus = g.append('g')
				.attr('class', 'focus')
				.style('display', 'none')
        .style('opacity', 1.0);

			focus.append('circle')
				.attr('r', 4.5)
        .styles({
          fill: 'none',
          stroke: 'white'
        });

			focus.append('line')
				.classed('x', true)
        .styles({
          fill: 'none',
          'stroke': 'white',
          'stroke-width': '1.0px',
          'stroke-dasharray': '3 3'
        });

			focus.append('line')
				.classed('y', true)
        .styles({
          fill: 'none',
          'stroke': 'white',
          'stroke-width': '1.0px',
          'stroke-dasharray': '3 3'
        });

			focus.append('text')
				.attr('x', 9)
				.attr('dy', '.35em')
        .styles({
          fill: 'white',
        });

      return focus;
    },

		drawFocus: function(g, x, y, width, height, data, mouseHandlers){
      var self = this;
      var bisectDate = d3.bisector(function(d){ return d.date; }).left;

      var focus = self.createFocus(g);

      mouseHandlers.over.push(
				function(context){ focus.style('display', null);}
      );

      mouseHandlers.out.push(
				function(context){ focus.style('display', 'none');}
      );

      mouseHandlers.move.push(
        function(context) {
          var x0 = x.invert(d3.mouse(context)[0]);
          var i = bisectDate(data, x0, 1);
          if (data.length <= i) {
            i = data.length - 1;
          }

          var d0 = data[i - 1];
          var d1 = data[i];
          var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
          focus.attr('transform', 'translate(' + x(d.date) + ',' + y(d.value) + ')');
          focus.select('line.x')
            .attr('x1', 0)
            .attr('x2', -x(d.date))
            .attr('y1', 0)
            .attr('y2', 0);

          focus.select('line.y')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', height - y(d.value));

          // テキスト生成
          var xOffset = x(x0) < width / 2 ? 9 : -140;
          var focus_text = d.moment.format('DD日 HH:mm') + " " + d3.format(',.2f')(d.value);
          focus.select('text')
            .text(focus_text)
				    .attr('x', xOffset)
				    .attr('y', -14);
        }
      );
		},

    deleteGraph: function(){
      this.$emit('delete-graph', this.graphId);
    }
  }
});

module.exports = graphComponent;
