import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Claridad backend running' });
});

// Endpoint proxy para Claude API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, model } = req.body;

    // Verificar que existe la API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key no configurada en el servidor' 
      });
    }

    // Llamar a la API de Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Anthropic API:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Error al comunicarse con Claude' 
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌟 Claridad backend escuchando en puerto ${PORT}`);
  console.log(`🔑 API Key configurada: ${process.env.ANTHROPIC_API_KEY ? 'Sí ✓' : 'No ✗'}`);
});
