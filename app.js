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
app.use('/ping', (res, req) => {
  res.status(200).json({message : 'Ca marche'})
} );


module.exports = app;