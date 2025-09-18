const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/starsupplydb');
const { Schema } = mongoose;

const stationSchema = new Schema({
  name: String,
  type: String,
  max_stock: Number,
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
  productionRules: [
    {
      input: { commodity: String, quantity: Number },
      output: { commodity: String, quantity: Number }
    }
  ],
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

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const LCHBebop1 = new Ship({
  name: 'LCH-Bebop-1',
  inventory_size : 496,
  inventory: [],
  position: 'Drillpoint'
}) 
LCHBebop1.save().then(() => console.log("Ship saved")).catch(err => console.error(err));

const newParis = new Station({
  name: "New-Paris",
  type: "Habitat",
  max_stock : 1000,
  inventory: {
    exports: [{
      commodity: "Medical-Supply",
      quantity: randomRange(80, 200) 
    },
    {
      commodity: "Scrap",
      quantity: randomRange(50, 120) 
    }],
    imports: [{
      commodity: "Construction-Material",
      quantity: randomRange(150, 300) 
    },
    {
      commodity: 'Chemical',
      quantity: randomRange(50, 150) 
    }]
  },
  productionRules: [
    {
      input: { commodity: "Construction-Material", quantity: 10 },
      output: { commodity: "Scrap", quantity: 5 }
    },
    {
      input: { commodity: "Chemical", quantity: 4 },
      output: { commodity: "Medical-Supply", quantity: 12 }
    }
  ],
  neighbour: ['Drillpoint','Aeritha Crafter','Prospector-7']
})
newParis.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const prospector7 = new Station({
  name: "Prospector-7",
  type: "Minage",
  max_stock : 1000,
  inventory: {
    exports: [{
      commodity: "Ore",
      quantity: randomRange(200, 400) 
    },
    {
      commodity: "Gas",
      quantity: randomRange(150, 250) 
    }],
    imports: [{
      commodity: "Medical-Supply",
      quantity: randomRange(50, 120) 
    },
    {
      commodity: 'Explosive',
      quantity: randomRange(20, 60) 
    }]
  },
  productionRules: [
    {
      input: { commodity: "Explosive", quantity: 1 },
      output: { commodity: "Ore", quantity: 5 }
    },
    {
      input: { commodity: "Medical-Supply", quantity: 4 },
      output: { commodity: "Gas", quantity: 12 }
    }
  ],
  neighbour: ['New-Paris']
})
prospector7.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const drillpoint = new Station({
  name: "Drillpoint",
  type: "Minage",
  max_stock : 1000,
  inventory: {
    exports: [{
      commodity: "Ore",
      quantity: randomRange(200, 400) 
    },
    {
      commodity: "Crystal",
      quantity: randomRange(150, 250) 
    }],
    imports: [{
      commodity: "Medical-Supply",
      quantity: randomRange(50, 120) 
    },
    {
      commodity: 'Explosive',
      quantity: randomRange(20, 60) 
    }]
  },
  productionRules: [
    {
      input: { commodity: "Explosive", quantity: 1 },
      output: { commodity: "Ore", quantity: 5 }
    },
    {
      input: { commodity: "Medical-Supply", quantity: 4 },
      output: { commodity: "Crystal", quantity: 12 }
    }
  ],
  neighbour: ['New-Paris','Artemis-Foundry']
})
drillpoint.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const artemisFoundry = new Station({
  name: "Artemis-Foundry",
  type: "Industrie",
  max_stock : 1000,
  inventory: {
    exports: [{
      commodity: "Construction-Material",
      quantity: randomRange(120, 250) 
    }],
    imports: [{
      commodity: "Ore",
      quantity: randomRange(200, 400) 
    },
    {
      commodity: 'Crystal',
      quantity: randomRange(150, 300) 
    }]
  },
  productionRules: [
    {
      input: { commodity: "Ore", quantity: 10 },
      output: { commodity: "Construction-Material", quantity: 8}
    },
    {
      input: { commodity: "Crystal", quantity: 4 },
      output: { commodity: "Construction-Material", quantity: 3 }
    }
  ],
  neighbour: ['Drillpoint','Aeritha-Crafter']
})
artemisFoundry.save().then(() => console.log("Station saved")).catch(err => console.error(err));

const aerithaCrafter = new Station({
  name: "Aeritha-Crafter",
  type: "Industrie",
  max_stock : 1000,
  inventory: {
    exports: [{
      commodity: "Explosive",
      quantity: randomRange(60, 150) 
    },
    {
      commodity: "Chemical",
      quantity: randomRange(80, 180) 
    }],
    imports: [{
      commodity: "Ore",
      quantity: randomRange(200, 400) 
    },
    {
      commodity: 'Gas',
      quantity: randomRange(150, 300) 
    }]
  },
  productionRules: [
    {
      input: { commodity: "Ore", quantity: 7 },
      output: { commodity: "Explosive", quantity: 2 }
    },
    {
      input: { commodity: "Gas", quantity: 9 },
      output: { commodity: "Chemical", quantity: 6 }
    }
  ],
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
    position: 1
  }).then(ship => res.json({ 'Liste des vaisseaux': ship }))
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
    if (!imported || station.max_stock < imported.quantity + qty) {
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

app.get('/starsupply/ship/:name/jump/:where', async (req, res) => {
  try {
    const { name, where } = req.params;

    const ship = await Ship.findOne({ name });
    if (!ship) return res.status(404).json({ error: "Ship not found" });

    const station = await Station.findOne({ name: ship.position });
    if (!station) return res.status(404).json({ error: "Station not found" });

    // Vérifie que la destination est bien reliée
    if (!station.neighbour.includes(where)) {
      return res.status(400).json({ error: `No gate to ${where} from ${station.name}` });
    }

    // Met à jour la position du vaisseau
    ship.position = where;
    await ship.save();

    res.json({ status: "Jump successful", newPosition: ship.position });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/starsupply/stations/:from/path/:to', async (req, res) => {
  try {
    const { from, to } = req.params;

    // Vérifie que les stations existent
    const startStation = await Station.findOne({ name: from });
    const endStation = await Station.findOne({ name: to });
    if (!startStation || !endStation) {
      return res.status(404).json({ error: "Station not found" });
    }

    // BFS setup
    let queue = [[from]];   // file de chemins possibles
    let visited = new Set([from]);

    while (queue.length > 0) {
      let path = queue.shift();       // prend le premier chemin de la file
      let current = path[path.length - 1]; // dernière station du chemin

      if (current === to) {
        return res.json({ path });   // trouvé !
      }

      const station = await Station.findOne({ name: current });
      for (let neighbour of station.neighbour) {
        if (!visited.has(neighbour)) {
          visited.add(neighbour);
          queue.push([...path, neighbour]); // étend le chemin
        }
      }
    }

    res.status(404).json({ error: `No path found from ${from} to ${to}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/starsupply/stations', (req, res) => {
  Station.find({},{
    _id: 0,
    name: 1,
    type: 1
  }).then(station => res.json({ 'Liste des Stations': station }))
  .catch(error => res.status(404).json({ error }))
})

app.get('/starsupply/stations/:name/inventory', (req, res) => {
  Station.findOne({name: req.params.name})
  .then(station => res.json({ "Inventaire": station.inventory}))
  .catch(error => res.status(404).json({ error }));
})

app.get('/starsupply/station/:name/percentage', async (req, res) => {
    try {
      const station = await Station.findOne({name : req.params.name});
      if (!station) return res.status(404).json({ error: "Station not found" });

      let percentageTable = {}
      let importPercentageTable = []
      let exportPercentageTable = []

      station.inventory.imports.forEach(imports => {
        let importName = imports.commodity
        let importPercent = Math.round((imports.quantity / station.max_stock) * 100)
        importPercentageTable.push({[importName] : importPercent})
      })

      station.inventory.exports.forEach(exports => {
        let exportName = exports.commodity
        let exportPercent = Math.round((exports.quantity / station.max_stock) * 100)
        exportPercentageTable.push({[exportName] : exportPercent})
      })
      percentageTable = {export: exportPercentageTable, import: importPercentageTable}
      res.status(200).json({percentageTable})
    } catch (err) {
    console.error("Erreur:", err.message);
  }
})

async function updateStationsInventory() {
  try {
    const stations = await Station.find();

    for (let station of stations) {
      for (let rule of station.productionRules) {
        // Cherche la ressource d'entrée
        let input = station.inventory.imports.find(i => i.commodity === rule.input.commodity);
        let output = station.inventory.exports.find(i => i.commodity === rule.output.commodity);

        // Vérifie que l'import existe et est suffisant
        if (input && input.quantity >= rule.input.quantity) {
          input.quantity -= rule.input.quantity;

          if (output) {
            // Vérifie max_stock avant d’ajouter
            output.quantity = Math.min(
              station.max_stock,
              output.quantity + rule.output.quantity
            );
          } else {
            station.inventory.exports.push({
              commodity: rule.output.commodity,
              quantity: rule.output.quantity
            });
          }
        }
      }
      await station.save();
    }

    console.log("Inventaires mis à jour");
  } catch (err) {
    console.error("Erreur dans updateStationsInventory:", err.message);
  }
}

setInterval(updateStationsInventory, 5*60*1000);

app.listen(50051, function(){
  console.log('50051')
})