import { REPO } from "../../../lib/repo";
import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import {
  Card,
  CardGrid,
  Diagram,
  PropertyTable,
  Split,
  Step,
  Steps,
} from "../primitives";

// chapter components, kept out of navigation.js so nav stays pure data.

export function Overview() {
  return (
    <>
      <p>
        Building a food delivery platform is one of those projects that looks
        simple on a whiteboard and becomes a distributed systems problem the
        moment a real user places a real order. This guide walks the entire
        journey — from an empty folder to a deployed, production-grade platform
        serving customers, restaurants, riders, and administrators.
      </p>

      <p>
        Everything here is written against{" "}
        <a href={REPO.url} target="_blank" rel="noreferrer">
          NutriDeliver
        </a>
        , a complete reference implementation. The code snippets are the real
        code from that repository — not pseudocode — so you can follow along,
        diverge, and still end up with something that works.
      </p>

      <Callout variant="tip" title="Who this is for">
        <p>
          You are comfortable with JavaScript basics and have seen a REST API
          before. You do not need prior React Native, MongoDB, or payments
          experience. We explain the reasoning behind each decision rather than
          just handing you the answer.
        </p>
      </Callout>

      <h2>What you are building</h2>

      <p>
        NutriDeliver is a healthy-food delivery marketplace. That framing
        matters: it is not a single app but a marketplace with four distinct
        user populations, each needing their own interface, permissions, and
        workflow.
      </p>

      <Diagram caption="The four surfaces of NutriDeliver, and how they connect">
        {`
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Customer App   │   │ Restaurant App   │   │    Rider App     │
│   (Expo / RN)    │   │   (Expo / RN)    │   │   (Expo / RN)    │
│                  │   │                  │   │                  │
│ Browse & order   │   │ Accept & prepare │   │ Accept & deliver │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │  HTTPS / JSON  +  WebSocket
                                ▼
                    ┌───────────────────────────┐
                    │   Express REST API        │
                    │   Node.js · MongoDB       │
                    │   (single deployable API) │
                    └───────────┬───────────────┘
                                │
                    ┌───────────▼───────────────┐
                    │   Admin Panel (React)     │
                    │   Vite · Redux · Tailwind │
                    └───────────────────────────┘
`}
      </Diagram>

      <p>
        The four apps share one backend. This is the single most important
        architectural decision in the project: one API, one database, one set of
        business rules. The alternative — a separate API per app — multiplies
        the surface area for bugs and makes cross-cutting concerns like order
        notifications enormously harder.
      </p>

      <h3>The four roles</h3>

      <PropertyTable
        headers={["Role", "Surface", "What they do"]}
        rows={[
          [
            "Customer",
            "Mobile app",
            "Browse healthy menus, build a cart, pay, track a live delivery, rate the order.",
          ],
          [
            "Restaurant",
            "Mobile app",
            "Accept or reject incoming orders, manage a menu, toggle availability, view earnings and analytics.",
          ],
          [
            "Rider",
            "Mobile app",
            "Go online, accept nearby deliveries, navigate, confirm pickup and drop-off, track payouts.",
          ],
          [
            "Admin",
            "Web panel",
            "Approve restaurants and riders, monitor orders, intervene in disputes, manage platform settings and offers.",
          ],
        ]}
      />

      <h2>How to read this guide</h2>

      <p>
        The guide follows the order in which you would actually build the thing.
        Each section depends only on what came before it.
      </p>

      <Steps>
        <Step title="Introduction">
          <p>
            Architecture, stack choices, and the domain model. Read this even if
            you skip the rest — the decisions here constrain everything that
            follows.
          </p>
        </Step>

        <Step title="Backend">
          <p>
            Twenty chapters covering setup, data modelling, auth, every API
            group, payments, realtime, background jobs, and testing. This is the
            largest section because the backend is where the real complexity
            lives.
          </p>
        </Step>

        <Step title="Mobile apps">
          <p>
            Three Expo apps built on a shared foundation: routing, an API client
            that handles token refresh, and Redux state. Build the customer app
            first; the other two are largely variations on it.
          </p>
        </Step>

        <Step title="Admin panel">
          <p>
            A desktop web dashboard for operators. Faster to build than the
            mobile apps because it reuses familiar React patterns and has
            shadcn/ui doing the visual heavy lifting.
          </p>
        </Step>

        <Step title="AI integration">
          <p>
            Five chapters on adding AI where it genuinely helps: nutrition-aware
            recommendations, menu enrichment, ETA and demand forecasting, and a
            grounded support agent. Each one states the case against using a
            model, ships with a deterministic fallback, and has to beat a
            measured baseline before it replaces one. Read{" "}
            <a href="/docs/ai/integration">Where AI Belongs</a> before any of
            them.
          </p>
        </Step>

        <Step title="Production">
          <p>
            Deployment, scaling, monitoring, and a launch checklist. Skip this
            on your first pass, but do not skip it before taking real money.
          </p>
        </Step>
      </Steps>

      <h2>The shape of the data</h2>

      <p>
        Before writing a line of code, it helps to see how the core entities
        relate. Nearly every feature in this platform is a consequence of this
        shape.
      </p>

      <Diagram caption="Core entity relationships">
        {`
   User ──1:1──► Restaurant     (a user who owns a restaurant)
     │
     ├─1:1──► Rider            (a user who is a delivery rider)
     │
     ├─1:1──► Cart ──1:N──► CartItems ──N:1──► FoodItem
     │
     └─1:N──► Order ──1:N──► OrderItems ──N:1──► FoodItem
                 │
                 ├──N:1──► Restaurant      (who is preparing it)
                 ├──N:1──► Rider           (who delivers it, once assigned)
                 └──1:1──► Payment         (Stripe PaymentIntent reference)

   Category ──1:N──► FoodItem
   Offer    ──(applied to cart or order)
   Notification ──N:1──► User
`}
      </Diagram>

      <Callout variant="note" title="One user, many roles — but modelled once">
        <p>
          A single <code>User</code> collection holds every role, discriminated
          by a <code>role</code> field. Rather than four separate collections,
          this means one auth flow, one session model, and one place to enforce
          permissions. We explore the tradeoffs in{" "}
          <a href="/docs/planning">Requirements &amp; Domain Modelling</a>.
        </p>
      </Callout>

      <h2>Prerequisites</h2>

      <PropertyTable
        headers={["Tool", "Version", "Why"]}
        rows={[
          [
            "Node.js",
            "20 LTS or newer",
            "Native ESM, stable fetch, modern V8.",
          ],
          [
            "MongoDB",
            "7.x / Atlas",
            "The document model maps directly onto menu items and order snapshots.",
          ],
          [
            "Expo Go / dev client",
            "Latest SDK",
            "Lets you run the mobile apps on a physical device without app-store friction.",
          ],
          ["A code editor", "Anything", "With an integrated terminal."],
        ]}
      />

      <h2>Free-tier services</h2>

      <p>
        Every third-party service below has a free tier, so you can build the
        entire platform without spending money:
      </p>

      <PropertyTable
        headers={["Service", "Used for", "Free tier"]}
        rows={[
          [
            "MongoDB Atlas",
            "Database hosting",
            "512 MB shared cluster, always free.",
          ],
          [
            "Cloudinary",
            "Image and document storage",
            "25 GB of managed assets.",
          ],
          [
            "Firebase Cloud Messaging",
            "Push notifications",
            "Unlimited, free forever.",
          ],
          [
            "Stripe",
            "Payments",
            "Test mode with no account required to develop against.",
          ],
          [
            "Nodemailer + Gmail",
            "Transactional email",
            "500 messages a day on a free account.",
          ],
          [
            "Expo",
            "Mobile build and distribution",
            "Free for development; pay only when publishing.",
          ],
        ]}
      />

      <h2>Where to start</h2>

      <p>
        If you want to see the whole system before you build any of it, read{" "}
        <a href="/docs/architecture">System Architecture</a> and{" "}
        <a href="/docs/tech-stack">Choosing the Tech Stack</a> next. Then jump
        into <a href="/docs/backend/setup">Project Setup</a> and start typing.
      </p>

      <CardGrid>
        <Card
          href="/docs/architecture"
          title="System Architecture"
          description="Monorepo layout, request flow, and why there is one backend."
        />
        <Card
          href="/docs/planning"
          title="Domain Modelling"
          description="Roles, order states, and the entities that hold it together."
        />
        <Card
          href="/docs/backend/setup"
          title="Start building"
          description="Boot the API in about ten minutes."
        />
      </CardGrid>
    </>
  );
}

