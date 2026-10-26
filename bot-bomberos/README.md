# Bot de convocatorias de bombero/a (Telegram)

Lee cada día los boletines oficiales (BOE, diarios autonómicos, BOP y CIDO; ver `FUENTES-ESPANA.md`),
se queda con las convocatorias de **bombero/a de acceso libre** y las publica en un canal de Telegram.

- `lectores.ts`: un lector por boletín y el filtro (`clasificar`, `debeAvisar`).
- `bot.ts`: ejecución diaria, publicación en Telegram y memoria de lo publicado (`estado.json`).

Sin dependencias: hace falta Node.js 22.18 o superior, que ejecuta TypeScript directamente.

## 1. Telegram

1. En Telegram, habla con **@BotFather** → `/newbot` → guarda el **token**.
2. Añade el bot a tu canal como **administrador** con permiso para **publicar mensajes**.
3. El `TELEGRAM_CHAT_ID` es el `@usuario` del canal si es público. Si es privado, es su ID numérico
   (empieza por `-100`). Para verlo, publica un mensaje en el canal y abre
   `https://api.telegram.org/bot<TOKEN>/getUpdates`: aparece en `channel_post.chat.id`.

## 2. Probar sin publicar

```bash
node bot-bomberos/bot.ts --dry-run                                   # hoy
node bot-bomberos/bot.ts --dry-run --desde 01/10/2026 --hasta 23/10/2026
```

## 3. Poner en marcha (servidor en España recomendado)

Varias fuentes bloquean IPs de fuera de España (ver `FUENTES-ESPANA.md`). Las que ya tienen lector
funcionan desde cualquier sitio, pero para añadir las bloqueadas el bot debe salir por una IP española.

En un VPS con Linux:

```bash
git clone <repo> && cd <repo>
cat > bot-bomberos/.env <<'FIN'
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=@tu_canal
FIN
chmod 600 bot-bomberos/.env
crontab -e
```

Pon el servidor en hora de España (`sudo timedatectl set-timezone Europe/Madrid`) y añade al
crontab tres pasadas, porque algunos boletines salen a media mañana:

```
15 9,13,19 * * *  cd /ruta/al/repo && node --env-file=bot-bomberos/.env bot-bomberos/bot.ts >> bot-bomberos/bot.log 2>&1
```

## Comportamiento

- **Primera ejecución:** solo publica lo de **hoy**, para no inundar el canal.
- **Después:** recupera los días que falten desde la última ejecución, como máximo 7
  (`DIAS_MAX_RECUPERAR`).
- **El día de hoy se vuelve a leer en cada pasada.** Los avisos ya publicados se recuerdan en
  `estado.json` y no se repiten.
- **Si una fuente falla** (caída, bloqueo), se reintenta en la siguiente pasada sin perder días.
- **El estado se guarda tras cada mensaje.** Si el proceso se corta, no repite lo ya publicado.
- **Ritmo de envío:** un mensaje cada ~3 s, por debajo del límite de Telegram. Si Telegram responde
  "demasiadas peticiones" (429), espera lo que indique y reintenta.

## Opciones (variables de entorno)

| Variable | Por defecto | Qué hace |
|---|---|---|
| `CATEGORIAS` | `bombero` | Añade `forestal`, `mandos`, `operador`, `otras` (separadas por comas) |
| `PROMOCION_INTERNA` | no | `1` para publicar también promoción interna / movilidad (marcadas 🔒) |
| `FUENTES` | todas | Limita a ciertas fuentes, p. ej. `BOE,CIDO` |
| `DIAS_MAX_RECUPERAR` | `7` | Días hacia atrás que recupera como máximo |
| `ESTADO_PATH` | `bot-bomberos/estado.json` | Dónde guarda lo publicado |

## Pendiente

- Lectores de las fuentes fáciles que aún no tienen (BOCM, BOJA, BOP Barcelona/Tarragona, DOG…):
  ver el orden de construcción en `FUENTES-ESPANA.md`.
- La misma convocatoria puede llegar por dos vías (bases en el BOP y extracto en el BOE). Ahora se
  publican las dos; se podrían agrupar por organismo y número de plazas.
