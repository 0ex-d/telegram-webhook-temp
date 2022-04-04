require("dotenv").config();
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const Router = require("koa-router");
const cors = require("@koa/cors");
const axios = require("axios");
const { createClient } = require("redis");

const app = new Koa();
const router = new Router();
app.use(cors({ origin: "*" }));
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const {
  BOT_TOKEN,
  API_URL,
  PORT,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  USE_CACHE,
} = process.env;

const CONFIG = {
  TELEGRAM_API: `https://api.telegram.org/bot${BOT_TOKEN}`,
  WHOOK_ENDPOINT: `/webhook/${BOT_TOKEN}`,
  WEBHOOK_URL: `${API_URL}/webhook/${BOT_TOKEN}`,
  REDIS_HOST: REDIS_HOST || "localhost",
  REDIS_PORT: REDIS_PORT || 6379,
  REDIS_PASSWORD: REDIS_PASSWORD || "",
  RQUEST_KEY_PREFIX: "NGROK:URL:",
  USE_CACHE: USE_CACHE === "true" ? 1 : 0,
};

if (!BOT_TOKEN || !API_URL) {
  console.error(
    "You need to set BOT_TOKEN and API_URL variables in ENV to get started"
  );
  process.exit(1);
}

const port = parseInt(PORT || 5700);

// redis client
let RedisClient;

(async () => {
  try {
    RedisClient = createClient({
      host: CONFIG.REDIS_HOST,
      port: CONFIG.REDIS_PORT,
      password: CONFIG.REDIS_PASSWORD,
    });

    if (CONFIG.USE_CACHE) {
      await RedisClient.connect();
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
})();

RedisClient.on("error", err => {
  console.error(err.toString());
  process.exit(1);
});

const boot = async () => {
  try {
    const res = await axios.get(
      `${CONFIG.TELEGRAM_API}/setWebhook?url=${CONFIG.WEBHOOK_URL}`
    );
    console.log(res.data);
    const { ok, result } = res?.data;
    if (CONFIG.USE_CACHE) {
      if (ok && result) {
        await RedisClient.setEx(
          `${RQUEST_KEY_PREFIX + port}`,
          3600,
          CONFIG.WEBHOOK_URL
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const reply = async params => {
  router.post(CONFIG.WHOOK_ENDPOINT, async (ctx, next) => {
    try {
      const { request, response } = ctx;
      const { message } = request.body;
      const id = message.chat.id;

      await axios.post(`${CONFIG.TELEGRAM_API}/sendMessage`, {
        chat_id: id,
        ...params,
      });

      response.status = 200;

      return await next();
    } catch (err) {
      console.error(err);
      throw err;
    }
  });
};

app.listen(port, async () => {
  console.log("🤖 bot running on port: ", port);
  reply({
    text: "text",
  });
  if (CONFIG.USE_CACHE) {
    if (!(await RedisClient.get(`${RQUEST_KEY_PREFIX + port}`))) {
      await boot();
    }
  } else {
    await boot();
  }
});
