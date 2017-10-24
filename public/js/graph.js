var axios = require("axios");
var moment = require("moment");
moment.locale('ja');

var predictionComponent = Vue.component('prediction',{
  template: '<div>\
    <div class="svg-header">\
      <div class="title-area"><span v-bind:class="{ success: !isError, error: isError }">{{waterLevelResultLatestDispDate}}</span> - {{baseUrlAlias}} P:{{prediction.projectID}} S:{{prediction.stationID}} D:{{prediction.delay}} O:{{prediction.dispOffset}} Now: {{nowWaterLevel}} Max: {{maxWatarLevel}}</div>\
      <div class="delete-button" v-on:click="deletePrediction">x</div>\
    </div>\
    <div class="svg-area">\
      <svg class="prediction-svg"></svg>\
    </div>\
  </div>',

  props: ['prediction', 'target_date'],

  data: function(){
    return {
      waterLevelResult: null,
      waterLevelPlan: null,
      rainFallResult: null,
      rainFallForecast: null,
      chartSetting: null,
      alarmInfo: null,
      svgWidth: 0,
      svgHeight: 0,
      localDate: moment() ,
      waterLevelResultLatestDate: moment(),
      isError: false,
      id: new Date().getTime().toString(16)  + Math.floor(Math.random()).toString(16),
      xMinMax: null,
    }
  },

  computed: {
    baseUrlAlias: function(){
      return this.prediction.baseUrl.match(/\/([^\/]+)\/$/)[0].replace(/\//g,'');
    },
    waterLevelResultLatestDispDate: function(){
      return this.waterLevelResultLatestDate.format('YYYY/MM:DD HH:mm');
    },
    nowWaterLevel: function(){
      if (this.waterLevelResult != null){
        var nowValue = this.waterLevelResult[this.waterLevelResult.length-1].value;
        return Math.floor(nowValue * 100) / 100; 
      }else{
        return '';
      }
    },
    maxWatarLevel: function(){
      if (this.waterLevelPlan != null){
        var maxValue = Math.max.apply(null,this.waterLevelPlan.map(function(p){ return p.value;}));
        return Math.floor(maxValue * 100) / 100; 
      }else{
        return '';
      }
    }
  },

  watch: {
    target_date: function(){
      this.update();
    }
  },

  mounted: function(){
    this.update();
  },

  updated: function(){
    if (this.prediction.projectID != this.chartSetting.ProjectID){
      // 削除後にProjectID がずれたら読み直す
      this.localDate = moment();
      this.update();
    }
  },

  methods: {
    update: function(){
      var self = this;

      this.updateData()
        .then(
          function(success){
            if (success){
              var forceUpdate = true;
              self.updateGraph(forceUpdate);
            }
            self.isError = !success;
          },
          function(){
            var forceUpdate = false;
            self.updateGraph(forceUpdate);
          }
        );
    },

    updateData: function(){
      var self = this;

      return new Promise(function(resolve, reject){
        // 遅延を反映し10分単位に変換
        var adjustedDate = moment(self.target_date)
          .add(self.prediction.delay * -1, 'minute')
          .add((self.target_date.minute() % 10) * -1, 'minute')
          .millisecond(0)
          .second(0);

        if (adjustedDate.isSame(self.localDate)){
          // 更新済みの場合はデータを取得しない
          reject(); return;
        }

        self.localDate = adjustedDate;
        console.log(adjustedDate.format('YYYY:MM:DD HH:mm:ss'));

        var param = {
          baseUrl: self.prediction.baseUrl,
          projectID: self.prediction.projectID,
          stationID: self.prediction.stationID,
          year: adjustedDate.year(),
          month: adjustedDate.month() + 1,
          day: adjustedDate.date(),
          hour: adjustedDate.hour(),
          minute: parseInt(adjustedDate.minute() / 10) * 10
        };

        function getWaterLevelResult(){
          var url = "PostWaterLevelResultChartDataSelectDateForDateNum";
          return axios.post(url, param);
        }

        function getWaterLevelPlan(){
          var url = "PostWaterLevelPlanChartDataSelectDateForDateNum";
          return axios.post(url, param);
        }

        function getRainFallResult(){
          var url = "PostRainfallResultChartDataSelectDateForDateNum";
          return axios.post(url, param);
        }

        function getRainFallForecast(){
          var url = "PostRainfallForecastChartDataSelectDateForDateNum";
          return axios.post(url, param);
        }

        function getChartSetting(){
          var url = "postChartSetting";
          return axios.post(url, param);
        }

        function getAlarmInfo(){
          var url = "postAlarmInfo";
          return axios.post(url, param);
        }


        axios.all([
          getWaterLevelResult(),
          getWaterLevelPlan(),
          getRainFallResult(),
          getRainFallForecast(),
          getChartSetting(),
          getAlarmInfo()
        ])
          .then(axios.spread(function (wlr, wlp, rfr, rff, chs, alm) {
            console.log(wlr);
            console.log(wlp);
            console.log(rfr);
            console.log(rff);
            console.log(chs);
            console.log(alm);

            if (wlr.data.ChartDates.length == 0 || wlp.data.ChartDates.length == 0 || chs.data.length == 0){
              // データが不完全
              resolve(false); return;
            }

            self.waterLevelResultLatestDate = moment(wlr.data.ChartDates[wlr.data.ChartDates.length-1]);

            // 水位実績
            self.waterLevelResult = wlr.data.ChartDates.map(function(d,i){
              return {
                moment: moment(d),
                date: moment(d).toDate(),
                value: wlr.data.WaterLevels[i]
              };
            });
            // 水位予測
            self.waterLevelPlan = wlp.data.ChartDates.map(function(d,i){
              return {
                moment: moment(d),
                date: moment(d).toDate(),
                value: wlp.data.WaterLevels[i]
              };
            });
            // 雨量実績
            self.rainFallResult = rfr.data.ChartDates.map(function(d,i){
              return {
                moment: moment(d),
                date: moment(d).toDate(),
                value: rfr.data.WaterLevels[i]
              };
            });
            // 雨量予報
            self.rainFallForecast = rff.data.ChartDates.map(function(d,i){
              return {
                moment: moment(d),
                date: moment(d).toDate(),
                value: rff.data.WaterLevels[i]
              };
            });


            self.xMinMax = [
              self.waterLevelResult[0].moment.add(self.prediction.dispOffset,'m').toDate(),
              self.waterLevelPlan[self.waterLevelPlan.length-1].moment.add(self.prediction.dispOffset,'m').toDate()
            ];

            if (chs.data.length > 0){
              self.chartSetting = chs.data[0];
            }

            if (alm.data.length > 0){
              self.alarmInfo = alm.data;
            }

            resolve(true);
          }));
      });
    },

    updateGraph: function(forceUpdate){
      var self = this;

      if (self.waterLevelResult == null){ return; }

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

      // 水位グラフ
      self.drawWaterLevelGraph(g, x, width, height, mouseHandlers);

      // 雨量グラフ
      self.drawRainFallGraph(g, x, width, height, mouseHandlers);

      // フォーカス
      self.drawFocuses(g, width, height, mouseHandlers);
    },

    drawWaterLevelGraph: function(g, x, width, height, mouseHandlers){
      var self = this;

      var adjustedResult = self.waterLevelResult.filter(function(wr){ return self.xMinMax[0] <= wr.date; });
      var adjustedPlan = [self.waterLevelResult[self.waterLevelResult.length-1]].concat(self.waterLevelPlan)
                           .filter(function(wp){ return self.xMinMax[0] <= wp.date; });

      var water_lines = [
        { id: "water-result", color: "deepskyblue", values: adjustedResult },
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

      // 警報線
      self.drawAlarmInfoGraph(g, x, y, width, height);


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
      self.drawWaterLevelFocus(g, x, y, width, height, adjustedResult.concat(adjustedPlan), mouseHandlers);
    },

    drawAlarmInfoGraph: function(g, x, y, width, height){
      var self = this;

      if (self.alarmInfo == null || self.alarmInfo.length == 0){ return; }

      var alerm_lines = self.alarmInfo.map(function(a){
        return {
          color: a.ColorName,
          values: [
            { x: 0, value: a.Value },
            { x: width, value: a.Value }
          ]
        }
      });

      var line = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return y(d.value); });

      var alerm_line = g.selectAll(".alerm-line")
        .data(alerm_lines)
        .enter().append("g")
        .attr("class", "alerm-line");

      alerm_line.append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return d.color;})
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 0.5)
        .attr("d", function(d){ return line(d.values);});
    },


    drawRainFallGraph: function(g, x, width, height, mouseHandlers){
      var self = this;

      if (!self.chartSetting.RainEnabled) { return;}

      var adjustedRainResult = self.rainFallResult.filter(function(rfr){ return self.xMinMax[0] <= rfr.date; });
      var adjustedRainForecast = self.rainFallForecast.filter(function(rff){ return self.xMinMax[0] <= rff.date; });

      var y2 = d3.scaleLinear().rangeRound([height, 0]);
      var barWidth = parseInt(width / (moment(self.xMinMax[1]).diff(moment(self.xMinMax[0]),'minutes') / 10));
      y2.domain([self.chartSetting.RainYMaxValue, 0]);
      g.append("g")
        .call(d3.axisRight(y2))
        .attr("transform", "translate(" + width + ",0)")
        .append("text")
        .attr("fill", "#000")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end");


      if (adjustedRainResult.length > 0){
        var rain_result_bar = g.selectAll(".rain-result-bar")
          .data(adjustedRainResult)
          .enter().append("rect")
          .attr("class", "rain-result-bar")
          .attr("fill", "blue")
          .attr("x", function(d,i) {
            if (i == 0){
              return x(d.date) - (x(d.date) - 0);
            }else{
              return x(d.date) - (x(d.date) - x(adjustedRainResult[i-1].date));
            }
          })
          .attr("y", function(d) { return 0; })
          .attr("width", function(d,i){
            if (i == 0){
              return (x(d.date) - 0);
            }else{
              return (x(d.date) - x(adjustedRainResult[i-1].date));
            }
          })
          .attr("height", function(d) { return y2(d.value); });
      }

      if (adjustedRainForecast.length > 0){
        var xOffset = 0;
        if (adjustedRainResult.length > 0){
          xOffset = x(adjustedRainResult[adjustedRainResult.length-1].date);
        }

        var rain_forecast_bar = g.selectAll(".rain-forecast-bar")
          .data(adjustedRainForecast)
          .enter().append("rect")
          .attr("class", "rain-forecast-bar")
          .attr("fill", "skyblue")
          .attr("x", function(d,i) {
            if (i == 0){
              return x(d.date) - (x(d.date) - xOffset);
            }else{
              return x(d.date) - (x(d.date) - x(adjustedRainForecast[i-1].date));
            }
          })
          .attr("y", function(d) { return 0; })
          .attr("width", function(d,i) {
            if (i == 0){
              return (x(d.date) - xOffset);
            }else{
              return (x(d.date) - x(adjustedRainForecast[i-1].date));
            }
          })
          .attr("height", function(d) { return y2(d.value); });
      }

      // カーソル
      self.drawRainFallFocus(g, x, y2, width, height, adjustedRainResult.concat(adjustedRainForecast), mouseHandlers);
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

		drawWaterLevelFocus: function(g, x, y, width, height, data, mouseHandlers){
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

		drawRainFallFocus: function(g, x, y, width, height, data, mouseHandlers){
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
            .attr('x2', width - x(d.date))
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
				    .attr('y', 14);
        }
      );
    },


    deletePrediction: function(){
      this.$emit('delete-prediction', this.prediction);
    }

  }
});

module.exports = predictionComponent;
