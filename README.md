# telegram-webhook-temp

A minimalist telegram bot server leveraging telegram webhooks.

- Node.js
- Telegram API + Webhooks
- Koa "minimalist" node.js framework
- Deploy on the internet using ngrok tunneling service
- Redis (optional)

# Running

Use `nvm use` to manage across nodejs versions (this app uses version `16.0.0` by default)

`yarn` - installs all packages

`yarn dev` - run dev server via `nodemon`

`yarn start` - run server

## Setup environment variables

`cp .env.example .env`
