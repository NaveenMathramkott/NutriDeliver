/**
 * Maps a navigation slug to a lazy loader for the page body.
 *
 * Chapters are code-split on purpose. The landing page and any single chapter
 * only need the markup for what is on screen; eagerly importing all 34 would
 * ship the entire guide to every visitor. The search index opts back into the
 * full set on demand — see `lib/search-index.jsx`.
 */
export const contentLoaders = {
  // Introduction
  overview: () => import("./pages/introduction").then((m) => m.Overview),
  architecture: () =>
    import("./pages/introduction").then((m) => m.Architecture),
  "tech-stack": () => import("./pages/introduction").then((m) => m.TechStack),
  planning: () => import("./pages/introduction").then((m) => m.Planning),

  // Backend — foundation
  "backend/setup": () =>
    import("./pages/backend-foundation").then((m) => m.BackendSetup),
  "backend/database": () =>
    import("./pages/backend-foundation").then(
      (m) => m.BackendDatabaseConnection,
    ),

  // Backend — data & access
  "backend/models": () =>
    import("./pages/backend-data").then((m) => m.BackendModels),
  "backend/validation": () =>
    import("./pages/backend-data").then((m) => m.BackendValidation),
  "backend/errors": () =>
    import("./pages/backend-data").then((m) => m.BackendErrors),
  "backend/middleware": () =>
    import("./pages/backend-data").then((m) => m.BackendMiddleware),
  "backend/auth": () =>
    import("./pages/backend-data").then((m) => m.BackendAuth),

  // Backend — APIs
  "backend/api-design": () =>
    import("./pages/backend-apis").then((m) => m.BackendApiDesign),
  "backend/restaurant-apis": () =>
    import("./pages/backend-apis").then((m) => m.BackendRestaurantApis),
  "backend/cart-orders": () =>
    import("./pages/backend-apis").then((m) => m.BackendCartOrders),
  "backend/payments": () =>
    import("./pages/backend-apis").then((m) => m.BackendPayments),
  "backend/offers": () =>
    import("./pages/backend-apis").then((m) => m.BackendOffers),
  "backend/uploads": () =>
    import("./pages/backend-apis").then((m) => m.BackendUploads),
  "backend/notifications": () =>
    import("./pages/backend-apis").then((m) => m.BackendNotifications),

  // Backend — infrastructure
  "backend/realtime": () =>
    import("./pages/infra-and-clients").then((m) => m.BackendRealtime),
  "backend/background-jobs": () =>
    import("./pages/infra-and-clients").then((m) => m.BackendBackgroundJobs),
  "backend/analytics": () =>
    import("./pages/infra-and-clients").then((m) => m.BackendAnalytics),
  "backend/testing": () =>
    import("./pages/infra-and-clients").then((m) => m.BackendTesting),
  "backend/docs": () =>
    import("./pages/infra-and-clients").then((m) => m.BackendDocs),

  // Mobile apps
  "mobile/setup": () =>
    import("./pages/infra-and-clients").then((m) => m.MobileSetup),
  "mobile/api-client": () =>
    import("./pages/infra-and-clients").then((m) => m.MobileApiClient),
  "mobile/customer": () =>
    import("./pages/apps-and-ops").then((m) => m.MobileCustomer),
  "mobile/restaurant": () =>
    import("./pages/apps-and-ops").then((m) => m.MobileRestaurant),
  "mobile/rider": () =>
    import("./pages/apps-and-ops").then((m) => m.MobileRider),
  "mobile/notifications": () =>
    import("./pages/apps-and-ops").then((m) => m.MobileNotifications),

  // Admin panel
  "admin/setup": () => import("./pages/apps-and-ops").then((m) => m.AdminSetup),
  "admin/state": () => import("./pages/apps-and-ops").then((m) => m.AdminState),
  "admin/dashboard": () =>
    import("./pages/apps-and-ops").then((m) => m.AdminDashboard),
  "admin/verification": () =>
    import("./pages/operations").then((m) => m.AdminVerification),

  // Production
  "production/deployment": () =>
    import("./pages/operations").then((m) => m.ProductionDeployment),
  "production/scaling": () =>
    import("./pages/operations").then((m) => m.ProductionScaling),
  "production/observability": () =>
    import("./pages/operations").then((m) => m.ProductionObservability),
  "production/checklist": () =>
    import("./pages/operations").then((m) => m.ProductionChecklist),
};
