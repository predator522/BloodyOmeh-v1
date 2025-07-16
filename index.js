const express = require('express');
const makeSocket = require('./socket/connection');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_, res) => {
  res.send('🤖 BloodyOmeh v1 is running.');
});

app.get('/pair', async (req, res) => {
  const number = req.query.number;
  if (!number) return res.status(400).send('Missing ?number= parameter');
  try {
    const code = await makeSocket(number);
    res.send(`🔐 Pairing Code for ${number}: ${code}`);
  } catch (err) {
    res.status(500).send('Error generating pairing code: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