export function Architecture() {
  return (
    <>
      <p>
        This chapter lays out how the four applications fit together, how a
        request travels through the system, and where the boundaries between
        components are drawn. Read it before you write code — the decisions here
        are the ones that are expensive to change later.
      </p>

      <h2>Monorepo layout</h2>

      <p>
        NutriDeliver keeps the backend and all four frontends in a single
        repository. This is not a monorepo tool with workspaces and shared build
        pipelines; it is a plain folder of independent apps that happen to share
        a git history.
      </p>

      <CodeBlock
        language="text"
        title="Repository structure"
        code={`NutriDeliver/
├── backend/          # Express API — the single source of business truth
│   ├── config/       # Database connection, Swagger spec
│   ├── controllers/  # Request handling, one per domain
│   ├── middleware/   # Auth, validation, upload, rate limits, errors
│   ├── models/       # Mongoose schemas
│   ├── routes/       # URL definitions, mounted in server.js
│   ├── utils/        # Tokens, email, push, background jobs, helpers
│   └── server.js     # Entry point
│
├── frontend/
│   ├── customer/     # Expo app — React Native, expo-router
│   ├── restaurant/   # Expo app — same shape as customer
│   ├── rider/        # Expo app — same shape as customer
│   └── adminPanel/   # React web dashboard — Vite, Redux Toolkit, Tailwind
│
└── storyBook/        # This documentation site`}
      />

      <Callout variant="tip" title="Why not a monorepo tool">
        <p>
          Yarn or pnpm workspaces would give you shared dependency hoisting and
          coordinated versioning, which you will want eventually. They also add
          a build layer you have to learn. Keeping each app independently
          installable means you can hand the <code>restaurant/</code> folder to
          a contractor and they can run it without understanding the backend.
        </p>
      </Callout>

      <h2>One backend, four clients</h2>

      <p>
        The single most consequential decision in this project is that there is
        one API for all four apps. Let us be explicit about what that buys and
        what it costs.
      </p>

      <Split
        left={{
          title: "One backend gives you",
          children: (
            <ul>
              <li>
                One implementation of the order state machine, so status cannot
                diverge between clients.
              </li>
              <li>
                One place to enforce authorisation, regardless of which client
                called.
              </li>
              <li>A single broadcast point for realtime events.</li>
              <li>One deploy to fix a bug, rather than four.</li>
            </ul>
          ),
        }}
        right={{
          title: "One backend costs you",
          children: (
            <ul>
              <li>
                The API is a shared dependency — an outage affects every client
                at once.
              </li>
              <li>
                Role-specific endpoints grow crowded and need careful
                organisation.
              </li>
              <li>
                You must scale it for peak load across all four surfaces
                simultaneously.
              </li>
            </ul>
          ),
        }}
      />

      <p>
        For a marketplace at the scale of NutriDeliver, the trade is clearly
        worth it. The endpoint organisation problem is solved with route
        namespaces and role guards, which we cover in{" "}
        <a href="/docs/backend/api-design">API Design &amp; Routing</a>.
      </p>

      <h2>Anatomy of a request</h2>

      <p>
        Every request follows the same path through the Express stack. The order
        of middleware is not incidental — several of these steps depend on
        earlier ones having run first.
      </p>

      <Diagram caption="Middleware order in server.js, and why it matters">
        {`
  Request
     │
     ▼
  ┌─────────────────────────────────────────┐
  │ helmet()            security headers     │  1. Always first.
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ cors()               origin allow-list   │  2. Before anything reads a body.
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ generalLimiter      100 req / 15 min     │  3. Reject cheap, before work.
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ requestLogger      Winston structured    │
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ express.json()     body parser           │  4. Must precede sanitization.
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ sanitizeBody/query XSS scrub             │  5. Needs a parsed body.
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ Router             /api/orders, …        │  6. Per-route: auth → RBAC → Joi.
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ Controller         business logic         │
  └─────────────────────────────────────────┘
     ▼
  ┌─────────────────────────────────────────┐
  │ Mongoose           persistence            │
  └─────────────────────────────────────────┘
     ▼
  Response ──► errorHandler on any throw
`}
      </Diagram>

      <Callout variant="warning" title="Order is not cosmetic">
        <p>
          Rate limiting sits before body parsing deliberately: rejecting a
          request should cost as close to nothing as possible. Sanitization sits
          after body parsing because it has nothing to inspect until the body
          exists. Getting these backwards is a common and subtle source of both
          security holes and performance problems.
        </p>
      </Callout>

      <h2>How the four apps talk to the backend</h2>

      <p>
        Three of the four clients are React Native apps built with Expo, and all
        three share the same networking layer: a thin fetch wrapper that
        attaches the access token, transparently refreshes it when it expires,
        and unwraps the standard response envelope.
      </p>

      <Diagram caption="Communication patterns across the platform">
        {`
  ┌────────────┐                          ┌─────────────┐
  │  Customer  │─── HTTPS/JSON ───────────▶│             │
  ├────────────┤                          │             │  REST covers
  │ Restaurant │─── HTTPS/JSON ───────────▶│   Express   │  everything
  ├────────────┤                          │   API       │  request/response.
  │   Rider    │─── HTTPS/JSON ───────────▶│             │
  ├────────────┤                          │             │
  │   Admin    │─── HTTPS/JSON ───────────▶│             │
  └────────────┘                          └──────┬──────┘
                                                  │
      ┌───────────────────────────────────────────┼──────────────┐
      │                                           │              │
      ▼                                           ▼              ▼
┌───────────┐                            ┌─────────────┐   ┌──────────┐
│ WebSocket │  order status, new orders, │   MongoDB   │   │  Stripe  │
│ (Socket.IO)│  rider location pings     │             │   │  webhooks│
└───────────┘                            └─────────────┘   └──────────┘

  Two channels only: HTTPS for commands, WebSocket for events.
`}
      </Diagram>

      <p>
        That split is deliberate and it is worth being strict about it. Polling
        a list every few seconds to simulate realtime is a common shortcut; it
        multiplies database load by the number of active clients and still lags.
        We implement proper WebSocket rooms in{" "}
        <a href="/docs/backend/realtime">Real-Time &amp; WebSockets</a>.
      </p>

      <h2>Authentication strategy</h2>

      <p>
        All four clients authenticate against the same endpoints and receive the
        same token pair. A short-lived access token is held in memory and sent
        as a bearer token; a long-lived refresh token is stored in secure
        storage. The mobile apps use Expo SecureStore, and the admin panel uses
        an httpOnly cookie — the difference is covered in{" "}
        <a href="/docs/mobile/api-client">API Client &amp; State</a>.
      </p>

      <Callout
        variant="note"
        title="Role comes from the token, not the request"
      >
        <p>
          The <code>role</code> claim is embedded in the JWT at login and
          verified server-side on every guarded request. The client never gets
          to choose its own role, and the server never trusts a role supplied in
          a header or body. This is covered in depth in{" "}
          <a href="/docs/backend/auth">Authentication &amp; RBAC</a>.
        </p>
      </Callout>

      <h2>Layer by layer</h2>

      <p>
        The rest of this guide works through the stack in dependency order. Here
        is the map.
      </p>

      <PropertyTable
        headers={["Layer", "Technology", "Responsibility"]}
        rows={[
          [
            "Client — mobile",
            "React Native + Expo Router",
            "Three role-specific apps with shared navigation and networking conventions.",
          ],
          [
            "Client — admin",
            "React + Vite + Redux Toolkit",
            "Operator dashboard with dense tables, filters, and charts.",
          ],
          [
            "API",
            "Node.js + Express 5",
            "All business rules, authorisation, and workflow state transitions.",
          ],
          [
            "Data",
            "MongoDB + Mongoose",
            "Document persistence, aggregation pipelines for analytics.",
          ],
          [
            "Realtime",
            "Socket.IO",
            "Rooms per role and entity; order and location events.",
          ],
          [
            "Payments",
            "Stripe PaymentIntents",
            "Authorisation, capture, refunds, webhook reconciliation.",
          ],
          [
            "Media",
            "Cloudinary",
            "Restaurant and food imagery, rider documents, delivery proof.",
          ],
          [
            "Messaging",
            "FCM + Nodemailer",
            "Push to devices, email to inboxes.",
          ],
        ]}
      />

      <h2>Deciding what lives where</h2>

      <p>
        When you add a feature, the question is always the same: does this need
        to be true regardless of which client asked? If yes, it belongs in the
        backend.
      </p>

      <Split
        left={{
          title: "Server responsibilities",
          children: (
            <ul>
              <li>Whether an order can legally move to its next state.</li>
              <li>
                What a discount is actually worth, and whether it applies.
              </li>
              <li>Whether a rider is close enough to accept a delivery.</li>
              <li>Whether money has actually been charged.</li>
            </ul>
          ),
        }}
        right={{
          title: "Client responsibilities",
          children: (
            <ul>
              <li>Rendering, navigation, and local UI state.</li>
              <li>
                Form validation for fast feedback — never as the only check.
              </li>
              <li>Caching read-only data for offline and instant paints.</li>
              <li>Presenting data, including calculating what to display.</li>
            </ul>
          ),
        }}
      />

      <h2>What comes next</h2>

      <p>
        With the architecture settled,{" "}
        <a href="/docs/tech-stack">Choosing the Tech Stack</a> justifies each
        dependency and points out where a different choice would have been
        reasonable. After that, <a href="/docs/planning">Domain Modelling</a>{" "}
        turns these diagrams into concrete Mongoose schemas.
      </p>
    </>
  );
}

