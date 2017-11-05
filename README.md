# ULGV 
汎用的なライングラフビューア

グラフにしたいデータを Post するとリアルタイムに描画される

### Technology
* Vue.js
* d3.js
* socket.io

### Ready
```
$ npm install
```

### Build
```
$ npm run build
```

### Run
```
$ npm run start
```

### Access
http://localhost:3000/

### Post Graph Data
http://localhost:3000/graph

### Graph Data Format
json data
```
"id": "1",
"data": [
  { "t":"2017/10/27 01:00:00", "v":100 },
  { "t":"2017/10/27 02:00:00", "v":110 },
  { "t":"2017/10/27 03:00:00", "v":120 },
             :
  ]
```
