const express = require('express');
const path = require('path');


const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json());

//app.use('url', routes)
app.get('/starsupply/ping', (res, req) => {
  res.json({message: "Ca marche"})
});

app.listen(50051, function(){
  console.log('50051')
})