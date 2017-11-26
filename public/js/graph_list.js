module.exports = Vue.component('graph-list',{
  template: '<div>\
          <ul class="history">\
            <li v-for="graph in allGraphs" \
                v-bind:class="{ \
                  \'normal-history\': isNormal(graph), \
                  \'missing-history\': !isNormal(graph), \
                  \'selected-history\': isSelected(graph), \
                  \'focused-history\': isFocused(graph),\
                  \'history-update\': isUpdating(graph) \
                }" \
                v-on:click="selectListItem(graph)" \
                v-on:mouseenter="enterListItem(graph)" \
                v-on:mouseleave="leaveListItem(graph)" \
                > \
              <div class="history-body"> \
                <div> \
                  ID:{{graph.id}} {{firstDate(graph)}} - {{dataCount(graph)}} \
                </div> \
              </div> \
            </li> \
          </ul> \
        </div>',

  props: ["graphs"],

  data: function(){
    return {
    }
  },

  computed: {
    allGraphs: function(){
      return this.graphs != null ? this.graphs : [];
    }
  },


  watch: {
  },

  methods: {
    isSelected: function(graph){
      return graph.isSelected;
    },

    isFocused: function(graph){
      return graph.isFocused;
    },

    isUpdating: function(graph){
      return graph.isUpdating;
    },

    isNormal: function(graph){
      return graph.status == "Normal";
    },

    firstDate: function(graph){
      return graph.data[0].m.format("YYYY/MM/DD HH:mm");
    },

    dataCount: function(graph){
      return graph.data.length;
    },
 
    selectListItem: function(graph){
      graph.isSelected = !graph.isSelected;
      this.$emit('redraw-all');
    },

    enterListItem: function(graph){
      graph.isFocused = true;
    },

    leaveListItem: function(graph){
      graph.isFocused = false;
    },
  }
});
