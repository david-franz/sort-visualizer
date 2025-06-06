const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let algorithms = [];
let nextId = 1;

app.get('/api/algorithms', (req, res) => {
  res.json(algorithms);
});

app.get('/api/algorithms/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const algo = algorithms.find(item => item.id === id);
  if (algo) {
    res.json(algo);
  } else {
    res.status(404).json({ error: 'Algorithm not found' });
  }
});

app.post('/api/algorithms', (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const newAlgo = { id: nextId++, name, description: description || '' };
  algorithms.push(newAlgo);
  res.status(201).json(newAlgo);
});

app.put('/api/algorithms/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const algo = algorithms.find(item => item.id === id);
  if (!algo) {
    return res.status(404).json({ error: 'Algorithm not found' });
  }
  const { name, description } = req.body;
  if (name) algo.name = name;
  if (description) algo.description = description;
  res.json(algo);
});

app.delete('/api/algorithms/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = algorithms.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Algorithm not found' });
  }
  const deleted = algorithms.splice(index, 1);
  res.json(deleted[0]);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});