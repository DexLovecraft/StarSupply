const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mongod');
const { Schema } = mongoose;

const stationSchema = new Schema({
  name: String,
  type: String,
  inventory :{ 
    export:{
      commoditiy: String,
      quantity: Number
    },
    imports:{
      commodity: String,
      quantity: Number
    }
  },
  neighbour : Array
});

const shipSchema = new Schema({
  name: String,
  inventory_size : Number,
  inventory : {
    commoditiy: String,
    quantity: Number
  },
  position: String
})

const station = mongoose.model('station', stationSchema);
const Ship = mongoose.model('ship', shipSchema);

const hullA = new Ship({
  name: 'Hull-a',
  inventory_size : 64,
  inventory: {
    commoditiy: 'Medical Supplies',
    quantity: 50
  },
  position: 'Hurston'
}) 
hullA.save();

const app = express();
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json());

//app.use('url', routes)
app.get('/starsupply/ping', (req, res) => {
  res.json({message: "Ca marche"});
});

app.get('/starsupply/ship', (req, res) => {
  Ship.find()
  .then(ships => res.json({ 'Liste des vaisseaux': ships.name }))
  .catch(error => res.status(404).json({ error }))
})

app.get('/starsupply/ship/invetory/:name', (req, res) => {
  Ship.findOne({name: req.params.name})
  .then(ship => res.json({ "Inventaire": ship.inventory}))
  .catch(error => res.status(404).json({ error }))
})

app.listen(50051, function(){
  console.log('50051')
})