export function TechStack() {
  return (
    <>
      <p>
        Every choice here has defensible alternatives. This chapter explains
        what we picked, why, and when you should choose differently — because
        the best stack is the one whose tradeoffs you understand, not the one
        that is currently fashionable.
      </p>

      <h2>The full stack at a glance</h2>

      <PropertyTable
        headers={["Layer", "Choice", "Alternatives considered"]}
        rows={[
          [
            "Runtime",
            "Node.js 20+",
            "Deno, Bun — both viable, smaller ecosystem for this stack.",
          ],
          [
            "API framework",
            "Express 5",
            "Fastify (faster), NestJS (more structure, more ceremony).",
          ],
          [
            "Database",
            "MongoDB + Mongoose",
            "PostgreSQL + Prisma — better for relational reporting, heavier setup.",
          ],
          [
            "Auth",
            "JWT (access + refresh)",
            "Session cookies — simpler to revoke, harder to use from mobile.",
          ],
          [
            "Mobile",
            "React Native + Expo",
            "Native Swift/Kotlin — better platform integration, two codebases.",
          ],
          [
            "Admin UI",
            "React + Vite",
            "Next.js — better if you need SSR or SEO, unnecessary for an internal tool.",
          ],
          [
            "Styling",
            "Tailwind CSS v4",
            "CSS Modules, styled-components — more decision-making at author time.",
          ],
          [
            "Components",
            "shadcn/ui",
            "MUI, Mantine — full libraries, but you inherit their opinions.",
          ],
          [
            "State",
            "Redux Toolkit",
            "Zustand, TanStack Query — less boilerplate, less ecosystem for complex flows.",
          ],
          [
            "Realtime",
            "Socket.IO",
            "Native WebSocket, Supabase Realtime — more control, more work.",
          ],
          [
            "Payments",
            "Stripe",
            "Razorpay, PayPal — choose based on the countries you operate in.",
          ],
          [
            "Images",
            "Cloudinary",
            "S3 + sharp — cheaper at scale, more code to maintain.",
          ],
          [
            "Validation",
            "Joi",
            "Zod, express-validator — Zod infers types, Joi is declarative and mature.",
          ],
        ]}
      />

      <h2>Node.js and Express</h2>

      <p>
        Node is a natural fit because the entire stack — including the three
        mobile apps — is JavaScript. One language means one set of tooling, one
        mental model, and no context-switching between the client and the
        server. For a team of one or two, that is a decisive productivity gain.
      </p>

      <p>
        Express 5 brings proper async error propagation: a rejected promise from
        an async handler now reaches your error middleware without the
        <InlineCodeish>(async, next) =&gt; …</InlineCodeish> wrapper that
        Express 4 required. That single feature removes a whole category of bug,
        which is why the codebase is cleaner than most Express 4 projects.
      </p>

      <Callout variant="note" title="What Express does not give you">
        <p>
          Routing, body parsing, and little else. No ORM, no validation, no
          auth, no structure. Everything in the backend section of this guide is
          something you build on top of Express by hand. That is the trade — and
          it is why the next thirteen chapters exist.
        </p>
      </Callout>

      <h2>MongoDB over a relational database</h2>

      <p>
        This is the most debatable choice in the stack, so it deserves an honest
        answer rather than a hand-wave.
      </p>

      <Split
        left={{
          title: "Where MongoDB fits well",
          children: (
            <ul>
              <li>
                <strong>Menu items are documents.</strong> A food item carries
                nutrition, ingredients, dietary tags, and prep times — a
                variable, nested shape that would need a join table in SQL.
              </li>
              <li>
                <strong>Order items are snapshots.</strong> A purchased item
                embeds the name and price <em>at purchase time</em>, so a later
                menu edit never rewrites history. Embedding is native here.
              </li>
              <li>
                <strong>Geographic queries.</strong> The 2dsphere index makes
                &ldquo;restaurants within 5 km&rdquo; a single indexed lookup.
              </li>
              <li>
                <strong>Schema flexibility.</strong> Rider documents, restaurant
                settings, and offers all evolve without migrations.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Where it will hurt",
          children: (
            <ul>
              <li>
                <strong>Money and orders want transactions.</strong> MongoDB has
                them, but they are easy to misuse and less pleasant than SQL.
              </li>
              <li>
                <strong>Reporting needs aggregation pipelines.</strong> They are
                powerful and unfamiliar, and harder to debug than a{" "}
                <InlineCodeish>GROUP BY</InlineCodeish>.
              </li>
              <li>
                <strong>Cross-document joins are application-side.</strong> Fine
                at our scale, a liability far larger.
              </li>
            </ul>
          ),
        }}
      />

      <p>
        <strong>Our judgement:</strong> the entity shapes genuinely favour
        documents, the reporting load is bounded and well understood, and Atlas
        removes the operational burden entirely. Choose PostgreSQL if your team
        is already strong in SQL or if you expect deep relational reporting — it
        is not a wrong answer, only a different set of tradeoffs.
      </p>

      <Callout variant="tip" title="Using Mongoose or not?">
        <p>
          Mongoose gives you schemas, validation, middleware hooks, and
          population — at the cost of some runtime overhead and a leaky
          abstraction. The official driver alone is faster and more transparent.
          NutriDeliver uses Mongoose because the schema-level guarantees are
          worth more than the raw throughput for this kind of application, and
          because <InlineCodeish>populate()</InlineCodeish> saves a great deal
          of repetitive aggregation code.
        </p>
      </Callout>

      <h2>React Native with Expo</h2>

      <p>
        Three apps written in JavaScript instead of three codebases is a large
        win. Expo removes the native build step entirely during development:{" "}
        <InlineCodeish>npx expo start</InlineCodeish> gives you a running app
        with live reload on a physical phone, without Xcode or Android Studio.
      </p>

      <p>
        <strong>Expo Router</strong> gives us file-based routing with nested
        layouts, typed routes, and deep linking handled for free — the same
        model Next.js popularised on the web, applied to native navigation.
      </p>

      <Callout variant="warning" title="The React Native trade-off">
        <p>
          You give up some native control. Anything requiring a custom native
          module demands a development build and, eventually, an Expo prebuild.
          For a food delivery app — maps, camera, push, secure storage — the
          entire feature set is covered by maintained Expo packages, so we stay
          well inside the comfortable zone.
        </p>
      </Callout>

      <h2>React and Vite for the admin panel</h2>

      <p>
        The admin panel is an internal tool used by a handful of operators on a
        desktop browser. It needs dense tables, forms, and charts — and none of
        the concerns that would justify a framework like Next.js. Vite gives
        sub-second dev-server startup, and shadcn/ui gives a complete,
        well-designed component layer that we own rather than rent.
      </p>

      <p>
        shadcn/ui is worth a note: instead of installing a component library, it
        copies the component source into your repo. You can read it, change it,
        and delete what you do not use. See{" "}
        <a href="/docs/admin/setup">Admin Panel Setup</a>.
      </p>

      <h2>Tailwind and the token system</h2>

      <p>
        Tailwind is used consistently across this documentation site, the admin
        panel, and would be equally at home in the mobile apps. Its central idea
        — a constrained vocabulary of utilities rather than arbitrary CSS — is
        what makes a design system enforceable.
      </p>

      <p>
        Colour is defined once as CSS custom properties on a semantic scale, and
        components reference the semantic layer rather than raw values. Dark
        mode then becomes a single class toggle on the root element rather than
        a theme system you maintain yourself.
      </p>

      <CodeBlock
        language="css"
        title="Semantic tokens — one source of truth for colour"
        code={`:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --brand:      oklch(0.5119 0.1395 14.5);   /* #A73D4D */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --brand:      oklch(0.6119 0.1465 14.5);   /* lightened for contrast */
}

/* Components reference the semantic name, never the raw value.
   Switching .dark on <html> re-themes the entire application. */`}
      />

      <h2>State management</h2>

      <p>
        Redux Toolkit in the admin panel and each mobile app, chosen for the
        same reasons: predictable updates from a single store, excellent
        DevTools, and — most importantly — slices that remove the older Redux
        boilerplate, so the ceremony argument mostly no longer applies.
      </p>

      <p>
        Server state and client state are kept deliberately separate. Redux
        holds what the user has done; the API holds what the world looks like.
        Mixing the two is how caches drift out of sync with the database.
      </p>

      <h2>Testing and tooling</h2>

      <PropertyTable
        headers={["Purpose", "Tool", "Notes"]}
        rows={[
          [
            "API integration tests",
            "Supertest + mongodb-memory-server",
            "Real Express app against a real in-memory MongoDB.",
          ],
          [
            "Unit tests",
            "Vitest",
            "For pure functions: pricing, discounts, distance.",
          ],
          [
            "Validation",
            "Joi",
            "Schemas are the contract; reuse them in tests.",
          ],
          [
            "API documentation",
            "Swagger UI + swagger-jsdoc",
            "Generated from JSDoc, served at /api-docs.",
          ],
          ["Logging", "Winston", "Structured JSON to files and stdout."],
          ["Linting", "ESLint", "Consistent style across the monorepo."],
        ]}
      />

      <h2>Cost at scale</h2>

      <p>
        Every choice above maps to a provider with a free tier that holds until
        roughly a thousand daily active users. Beyond that, the costs arrive in
        this order:
      </p>

      <Steps>
        <Step title="Database reads">
          <p>
            Usually first. Aggregation pipelines over orders grow expensive
            fast. Index the fields you group and match on —{" "}
            <a href="/docs/production/scaling">Scaling &amp; Performance</a>.
          </p>
        </Step>
        <Step title="Image bandwidth">
          <p>
            Cloudinary transformations and a CDN are far cheaper than the
            database bill caused by serving raw images.
          </p>
        </Step>
        <Step title="Socket connections">
          <p>
            Long-lived connections are cheap individually; tens of thousands
            need a sticky-session load balancer and the WebSocket adapter.
          </p>
        </Step>
        <Step title="Compute">
          <p>
            Last, and the easiest to solve — horizontal scaling of a stateless
            Express process is genuinely routine.
          </p>
        </Step>
      </Steps>

      <h2>Swapping a layer out later</h2>

      <p>
        The one decision that is genuinely hard to reverse is the database.
        Everything else is contained: swapping Express for Fastify means
        rewriting middleware; swapping Stripe for Razorpay means rewriting one
        controller and its webhooks.
      </p>

      <Callout variant="tip" title="Keep your ports clean">
        <p>
          Isolate third-party integrations behind their own modules —{" "}
          <InlineCodeish>utils/cloudinary.js</InlineCodeish>,{" "}
          <InlineCodeish>utils/pushNotification.js</InlineCodeish>. Business
          logic should never import the Stripe SDK directly. The moment a
          provider needs replacing, you want exactly one file to rewrite.
        </p>
      </Callout>
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

export function Planning() {
  return (
    <>
      <p>
        Requirements written before code are the cheapest thing in any project.
        This chapter turns &ldquo;an app like Zomato&rdquo; into concrete domain
        rules you can implement and test — and, just as importantly, rules you
        can push back on when a stakeholder asks for something that conflicts
        with them.
      </p>

      <h2>Roles and permissions</h2>

      <p>
        Four roles, each with a distinct set of permissions. This table becomes
        the RBAC configuration in{" "}
        <a href="/docs/backend/auth">Authentication &amp; RBAC</a> and the route
        guards on every endpoint.
      </p>

      <PropertyTable
        headers={["Capability", "Customer", "Restaurant", "Rider", "Admin"]}
        rows={[
          ["Browse restaurants & menus", "Yes", "Own menu only", "No", "All"],
          ["Place an order", "Yes", "No", "No", "No"],
          ["Accept / reject an order", "No", "Yes", "No", "Intervene"],
          [
            "Advance order status",
            "No",
            "Up to ready",
            "Pickup → delivered",
            "Any",
          ],
          ["Edit menu items", "No", "Yes", "No", "Yes"],
          ["Accept a delivery", "No", "No", "Yes", "No"],
          ["Update live location", "No", "No", "Yes", "No"],
          ["See platform analytics", "No", "Own only", "Own only", "All"],
          ["Approve restaurants & riders", "No", "No", "No", "Yes"],
          ["Create offers", "No", "No", "No", "Yes"],
          ["Refund an order", "No", "No", "No", "Yes"],
          ["Change platform settings", "No", "No", "No", "Yes"],
        ]}
      />

      <Callout variant="note" title="Least privilege, enforced server-side">
        <p>
          Every cell in that table is a server-side check. Hiding a button in
          the UI is a usability decision; it is not security. The client is
          assumed hostile throughout this guide.
        </p>
      </Callout>

      <h2>The order lifecycle</h2>

      <p>
        An order is the centre of this system, and its state machine is the most
        important piece of business logic you will write. Get it wrong and you
        get orders that get stuck, payments captured without food prepared, or
        riders picking up orders that were cancelled an hour ago.
      </p>

      <Diagram caption="The seven states and who drives each transition">
        {`
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
              ┌───────────┐                                │
   customer  │  pending  │  order created, awaiting        │
   places →  └─────┬─────┘  restaurant response           │
                    │                                      │
        restaurant │ accept                                │
                    ▼                                      │
              ┌───────────┐                                │
              │ confirmed │  preparation time committed     │
              └─────┬─────┘                                │
                    │                                      │
        restaurant │ start preparing                       │
                    ▼                                      │
              ┌───────────┐                                │
              │ preparing │  kitchen is cooking              │
              └─────┬─────┘                                │
                    │                                      │
        restaurant │ mark ready                             │
                    ▼                                      │
           ┌───────────────────┐                           │
           │  ready_for_pickup │───────────────────────────┘
           └─────────┬─────────┘   (10 min with no rider → auto-cancel)
                     │
           rider     │ accept
                     ▼
               ┌──────────┐
               │ pickedup │  rider assigned, heading to restaurant
               └────┬─────┘
                    │
           rider    │ confirm pickup
                    ▼
           ┌────────────────────┐
           │ out_for_delivery   │  live location streaming begins
           └─────────┬──────────┘
                     │
           rider     │ confirm delivery (+ proof)
                     ▼
               ┌───────────┐
               │ delivered │  terminal — now rateable
               └───────────┘

  Terminal states: delivered, cancelled
  From ANY non-terminal state, an authorised party may cancel.
`}
      </Diagram>

      <h3>The transition table</h3>

      <p>
        Rather than scattering <InlineCodeish>if</InlineCodeish> statements
        across three controllers, define the legal transitions once and validate
        against that map. It becomes a single source of truth and trivially
        testable.
      </p>

      <CodeBlock
        language="js"
        title="The order state machine"
        code={`export const validTransitions = {
  pending:           ['confirmed', 'cancelled'],
  confirmed:         ['preparing', 'cancelled'],
  preparing:         ['ready_for_pickup', 'cancelled'],
  ready_for_pickup:  ['pickedup', 'cancelled'],
  pickedup:          ['out_for_delivery', 'cancelled'],
  out_for_delivery:  ['delivered', 'cancelled'],
  delivered:         [],   // terminal
  cancelled:         [],   // terminal
};

export function canTransition(from, to) {
  return validTransitions[from]?.includes(to) ?? false;
}

// Assert on every write:
if (!canTransition(order.status, nextStatus)) {
  throw new ApiError(
    400,
    \`Cannot move an order from "\${order.status}" to "\${nextStatus}"\`,
  );
}`}
      />

      <Callout variant="tip" title="Why not let each role pick any status?">
        <p>
          Because it produces states that are impossible in the physical world.
          A restaurant marking an order <em>delivered</em> means nobody
          confirmed a hand-off, so there is no delivery proof. Constraining
          transitions makes the domain self-enforcing rather than a set of
          conventions people must remember.
        </p>
      </Callout>

      <h2>Core entities</h2>

      <p>
        Nine collections carry the platform. Each is modelled in{" "}
        <a href="/docs/backend/models">Data Models</a>; here is why each exists.
      </p>

      <PropertyTable
        headers={["Entity", "Purpose", "Key fields"]}
        rows={[
          [
            "User",
            "Every human, in every role.",
            "role, email, passwordHash, profile, addresses, isVerified",
          ],
          [
            "Restaurant",
            "A merchant listing and its terms.",
            "owner, location (2dsphere), isOpen, operatingHours, deliverySettings",
          ],
          [
            "Category",
            "Platform-level menu grouping.",
            "name, slug, image, isActive",
          ],
          [
            "FoodItem",
            "A sellable menu entry.",
            "restaurant, category, nutrition, dietaryTags, price, isAvailable",
          ],
          [
            "Cart",
            "One active cart per customer.",
            "user, restaurant, items[], appliedOffer",
          ],
          [
            "Order",
            "An immutable purchase record.",
            "items[] (snapshots), pricing, status, statusHistory, rider",
          ],
          [
            "Offer",
            "A discount rule.",
            "code, type, value, minOrder, scope, usageLimit, expiresAt",
          ],
          [
            "Notification",
            "An in-app message with read state.",
            "user, type, title, body, data, isRead",
          ],
          [
            "Earning",
            "A rider payout record.",
            "rider, order, deliveryFee, tip, bonus, status, paidAt",
          ],
        ]}
      />

      <h3>The single-collection user decision</h3>

      <p>
        All four roles live in one <InlineCodeish>User</InlineCodeish>{" "}
        collection discriminated by <InlineCodeish>role</InlineCodeish>, with
        role-specific sub-documents for rider and restaurant details.
      </p>

      <Split
        left={{
          title: "What this buys",
          children: (
            <ul>
              <li>One registration, login, and token pipeline.</li>
              <li>
                One place to enforce &ldquo;is this person active?&rdquo; for
                every role.
              </li>
              <li>
                Notifications and support tickets reference one identifier.
              </li>
              <li>
                A rider who later opens a restaurant is already a known user.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "What it costs",
          children: (
            <ul>
              <li>
                Every query must filter by role, or you leak data across roles.
              </li>
              <li>The document grows as you add role fields.</li>
              <li>
                Indexes must be compound with{" "}
                <InlineCodeish>role</InlineCodeish> to stay useful.
              </li>
            </ul>
          ),
        }}
      />

      <p>
        The costs are manageable and the benefits compound across the entire
        codebase. It is the right default for a marketplace where people may
        hold more than one role.
      </p>

      <h2>Business rules</h2>

      <p>
        These are the rules that are easy to forget and expensive to retrofit.
        Every one of them becomes a validation or a background job.
      </p>

      <Steps>
        <Step title="A cart belongs to exactly one restaurant">
          <p>
            Adding an item from a different restaurant replaces the cart, and
            the user is told why. Merging carts produces orders that nobody can
            prepare from one kitchen.
          </p>
        </Step>

        <Step title="Order minimums and delivery radius are enforced at checkout">
          <p>
            A restaurant sets <InlineCodeish>minOrderAmount</InlineCodeish> and{" "}
            <InlineCodeish>deliveryRadius</InlineCodeish>. Both are checked in
            the order controller, not only in the UI, because the UI is
            advisory.
          </p>
        </Step>

        <Step title="Closed restaurants are invisible, not just unorderable">
          <p>
            Public listings filter on{" "}
            <InlineCodeish>isOpen: true</InlineCodeish>. Showing a restaurant
            you cannot order from is a worse experience than not showing it. The
            status itself is maintained by a background job from operating
            hours.
          </p>
        </Step>

        <Step title="Prices are stored, never recomputed">
          <p>
            An order snapshots item names and unit prices at purchase time.
            Changing a menu price the next day must not alter what a customer
            was charged last month.
          </p>
        </Step>

        <Step title="Totals are computed server-side, always">
          <p>
            The client may show a preview, but the server recomputes subtotal,
            discount, delivery fee, and tax from source records. Never trust a
            client-supplied total — that is how platforms get drained.
          </p>
        </Step>

        <Step title="An unclaimed order auto-cancels after ten minutes">
          <p>
            A rider who never accepts leaves the customer and restaurant waiting
            indefinitely. A scheduled job cancels and notifies both parties. See{" "}
            <a href="/docs/backend/background-jobs">Background Jobs</a>.
          </p>
        </Step>

        <Step title="Payments are confirmed by webhook, not by the client">
          <p>
            The client&rsquo;s success callback is a hint. The Stripe webhook is
            the fact. Design every payment flow around the webhook, then make
            the return path a convenience.
          </p>
        </Step>
      </Steps>

      <Callout variant="danger" title="The single most important rule">
        <p>
          Never trust a total, a price, a role, or a status sent by the client.
          Recompute prices from the database, derive the role from the verified
          token, and validate status transitions against the state machine.
          Every one of these is a place where trusting the client costs real
          money.
        </p>
      </Callout>

      <h2>Non-functional requirements</h2>

      <PropertyTable
        headers={["Requirement", "Target", "How we meet it"]}
        rows={[
          [
            "Order placement latency",
            "Under 500 ms p95",
            "Indexed lookups, no N+1, totals computed from cached documents.",
          ],
          [
            "Live location update",
            "Under 2 s to customer",
            "Socket.IO rooms with throttled position pings.",
          ],
          [
            "Availability",
            "99.9%",
            "Health checks, stateless processes behind a load balancer.",
          ],
          [
            "Horizontal scale",
            "Stateless API",
            "No server-side sessions; JWT carries all context.",
          ],
          [
            "Data durability",
            "No lost orders",
            "Replicaset-backed MongoDB, confirmed writes on orders.",
          ],
          [
            "Auditability",
            "Every state change traceable",
            "statusHistory array on each order with actor and timestamp.",
          ],
        ]}
      />

      <h2>Acceptance criteria</h2>

      <p>
        A feature is done when these are true. Writing them before
        implementation is what keeps scope from expanding quietly.
      </p>

      <PropertyTable
        headers={["Criterion", "How you verify it"]}
        rows={[
          [
            "A customer can complete a purchase end to end",
            "An integration test posts cart → order → payment, asserting each transition.",
          ],
          [
            "Illegal transitions are rejected",
            "Unit tests assert canTransition returns false for every invalid pair.",
          ],
          [
            "Totals are authoritative server-side",
            "A test posts an order with a forged total and asserts the server overrides it.",
          ],
          [
            "Role boundaries hold",
            "A test requests a restaurant-only endpoint with a customer token and asserts 403.",
          ],
          [
            "An abandoned order is cleaned up",
            "A test with a faked clock advances 10 minutes and asserts auto-cancel.",
          ],
          [
            "Notifications reach all parties",
            "A test asserts customer, restaurant, and rider each receive a notification per state change.",
          ],
        ]}
      />

      <h2>What to build first</h2>

      <p>
        If you have limited time, build in this order. Each step is
        independently demonstrable, so you always have something that runs.
      </p>

      <Steps>
        <Step title="Auth and the user model">
          <p>
            Without it nothing else is testable end to end.{" "}
            <a href="/docs/backend/auth">Authentication &amp; RBAC</a>
          </p>
        </Step>
        <Step title="The catalogue: restaurants, categories, food items">
          <p>
            Read-heavy, and it gives the customer app something to render.{" "}
            <a href="/docs/backend/restaurant-apis">
              Restaurant &amp; Food APIs
            </a>
          </p>
        </Step>
        <Step title="Cart and order creation">
          <p>
            The heart of the system.{" "}
            <a href="/docs/backend/cart-orders">Cart &amp; Order APIs</a>
          </p>
        </Step>
        <Step title="The state machine and role-specific updates">
          <p>
            What makes it a marketplace rather than a catalogue.{" "}
            <a href="/docs/backend/cart-orders">Cart &amp; Order APIs</a>
          </p>
        </Step>
        <Step title="Payments and webhooks">
          <p>
            Money. <a href="/docs/backend/payments">Payments with Stripe</a>
          </p>
        </Step>
        <Step title="Realtime and notifications">
          <p>
            What makes it feel alive.{" "}
            <a href="/docs/backend/realtime">Real-Time &amp; WebSockets</a>
          </p>
        </Step>
      </Steps>
    </>
  );
}
