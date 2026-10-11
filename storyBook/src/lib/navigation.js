/**
 * The navigation tree for the guide.
 *
 * Each page declares a `slug`, `title`, and `description`. The sidebar,
 * prev/next pager, and search index are all derived from this single
 * structure, so adding a page here plus a body in the content registry is all
 * it takes to surface it everywhere.
 *
 * Page bodies live in `components/docs/docs-content.jsx` — deliberately a
 * separate module so importing navigation metadata (which the sidebar does on
 * every route) never drags in every page's markup.
 */

export const sections = [
  {
    title: "Introduction",
    pages: [
      {
        slug: "overview",
        title: "Overview",
        description:
          "What NutriDeliver is, who it serves, and how to read this guide.",
      },
      {
        slug: "architecture",
        title: "System Architecture",
        description:
          "The four applications, the monorepo layout, and how data flows between them.",
      },
      {
        slug: "tech-stack",
        title: "Choosing the Tech Stack",
        description:
          "Why Node, MongoDB, Expo, and Vite — and what each layer is responsible for.",
      },
      {
        slug: "planning",
        title: "Requirements & Domain Modelling",
        description:
          "Roles, order lifecycle states, and the entities you need before writing code.",
      },
    ],
  },
  {
    title: "Backend",
    pages: [
      {
        slug: "backend/setup",
        title: "Project Setup",
        description:
          "Boot an Express 5 server with logging, security headers, and environment config.",
      },
      {
        slug: "backend/database",
        title: "Database Connection",
        description:
          "Mongoose setup, connection lifecycle, and environment-based configuration.",
      },
      {
        slug: "backend/models",
        title: "Data Models",
        description:
          "Modelling User, Restaurant, FoodItem, Order, Cart, and the rest with Mongoose.",
      },
      {
        slug: "backend/validation",
        title: "Validation Layer",
        description:
          "Joi schemas and reusable validators that keep bad data out of your database.",
      },
      {
        slug: "backend/errors",
        title: "Error Handling",
        description:
          "A typed ApiError, async wrappers, and one central Express error handler.",
      },
      {
        slug: "backend/middleware",
        title: "Middleware & Security",
        description:
          "Helmet, CORS, rate limiting, sanitization, and request logging in the right order.",
      },
      {
        slug: "backend/auth",
        title: "Authentication & RBAC",
        description:
          "JWT access and refresh tokens, bcrypt hashing, and role-based guards.",
      },
      {
        slug: "backend/api-design",
        title: "API Design & Routing",
        description:
          "Resource naming, response envelopes, versioning, and route module structure.",
      },
      {
        slug: "backend/restaurant-apis",
        title: "Restaurant & Food APIs",
        description:
          "Building the public catalogue: listings, filters, search, and menus.",
      },
      {
        slug: "backend/cart-orders",
        title: "Cart & Order APIs",
        description:
          "Restaurant-scoped carts, order creation, and the status state machine.",
      },
      {
        slug: "backend/payments",
        title: "Payments with Stripe",
        description:
          "PaymentIntents, server-side confirmation, webhooks, and refunds.",
      },
      {
        slug: "backend/offers",
        title: "Offers & Discounts",
        description:
          "Coupon validation, usage limits, and scoped applicability rules.",
      },
      {
        slug: "backend/uploads",
        title: "File Uploads",
        description:
          "Multer + Cloudinary for avatars, restaurant imagery, and rider documents.",
      },
      {
        slug: "backend/notifications",
        title: "Notifications",
        description:
          "In-app notifications, email via Nodemailer, and push via FCM.",
      },
      {
        slug: "backend/realtime",
        title: "Real-Time & WebSockets",
        description:
          "Socket.IO rooms for order updates, new orders, and rider location streaming.",
      },
      {
        slug: "backend/background-jobs",
        title: "Background Jobs",
        description:
          "Auto-cancel timers, operating-hours sync, and scheduled cleanup.",
      },
      {
        slug: "backend/analytics",
        title: "Analytics Endpoints",
        description:
          "MongoDB aggregation pipelines for restaurant, rider, and platform reporting.",
      },
      {
        slug: "backend/testing",
        title: "Testing the Backend",
        description:
          "Supertest against a real in-memory MongoDB, plus controller-level unit tests.",
      },
      {
        slug: "backend/docs",
        title: "API Documentation",
        description:
          "Serving interactive Swagger UI and a machine-readable OpenAPI spec.",
      },
    ],
  },
  {
    title: "Mobile Apps",
    pages: [
      {
        slug: "mobile/setup",
        title: "Expo App Setup",
        description:
          "Expo Router, folder-based routing, and the shared app shell for all three apps.",
      },
      {
        slug: "mobile/api-client",
        title: "API Client & State",
        description:
          "A typed fetch wrapper with token refresh, and a Redux store per app.",
      },
      {
        slug: "mobile/customer",
        title: "Customer App",
        description:
          "Discovery, cart, checkout, live tracking, and the rest of the customer flow.",
      },
      {
        slug: "mobile/restaurant",
        title: "Restaurant App",
        description:
          "Order management, menu editing, availability, and earnings.",
      },
      {
        slug: "mobile/rider",
        title: "Rider App",
        description:
          "Going online, accepting deliveries, navigation, and payout tracking.",
      },
      {
        slug: "mobile/notifications",
        title: "Push & Local Notifications",
        description:
          "Registering device tokens and reacting to notifications in the app.",
      },
    ],
  },
  {
    title: "Admin Panel",
    pages: [
      {
        slug: "admin/setup",
        title: "Admin Panel Setup",
        description:
          "Vite, Tailwind, and shadcn/ui for a fast internal dashboard.",
      },
      {
        slug: "admin/state",
        title: "Redux Toolkit Slices",
        description:
          "Auth, data fetching, caching, and normalized entity state.",
      },
      {
        slug: "admin/dashboard",
        title: "Dashboard & Analytics UI",
        description:
          "KPI cards, charts, and tables driven by the aggregation endpoints.",
      },
      {
        slug: "admin/verification",
        title: "Verification Workflows",
        description: "Approving restaurants and riders with document review.",
      },
    ],
  },
  {
    title: "Production",
    pages: [
      {
        slug: "production/deployment",
        title: "Deployment",
        description:
          "Containerizing the backend and shipping the apps to their stores.",
      },
      {
        slug: "production/scaling",
        title: "Scaling & Performance",
        description:
          "Indexes, caching, horizontal scaling, and the microservices path.",
      },
      {
        slug: "production/observability",
        title: "Logging & Monitoring",
        description:
          "Structured logs, error tracking, health checks, and uptime alerts.",
      },
      {
        slug: "production/checklist",
        title: "Launch Checklist",
        description:
          "Everything to verify before real money and real users arrive.",
      },
    ],
  },
];

/** Flatten the tree into an ordered list used for paging and search. */
export const flatPages = sections.flatMap((section) =>
  section.pages.map((page) => ({ ...page, section: section.title })),
);

export function getPage(slug) {
  return flatPages.find((page) => page.slug === slug);
}
