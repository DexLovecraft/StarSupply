const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/starsupplydb');
const { Schema } = mongoose;

const stationSchema = new Schema({
  name: String,
  type: String,
  inventory_size : Number,
  inventory: {
    exports: [{
      commodity: String,
      quantity: Number
    }],
    imports: [{
      commodity: String,
      quantity: Number
    }]
  },
  neighbour : [String]
});

const shipSchema = new Schema({
  name: String,
  inventory_size : Number,
  inventory : [{
    commodity: String,
    quantity: Number
  }],
  position: String
})

const Station = mongoose.model('station', stationSchema);
const Ship = mongoose.model('ship', shipSchema);

const Haul = new Ship({
  name: 'Haul',
  inventory_size : 64,
  inventory: [{
    commodity: 'Medical Supplies',
    quantity: 50
  }],
  position: 'Drillpoint'
}) 
Haul.save().then(() => console.log("Ship saved")).catch(err => console.error(err));

const Whale = new Ship({
  name: 'Whale',
  inventory_size : 1000,
  inventory: [{
    commodity: 'Medical Supplies',
    quantity: 50
  }],
  position: 'Drillpoint'
}) 
Whale.save().then(() => console.log("Ship saved")).catch(err => console.error(err));

const newParis = new Station({
  name: "New-Paris",
  type: "Habitat",
  inventory_size : 1000,
  inventory: {
    exports: [{
      commodity: "Medical Supply",
      quantity: 500
    },
    {
      commodity: "Scrap",
      quantity: 600
    }],
    imports: [{
      commodity: "Construction Material",
      quantity: 120
    },
    {
      commodity: 'Chemicals',
      quantity: 190
    }]
  },
  neighbour: ['Drillpoint','Aeritha Crafter','Prospector-7']
})
newParis.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const prospector7 = new Station({
  name: "Prospector-7",
  type: "Minage",
  inventory_size : 1000,
  inventory: {
    exports: [{
      commodity: "Ore",
      quantity: 550
    },
    {
      commodity: "Gas",
      quantity: 300
    }],
    imports: [{
      commodity: "Medical Supply",
      quantity: 240
    },
    {
      commodity: 'Explosive',
      quantity: 90
    }]
  },
  neighbour: ['New-Paris']
})
prospector7.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const drillpoint = new Station({
  name: "Drillpoint",
  type: "Minage",
  inventory_size : 1000,
  inventory: {
    exports: [{
      commodity: "Ore",
      quantity: 400
    },
    {
      commodity: "Crystal",
      quantity: 650
    }],
    imports: [{
      commodity: "Medical Supply",
      quantity: 140
    },
    {
      commodity: 'Explosive',
      quantity: 210
    }]
  },
  neighbour: ['New-Paris','Artemis-Foundry']
})
drillpoint.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const artemisFoundry = new Station({
  name: "Artemis-Foundry",
  type: "Industrie",
  inventory_size : 1000,
  inventory: {
    exports: [{
      commodity: "Construction Material",
      quantity: 500
    },
    {
      commodity: "PCB",
      quantity: 600
    }],
    imports: [{
      commodity: "Ore",
      quantity: 120
    },
    {
      commodity: 'Crystal',
      quantity: 190
    }]
  },
  neighbour: ['Drillpoint','Aeritha-Crafter']
})
artemisFoundry.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const aerithaCrafter = new Station({
  name: "Aeritha-Crafter",
  type: "Industrie",
  inventory_size : 1000,
  inventory: {
    exports: [{
      commodity: "Explosive",
      quantity: 500
    },
    {
      commodity: "Chemicals",
      quantity: 600
    }],
    imports: [{
      commodity: "Ore",
      quantity: 120
    },
    {
      commodity: 'Gas',
      quantity: 190
    }]
  },
  neighbour: ['Artemis-Foundry','New-Paris']
})
aerithaCrafter.save().then(() => console.log("Station saved")).catch(err => console.error(err));

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

