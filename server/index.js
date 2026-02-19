const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Use a different port than the old app

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('¡El servidor de Futbol_LD está funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});