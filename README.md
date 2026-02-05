# Claridad - Acompañamiento Emocional con IA

Chat especializado para mujeres de 30-45 años con inteligencia emocional sobre maternidad, pareja y relaciones familiares.

## 🚀 Despliegue Rápido

### Opción 1: Railway (Recomendado)

1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta (gratis)
3. Click en "New Project" → "Deploy from GitHub repo"
4. Conecta tu repositorio de GitHub
5. **IMPORTANTE**: Añade la variable de entorno:
   - `ANTHROPIC_API_KEY` = tu-api-key-de-anthropic

Tu app estará lista en 2-3 minutos con una URL como: `https://claridad-production.up.railway.app`

### Opción 2: Render

1. Ve a [render.com](https://render.com)
2. New → Web Service
3. Conecta tu repo de GitHub
4. Configura:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Añade variable de entorno: `ANTHROPIC_API_KEY`

### Opción 3: Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Import Project
3. Selecciona tu repo
4. Añade variable de entorno: `ANTHROPIC_API_KEY`

## 🔧 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Crear archivo .env con tu API key
cp .env.example .env
# Edita .env y añade: ANTHROPIC_API_KEY=tu-api-key-real

# Iniciar servidor
npm start
```

Abre http://localhost:3000

## 📦 Estructura

```
claridad-backend/
├── server.js          # Servidor Express con proxy seguro a Anthropic API
├── public/
│   └── index.html     # Frontend con chat de IA
├── package.json       # Dependencias
└── .env.example       # Plantilla para variables de entorno
```

## 🔐 Seguridad

- La API key de Anthropic está **solo en el servidor** (variable de entorno)
- Los usuarios **NO necesitan** introducir ninguna API key
- El frontend llama a `/api/chat` que hace proxy a Anthropic API

## 🎯 Módulos Disponibles

1. **Maternidad**: Decidir sobre tener hijos
2. **Pareja**: Conflictos familiares y de crianza
3. **Familia política**: Límites con suegros

## 📝 Conseguir tu API Key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys"
4. Crea una nueva key
5. Cópiala (¡solo se muestra una vez!)

## 💡 Tips

- Railway, Render y Vercel tienen tier **GRATUITO**
- Railway: $5 gratis al mes
- Render: Apps ilimitadas con hibernación
- Vercel: Excelente para frontends + serverless

## 🐛 Problemas Comunes

**"API key no configurada"**: Asegúrate de añadir `ANTHROPIC_API_KEY` en las variables de entorno de tu plataforma de deploy.

**No carga la página**: Verifica que el puerto se configure automáticamente con `process.env.PORT`.

**Error 500**: Revisa los logs del servidor para ver el error específico.