app.get('/starsupply/ships', (req, res) => {
  Ship.find({},{
    _id: 0,
    name: 1,
    inventory_size: 0,
    inventory:0,
    position: 1
  }).then(ship => res.json({ 'Liste des vaisseaux': ship }))
  .catch(error => res.status(404).json({ error }))
})


app.get('/starsupply/stations', (req, res) => {
  Station.find({},{
    _id: 0,
    name: 1,
    type: 1,
    inventory_size: 0,
    inventory :0,
    neighbour : 0
  }).then(station => res.json({ 'Liste des Stations': station }))
  .catch(error => res.status(404).json({ error }))
})


app.get('/starsupply/ship/:name/inventory', (req, res) => {
  Ship.findOne({name: req.params.name})
  .then(ship => res.json({ "Inventaire": ship.inventory}))
  .catch(error => res.status(404).json({ error }))
})

app.get('/starsupply/ship/:name/position', (req, res) => {
  Ship.findOne({name: req.params.name})
  .then(ship => res.json({ "Position": ship.position}))
  .catch(error => res.status(404).json({ error }))
})

app.get('/starsupply/ship/:name/destination', (req, res) => {
  Ship.findOne({name: req.params.name})
  .then(ship => {
    Station.findOne({name: ship.position})
    .then(station => res.status(200).json({"Voyages possible" : station.neighbour}))
    .catch(error => res.status(404).json({ error }))
  })
  .catch(error => res.status(404).json({ error }))
})

app.get('/starsupply/ship/:name/load/:supply/:quantity', async (req, res) => {
  try {
    const { name, supply, quantity } = req.params;
    const qty = Number(quantity);

    const ship = await Ship.findOne({ name });
    if (!ship) return res.status(404).json({ error: "Ship not found" });

    const station = await Station.findOne({ name: ship.position });
    if (!station) return res.status(404).json({ error: "Station not found" });

    // Vérifie que la station a bien ce produit en export
    let exported = station.inventory.exports.find(i => i.commodity === supply);
    if (!exported || exported.quantity < qty) {
      return res.status(400).json({ error: "Not enough supply in station" });
    }

    // Vérifie la capacité du vaisseau
    const totalInShip = ship.inventory.reduce((sum, i) => sum + i.quantity, 0);
    if (totalInShip + qty > ship.inventory_size) {
      return res.status(400).json({ error: "Not enough space in ship inventory" });
    }

    // Ajoute au vaisseau
    let item = ship.inventory.find(i => i.commodity === supply);
    if (item) {
      item.quantity += qty;
    } else {
      ship.inventory.push({ commodity: supply, quantity: qty });
    }

    // Retire de la station
    exported.quantity -= qty;

    await ship.save();
    await station.save();

    res.json({ status: "Loaded successfully", ship, station });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/starsupply/ship/:name/delivery/:supply/:quantity', async (req, res) => {
  try {
    const { name, supply, quantity } = req.params;
    const qty = Number(quantity);

    const ship = await Ship.findOne({ name });
    if (!ship) return res.status(404).json({ error: "Ship not found" });

    const station = await Station.findOne({ name: ship.position });
    if (!station) return res.status(404).json({ error: "Station not found" });

    // Vérifie que le vaisseau a bien ce produit
    let item = ship.inventory.find(i => i.commodity === supply);
    if (!item || item.quantity < qty) {
      return res.status(400).json({ error: "Not enough supply in ship" });
    }

    // Vérifie que la station accepte ce produit
    let imported = station.inventory.imports.find(i => i.commodity === supply);
    if (!imported) {
      return res.status(400).json({ error: "Station does not accept this supply" });
    }

    // Retire du vaisseau
    item.quantity -= qty;

    // Ajoute à la station
    imported.quantity += qty;

    await ship.save();
    await station.save();

    res.json({ status: "Delivered successfully", ship, station });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(50051, function(){
  console.log('50051')
})