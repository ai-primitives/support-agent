import { Hono } from "hono"
import { handle } from "@hono/node-server"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { cors } from "hono/cors"

const app = new Hono()

app.use("*", logger())
app.use("*", prettyJSON())
app.use("*", cors())

app.get("/", (c) => c.json({ message: "Support Agent API" }))

export default app
