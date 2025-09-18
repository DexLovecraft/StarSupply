const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require('./auth');
const mongoose = require('mongoose');
mongoose.connect('mongodb://mongo:27017/starsupplydb');
const { Schema } = mongoose;

//
// 🔹 Schemas
//
const stationSchema = new Schema({
  name: String,
  type: String,
  max_stock: Number,
  inventory: {
    exports: [{ commodity: String, quantity: Number }],
    imports: [{ commodity: String, quantity: Number }]
  },
  productionRules: [
    { input: { commodity: String, quantity: Number },
      output: { commodity: String, quantity: Number } }
  ],
  neighbour: [String]
});

const shipSchema = new Schema({
  type: String,
  name: String,
  inventory_size: Number,
  inventory: [{ commodity: String, quantity: Number }],
  position: String
});

const userSchema = new Schema({
  username: String,
  password: String,
  record: { type: Number, default: 0 }
});

const gameSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ship: shipSchema,               // ✅ un seul vaisseau
  stations: [stationSchema],
  startTime: { type: Date, default: Date.now }
});

const User = mongoose.model('user', userSchema);
const Game = mongoose.model('game', gameSchema);

//
// 🔹 Utils
//
function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//
// 🔹 App
//
const app = express();
app.use(express.json());

app.get('/starsupply/ping', (req, res) => {
  res.json({ message: "Ca marche" });
});

//
// 🔐 Auth
//
app.post('/startsupply/signup', (req, res) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        username: req.body.username,
        password: hash,
        record: 0,
      });
      return user.save();
    })
    .then(() => res.status(201).json({ message: "Utilisateur créé" }))
    .catch(error => res.status(500).json({ error }));
});

app.post('/startsupply/login', (req, res) => {
  User.findOne({ username: req.body.username })
    .then(user => {
      if (!user) return res.status(401).json({ message: "Utilisateur inconnu" });
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) return res.status(401).json({ message: "Mot de passe incorrect" });
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              'SUPER_SECRET_KEY', // ⚠️ à mettre dans .env
              { expiresIn: '24h' }
            )
          });
        });
    })
    .catch(error => res.status(500).json({ error }));
});

