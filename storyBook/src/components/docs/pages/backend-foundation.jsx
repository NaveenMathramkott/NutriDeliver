import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import { PropertyTable, Step, Steps } from "../primitives";

export function BackendSetup() {
  return (
    <>
      <p>
        Time to stop planning and start building. By the end of this chapter you
        will have a running Express server with structured logging, security
        headers, rate limiting, and a health endpoint you can hit with curl. The
        database comes next; the goal here is a process that boots cleanly and
        tells you when something breaks.
      </p>

      <h2>Initialise the project</h2>

      <p>
        We use native ES modules throughout, which means{" "}
        <InlineCodeish>type: &quot;module&quot;</InlineCodeish> in{" "}
        <InlineCodeish>package.json</InlineCodeish>. Node then treats every{" "}
        <InlineCodeish>.js</InlineCodeish> file as ESM, so imports read the same
        way as in the browser.
      </p>

      <Steps>
        <Step title="Create the backend folder">
          <CodeBlock
            code={`mkdir backend && cd backend
git init
npm init -y`}
          />
        </Step>

        <Step title="Set the module system and entry point">
          <CodeBlock
            language="json"
            title="package.json"
            code={`{
  "name": "nutrideliver-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}`}
          />
          <Callout variant="tip" title="Why ESM over CommonJS">
            <p>
              No <InlineCodeish>require</InlineCodeish> /
              <InlineCodeish>module.exports</InlineCodeish> pair, no
              <InlineCodeish>__dirname</InlineCodeish> polyfill, and the same
              <InlineCodeish>import</InlineCodeish> syntax you use everywhere
              else. Node 20 treats this as the default direction.
            </p>
          </Callout>
        </Step>

        <Step title="Install dependencies">
          <CodeBlock
            code={`# Core
npm i express mongoose cors helmet dotenv

# Auth & security
npm i bcryptjs jsonwebtoken express-rate-limit sanitize-html

# Validation & utilities
npm i joi slugify

# Payments, media, messaging
npm i stripe cloudinary multer firebase-admin nodemailer

# API documentation
npm i swagger-jsdoc swagger-ui-express

# Logging & dev
npm i winston
npm i -D nodemon`}
          />
          <p>
            We deliberately chose <InlineCodeish>joi</InlineCodeish> over{" "}
            <InlineCodeish>express-validator</InlineCodeish>. Joi schemas are
            reusable objects — the same schema validates a request and, in
            tests, asserts a fixture. More on this in{" "}
            <a href="/docs/backend/validation">Validation Layer</a>.
          </p>
        </Step>
      </Steps>

      <h2>Environment configuration</h2>

      <p>
        Never commit secrets. Load everything through{" "}
        <InlineCodeish>dotenv</InlineCodeish> and validate it at boot — a server
        that starts with a missing{" "}
        <InlineCodeish>STRIPE_SECRET_KEY</InlineCodeish> and fails at the first
        payment is far worse than one that refuses to start.
      </p>

      <CodeBlock
        title=".env"
        code={`NODE_ENV=development
PORT=5000

# Comma-separated allow-list for CORS
CLIENT_URL=http://localhost:8081,http://localhost:5173

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/nutrideliver

# Auth — generate real values: openssl rand -hex 64
JWT_ACCESS_SECRET=<64-byte hex string>
JWT_REFRESH_SECRET=<different 64-byte hex string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Firebase (service account JSON, base64-encoded for a single env var)
FIREBASE_SERVICE_ACCOUNT=<base64>

# Email (Gmail app password)
EMAIL_USER=...
EMAIL_PASS=...`}
      />

      <Callout variant="danger" title="Two secrets, never one">
        <p>
          Access and refresh tokens <strong>must</strong> be signed with
          different keys. If both share a key, a leaked refresh token can be
          replayed as an access token, and revocation stops meaning anything.
          Generate them separately.
        </p>
      </Callout>

      <h3>Fail fast on missing configuration</h3>

      <p>
        A small config module that throws on boot turns a confusing runtime
        failure into an obvious startup error.
      </p>

      <CodeBlock
        language="js"
        title="config/env.js"
        code={`import 'dotenv/config'

const required = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
]

const missing = required.filter((key) => !process.env[key])

if (missing.length > 0) {
  throw new Error(
    \`Missing required environment variables: \${missing.join(', ')}. \` +
      'Copy .env.example to .env and fill them in.',
  )
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  clientUrls: (process.env.CLIENT_URL ?? '').split(',').map((s) => s.trim()),
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
}`}
      />

      <h2>The server entry point</h2>

      <p>
        <InlineCodeish>server.js</InlineCodeish> wires everything together. The
        ordering of the middleware is the most important thing in this file, and
        it is easy to get subtly wrong — we cover the reasoning in{" "}
        <a href="/docs/backend/middleware">Middleware &amp; Security</a>.
      </p>

      <CodeBlock
        language="js"
        title="server.js"
        code={`import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import connectDB from './config/database.js'

import { generalLimiter, authLimiter } from './middleware/rateLimit.js'
import { requestLogger, errorLogger } from './middleware/logger.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { sanitizeBody, sanitizeQuery } from './middleware/sanitize.js'

import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
// …one import per route module

import { swaggerSpec, swaggerUi } from './config/swagger.js'

const app = express()
connectDB()

// Express hashes every JSON body into an ETag. When a client replays
// If-None-Match, the server replies 304 with an EMPTY body — which breaks
// clients that always parse JSON. Disable it for a predictable API.
app.set('etag', false)

app.use(helmet())

app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(','),
    credentials: true,
  }),
)

// Reject expensive requests before doing any parsing or work.
app.use(generalLimiter)
app.use('/api/auth', authLimiter)

app.use(requestLogger)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(sanitizeBody)
app.use(sanitizeQuery)

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec))

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 NutriDeliver Backend is running successfully!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

app.use(notFound)
app.use(errorLogger)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(\`🎯 Server running on port \${PORT}\`)
  console.log(\`🌐 Environment: \${process.env.NODE_ENV || 'development'}\`)
  console.log(\`📚 API docs: http://localhost:\${PORT}/api-docs\`)
})

export default app`}
      />

      <Callout variant="note" title="Why export the app?">
        <p>
          Exporting <InlineCodeish>app</InlineCodeish> separately from calling{" "}
          <InlineCodeish>listen()</InlineCodeish> lets your test suite import
          the Express app and drive it with Supertest without binding a port.
          That is the difference between a fast test suite and a slow, flaky one
          — see <a href="/docs/backend/testing">Testing the Backend</a>.
        </p>
      </Callout>

      <h2>Structured logging</h2>

      <p>
        <InlineCodeish>console.log</InlineCodeish> does not survive production.
        You need timestamps, levels, and a machine-readable format so errors can
        be searched and alerts can be raised. Winston gives you all three.
      </p>

      <CodeBlock
        language="js"
        title="utils/logger.js"
        code={`import winston from 'winston'

const { combine, timestamp, printf, colorize, errors } = winston.format

const isDev = process.env.NODE_ENV !== 'production'

// Add the stack trace to any error that passes through the logger.
errors({ stack: true })

const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
  return \`\${ts} [\${level}] \${stack ?? message}\${extras}\`
})

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(errors({ stack: true }), timestamp(), devFormat),
  transports: [new winston.transports.Console()],
  exitOnError: false,
})

// In production also ship newline-delimited JSON to disk, ready for shipping.
if (!isDev) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), winston.format.json()),
    }),
  )
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), winston.format.json()),
    }),
  )
}

export default logger`}
      />

      <CodeBlock
        language="js"
        title="middleware/logger.js"
        code={`import logger from '../utils/logger.js'

/**
 * Assigns each request an id and logs its outcome. The id is echoed back in
 * the response header so a user-reported error maps to exact log lines.
 */
export const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint()

  req.id = Math.random().toString(36).slice(2, 11)
  res.setHeader('X-Request-Id', req.id)

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6

    logger.info(\`\${req.method} \${req.originalUrl}\`, {
      requestId: req.id,
      status: res.statusCode,
      durationMs: Math.round(ms * 100) / 100,
      userId: req.user?.id,
    })
  })

  next()
}

export const errorLogger = (err, req, res, next) => {
  logger.error(err.message, {
    requestId: req.id,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  })
  next(err)
}`}
      />

      <Callout variant="tip" title="Log the request id, not just the message">
        <p>
          Without a correlation id, a user saying &ldquo;checkout failed at
          3pm&rdquo; gives you nothing to search on. Echoing{" "}
          <InlineCodeish>X-Request-Id</InlineCodeish> makes every request
          traceable from the user&rsquo;s screenshot to the log line that caused
          it.
        </p>
      </Callout>

      <h2>Verify it works</h2>

      <Steps>
        <Step title="Start with watch mode">
          <CodeBlock code={`npm run dev`} />
        </Step>

        <Step title="Hit the health endpoint">
          <CodeBlock code={`curl http://localhost:5000/api/health`} />
          <p>You should see:</p>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "message": "🚀 NutriDeliver Backend is running successfully!",
  "timestamp": "2026-01-14T09:12:33.481Z",
  "version": "1.0.0"
}`}
          />
        </Step>

        <Step title="Confirm headers are set">
          <CodeBlock code={`curl -I http://localhost:5000/api/health`} />
          <p>
            You should see the headers <InlineCodeish>helmet</InlineCodeish>{" "}
            adds: <InlineCodeish>x-content-type-options: nosniff</InlineCodeish>
            , <InlineCodeish>strict-transport-security</InlineCodeish>, and a
            restrictive <InlineCodeish>content-security-policy</InlineCodeish>.
          </p>
        </Step>
      </Steps>

      <h2>Folder structure</h2>

      <p>
        Create these directories now. Retrofitting structure after two hundred
        files is far more painful than making an empty folder today.
      </p>

      <CodeBlock
        language="text"
        code={`backend/
├── config/
│   ├── database.js         # Mongoose connection lifecycle
│   ├── env.js              # Validated configuration
│   └── swagger.js          # OpenAPI spec assembly
├── controllers/            # One file per domain — request in, response out
│   ├── authController.js
│   ├── restaurantController.js
│   └── orderController.js
├── middleware/
│   ├── auth.js             # requireAuth, requireRole
│   ├── errorHandler.js     # ApiError + central handler
│   ├── rateLimit.js
│   ├── sanitize.js
│   ├── upload.js           # Multer configuration
│   ├── validation.js       # Joi middleware
│   └── logger.js
├── models/                 # Mongoose schemas
├── routes/                 # URL definitions only, no logic
├── utils/                  # Tokens, email, push, background jobs, helpers
├── validations/            # Joi schemas, grouped by domain
├── logs/
├── .env
├── .env.example            # Committed, with placeholder values
└── server.js`}
      />

      <Callout variant="note" title="Keep routes thin">
        <p>
          A route file should read like a table of contents for an endpoint:
          which middleware guards it, which controller handles it. The moment
          business logic appears in a route file, it becomes impossible to test
          in isolation and awkward to reuse from a background job.
        </p>
      </Callout>

      <h2>What a route file looks like</h2>

      <CodeBlock
        language="js"
        title="routes/health.js"
        code={`import { Router } from 'express'
import { getHealth } from '../controllers/healthController.js'

const router = Router()

router.get('/', getHealth)

export default router`}
      />

      <h2>Before moving on</h2>

      <p>Check off each of these before continuing:</p>

      <PropertyTable
        headers={["Check", "How"]}
        rows={[
          [
            "Server boots without errors",
            "`npm run dev` prints the port banner.",
          ],
          [
            "Health endpoint responds",
            "`curl localhost:5000/api/health` returns JSON.",
          ],
          ["Security headers present", "`curl -I` shows helmet headers."],
          [
            "Logs written to file",
            "Check logs/combined.log for request lines.",
          ],
          [
            "Secrets are not committed",
            "`.env` is in .gitignore; `.env.example` is committed.",
          ],
          ["Restart is automatic", "Editing server.js restarts via nodemon."],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/database">Database Connection</a> — wiring
        up Mongoose so we have somewhere to actually store things.
      </p>
    </>
  );
}

export function BackendDatabaseConnection() {
  return (
    <>
      <p>
        The database connection is a handful of lines, but the decisions around
        it — when to connect, how to handle failure, what to do on shutdown —
        are what separate a service that survives a deploy from one that
        intermittently drops connections for an hour.
      </p>

      <h2>Connecting</h2>

      <CodeBlock
        language="js"
        title="config/database.js"
        code={`import mongoose from 'mongoose'

/**
 * Establish the MongoDB connection.
 *
 * Mongoose buffers commands while disconnected, so a brief blip does not
 * immediately fail requests — but it also means an unreachable database looks
 * like a slow app rather than an outage. That is why we fail loudly in
 * non-production and log every reconnection event.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Fail a query after 10s rather than hanging a request forever.
      serverSelectionTimeoutMS: 10000,

      // Use the driver's connection pool. Without these Node opens a new TCP
      // connection per query, which exhausts MongoDB's connection limit under
      // even modest load.
      maxPoolSize: 20,
      minPoolSize: 5,

      // Retry the initial connection a few times — during a cold start the
      // database container is often still booting.
      retryAttempts: 5,
      retryDelay: 1000,
    })

    console.log(\`✅ MongoDB connected: \${conn.connection.host}/\${conn.connection.name}\`)

    return conn
  } catch (error) {
    console.error(\`❌ MongoDB connection error: \${error.message}\`)

    if (process.env.NODE_ENV === 'production') {
      // In production, exiting lets the orchestrator restart us with a fresh
      // attempt rather than serving requests against a dead database.
      process.exit(1)
    }

    throw error
  }
}

export default connectDB`}
      />

      <Callout variant="warning" title="Why the pool settings matter">
        <p>
          MongoDB caps concurrent connections per instance. Mongoose opens one
          connection per query by default, so fifty simultaneous requests will
          try to open fifty sockets and start timing out. Setting{" "}
          <InlineCodeish>maxPoolSize</InlineCodeish> to something like 20 queues
          the excess instead, and keeps your connection count predictable.
        </p>
      </Callout>

      <h2>Connection lifecycle events</h2>

      <p>
        Register event handlers once, at import time. These fire on conditions
        you cannot reproduce on demand in development, so having them logged is
        the difference between diagnosing an incident and guessing at it.
      </p>

      <CodeBlock
        language="js"
        title="config/database.js (continued)"
        code={`mongoose.connection.on('connected', () => {
  console.log('📦 Mongoose connected to MongoDB')
})

// Emitted when an established connection drops. Should be rare — if you see
// these frequently, your primary is stepping down or the network is unstable.
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected')
})

// Emitted after the driver exhausts its reconnect attempts.
mongoose.connection.on('error', (err) => {
  console.error(\`❌ Mongoose connection error: \${err.message}\`)
})

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected')
})`}
      />

      <h2>Graceful shutdown</h2>

      <p>
        A container that is killed mid-request loses work in flight and leaves
        connections dangling. A few lines of signal handling prevent both.
      </p>

      <CodeBlock
        language="js"
        title="server.js (shutdown handling)"
        code={`import mongoose from 'mongoose'

let server

// …after app.listen()

// Stop accepting new connections, finish in-flight requests, then close the
// database. SIGTERM is what Docker, Kubernetes, and most PaaS providers send.
const gracefulShutdown = async (signal) => {
  console.log(\`\n\${signal} received — shutting down gracefully\`)

  try {
    server.close(async () => {
      await mongoose.connection.close()
      console.log('✅ Connections closed. Exiting.')
      process.exit(0)
    })

    // If something refuses to finish within 10s, exit anyway.
    setTimeout(() => {
      console.error('⚠️  Forcing shutdown after timeout')
      process.exit(1)
    }, 10000).unref()
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Unhandled rejections are bugs. Log them loudly instead of dying silently.
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
  logger.error('Unhandled promise rejection', { reason })
})`}
      />

      <Callout variant="tip" title="Use a real replica set">
        <p>
          A standalone MongoDB has no high availability: if it goes down, it
          stays down. Atlas gives you a three-node replica set by default, and
          locally you can run one in Docker with a single command. Even for
          development, testing against a topology that resembles production
          surfaces problems early.
        </p>
      </Callout>

      <h2>Verifying the connection</h2>

      <Steps>
        <Step title="Start a local MongoDB">
          <CodeBlock
            code={`# Docker
docker run -d --name nutrideliver-mongo \\
  -p 27017:27017 \\
  mongo:7

# macOS (install with: brew install mongodb-community)
mongod --dbpath /usr/local/var/mongodb`}
          />
        </Step>

        <Step title="Point .env at it">
          <CodeBlock
            code={`MONGODB_URI=mongodb://127.0.0.1:27017/nutrideliver`}
          />
        </Step>

        <Step title="Boot the server and watch for the connection log">
          <CodeBlock code={`npm run dev`} />
          <p>
            You should see <InlineCodeish>✅ MongoDB connected</InlineCodeish>{" "}
            alongside the port banner.
          </p>
        </Step>
      </Steps>

      <h2>Design decisions to lock in now</h2>

      <PropertyTable
        headers={["Decision", "Choice", "Reasoning"]}
        rows={[
          [
            "Strict mode",
            "Enabled",
            "Mongoose throws on data that does not match the schema rather than silently dropping it.",
          ],
          [
            "Auto timestamps",
            "createdAt + updatedAt",
            "Free audit trail on every document; cheap and universally useful.",
          ],
          [
            "Connection pool",
            "max 20, min 5",
            "Predictable connection count; absorbs traffic bursts without thrashing.",
          ],
          [
            "Retry policy",
            "5 attempts, 1s delay",
            "Survives a database container that is still booting.",
          ],
          [
            "Shutdown",
            "Graceful, 10s cap",
            "No dropped requests on deploy; no hanging connections.",
          ],
        ]}
      />

      <h3>Enabling strict mode and timestamps globally</h3>

      <CodeBlock
        language="js"
        title="config/database.js"
        code={`import mongoose from 'mongoose'

// Throw instead of silently discarding unknown fields, so a typo in a
// controller surfaces immediately rather than becoming a missing column.
mongoose.set('strictQuery', true)

// Strip undefined props on save so $set never writes nulls over real values.
mongoose.set('strict', true, false)

export default connectDB`}
      />

      <Callout variant="note" title="Where connection code belongs">
        <p>
          Call <InlineCodeish>connectDB()</InlineCodeish> in{" "}
          <InlineCodeish>server.js</InlineCodeish>, not in a module that gets
          imported by your controllers. Importing a model should never have the
          side effect of opening a network connection — that makes tests and
          scripts unpredictable.
        </p>
      </Callout>

      <h2>Common problems</h2>

      <PropertyTable
        headers={["Symptom", "Likely cause", "Fix"]}
        rows={[
          [
            "`Server selection timed out`",
            "MongoDB is not running or the URI is wrong",
            "Check the port, then `mongosh` to confirm.",
          ],
          [
            "`E11000 duplicate key error`",
            "Unique index violated",
            "Usually an email or slug collision — handle it as a 409.",
          ],
          [
            "Connection drops under load",
            "Pool exhausted",
            "Raise maxPoolSize, or find an N+1 hammering the database.",
          ],
          [
            "Reads return stale data",
            "Reading from a secondary",
            "Ensure readPreference is primary for anything that must be fresh.",
          ],
          [
            "MongooseError: Operation timed out",
            "Slow or missing index",
            "Add the compound index your query sorts and filters on.",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/models">Data Models</a> — defining the ten
        collections that hold the entire domain.
      </p>
    </>
  );
}

function InlineCodeish({ children }) {
  return (
    <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  );
}