//
// 🎮 Game management
//
app.post('/starsupply/game/start', auth, async (req, res) => {
  try {
    const existing = await Game.findOne({ userId: req.auth.userId });
    if (existing) return res.status(400).json({ error: "Game already running" });

    // Seed stations
    const stations = [
      {
        name: "New-Paris",
        type: "Habitat",
        max_stock: 1000,
        inventory: {
          exports: [
            { commodity: "Medical-Supply", quantity: randomRange(100, 200) },
            { commodity: "Scrap", quantity: randomRange(700, 900) }
          ],
          imports: [
            { commodity: "Construction-Material", quantity: randomRange(220, 380) },
            { commodity: "Chemical", quantity: randomRange(60, 140) }
          ]
        },
        productionRules: [
          { input: { commodity: "Construction-Material", quantity: 10 }, output: { commodity: "Scrap", quantity: 10 } },
          { input: { commodity: "Chemical", quantity: 4 }, output: { commodity: "Medical-Supply", quantity: 10 } }
        ],
        neighbour: ['Drillpoint','Aeritha-Crafter','Prospector-7']
      }
      // 👉 ajoute tes autres stations ici
    ];

    // Ship spawn
    const spawnStation = stations[Math.floor(Math.random() * stations.length)];
    const ship = {
      type: 'ship',
      name: "LCH-Bebop-1",
      inventory_size: 324,
      inventory: [],
      position: spawnStation.name
    };

    const game = new Game({
      userId: req.auth.userId,
      ship,
      stations
    });

    await game.save();
    res.status(201).json({ message: "Game started", gameId: game._id, spawn: spawnStation.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/starsupply/game/reset', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ userId: req.auth.userId });
    if (!game) return res.status(404).json({ error: "No game running" });

    const duration = Math.floor((Date.now() - game.startTime) / 1000);
    const user = await User.findById(req.auth.userId);
    if (duration > user.record) {
      user.record = duration;
      await user.save();
    }
    await Game.deleteOne({ _id: game._id });
    res.json({ message: "Game reset", duration, bestRecord: user.record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 🚀 Ship routes
//
app.get('/starsupply/ship', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  res.json({ name: game.ship.name, position: game.ship.position });
});

app.get('/starsupply/ship/inventory', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  res.json({ inventory: game.ship.inventory });
});

app.get('/starsupply/ship/position', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  res.json({ position: game.ship.position });
});

app.get('/starsupply/ship/destination', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  const station = game.stations.find(s => s.name === game.ship.position);
  if (!station) return res.status(404).json({ error: "Station not found" });
  res.json({ destinations: station.neighbour });
});

app.get('/starsupply/ship/load/:supply/:quantity', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ userId: req.auth.userId });
    if (!game) return res.status(404).json({ error: "No game" });

    const { supply, quantity } = req.params;
    const qty = Number(quantity);

    const station = game.stations.find(s => s.name === game.ship.position);
    if (!station) return res.status(404).json({ error: "Station not found" });

    let exported = station.inventory.exports.find(i => i.commodity === supply);
    if (!exported || exported.quantity < qty) {
      return res.status(400).json({ error: "Not enough supply in station" });
    }

    const totalInShip = game.ship.inventory.reduce((sum, i) => sum + i.quantity, 0);
    if (totalInShip + qty > game.ship.inventory_size) {
      return res.status(400).json({ error: "Not enough space in ship inventory" });
    }

    let item = game.ship.inventory.find(i => i.commodity === supply);
    if (item) item.quantity += qty;
    else game.ship.inventory.push({ commodity: supply, quantity: qty });

    exported.quantity -= qty;
    await game.save();

    res.json({ status: "Loaded successfully", ship: game.ship, station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/starsupply/ship/delivery/:supply/:quantity', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ userId: req.auth.userId });
    if (!game) return res.status(404).json({ error: "No game" });

    const { supply, quantity } = req.params;
    const qty = Number(quantity);

    const station = game.stations.find(s => s.name === game.ship.position);
    if (!station) return res.status(404).json({ error: "Station not found" });

    let item = game.ship.inventory.find(i => i.commodity === supply);
    if (!item || item.quantity < qty) {
      return res.status(400).json({ error: "Not enough supply in ship" });
    }

    let imported = station.inventory.imports.find(i => i.commodity === supply);
    if (!imported || imported.quantity + qty > station.max_stock) {
      return res.status(400).json({ error: "Station does not accept this supply" });
    }

    item.quantity -= qty;
    imported.quantity += qty;
    await game.save();

    res.json({ status: "Delivered successfully", ship: game.ship, station });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/starsupply/ship/jump/:where', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ userId: req.auth.userId });
    if (!game) return res.status(404).json({ error: "No game" });

    const { where } = req.params;
    const station = game.stations.find(s => s.name === game.ship.position);
    if (!station) return res.status(404).json({ error: "Station not found" });

    if (!station.neighbour.includes(where)) {
      return res.status(400).json({ error: `No gate to ${where}` });
    }

    game.ship.position = where;
    await game.save();

    res.json({ status: "Jump successful", newPosition: game.ship.position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 🛰️ Stations routes
//
app.get('/starsupply/stations', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  res.json(game.stations.map(s => ({ name: s.name, type: s.type })));
});

app.get('/starsupply/stations/:name/inventory', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  const station = game.stations.find(s => s.name === req.params.name);
  if (!station) return res.status(404).json({ error: "Station not found" });
  res.json({ inventory: station.inventory });
});

app.get('/starsupply/stations/:from/path/:to', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });

  const { from, to } = req.params;
  const startStation = game.stations.find(s => s.name === from);
  const endStation = game.stations.find(s => s.name === to);
  if (!startStation || !endStation) {
    return res.status(404).json({ error: "Station not found" });
  }

  let queue = [[from]];
  let visited = new Set([from]);

  while (queue.length > 0) {
    let path = queue.shift();
    let current = path[path.length - 1];

    if (current === to) {
      return res.json({ path });
    }

    const station = game.stations.find(s => s.name === current);
    if (!station) continue;

    for (let neighbour of station.neighbour) {
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push([...path, neighbour]);
      }
    }
  }

  res.status(404).json({ error: `No path from ${from} to ${to}` });
});

app.get('/starsupply/station/:name/percentage', auth, async (req, res) => {
  const game = await Game.findOne({ userId: req.auth.userId });
  if (!game) return res.status(404).json({ error: "No game" });
  const station = game.stations.find(s => s.name === req.params.name);
  if (!station) return res.status(404).json({ error: "Station not found" });

  let importPercentage = station.inventory.imports.map(i => ({
    [i.commodity]: Math.round((i.quantity / station.max_stock) * 100)
  }));

  let exportPercentage = station.inventory.exports.map(e => ({
    [e.commodity]: Math.round((e.quantity / station.max_stock) * 100)
  }));

  res.json({ imports: importPercentage, exports: exportPercentage });
});

//
// ⚙️ Update automatique des stocks
//
async function updateStationsInventory() {
  const games = await Game.find();
  for (let game of games) {
    for (let station of game.stations) {
      for (let rule of station.productionRules) {
        let input = station.inventory.imports.find(i => i.commodity === rule.input.commodity);
        let output = station.inventory.exports.find(i => i.commodity === rule.output.commodity);
        if (input && input.quantity >= rule.input.quantity) {
          input.quantity -= rule.input.quantity;
          if (output) {
            output.quantity = Math.min(station.max_stock, output.quantity + rule.output.quantity);
          } else {
            station.inventory.exports.push({ commodity: rule.output.commodity, quantity: rule.output.quantity });
          }
        }
      }
    }
    await game.save();
  }
  console.log("Inventaires mis à jour");
}
setTimeout(()=>{setInterval((updateStationsInventory), 90*1000)}, 2*1000)


app.listen(50051, () => console.log('50051'));
