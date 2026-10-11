import offersImage from '../../../assets/admin_dashboard_offers.png'
import { Callout } from '../callout'
import { CodeBlock } from '../code-block'
import { Diagram, PropertyTable, Split, Step, Steps } from '../primitives'
import { Screenshot } from '../screenshot'

export function BackendApiDesign() {
  return (
    <>
      <p>
        An API is the only part of this platform every client depends on. The
        restaurant app, the rider app, the admin panel, and background jobs all
        speak it. Once it is in production, every change you make is paid for by
        someone. This chapter is about the conventions that make those changes
        cheap: how URLs are shaped, what a response always looks like, which
        status code you reach for, and how the route tree stays navigable once
        it passes a hundred endpoints.
      </p>

      <h2>Resource naming</h2>

      <p>
        NutriDeliver is a resource-oriented API. Every URL names a thing, uses a
        plural noun, and nothing else. Verbs belong in HTTP methods, not in
        paths.
      </p>

      <PropertyTable
        headers={['Instead of', 'NutriDeliver uses', 'Why']}
        rows={[
          [
            'GET /getRestaurants',
            'GET /api/restaurants',
            'The method already says read. Repeating it makes the URL lie.',
          ],
          [
            'POST /createOrder',
            'POST /api/orders',
            'POST to the collection means create. The action is the verb.',
          ],
          [
            'POST /deleteFoodItem',
            'DELETE /api/food/:id',
            'Delete is a method and a noun, not a string in the path.',
          ],
          [
            'PUT /updateOrderStatus',
            'PUT /api/orders/:id/status',
            'Status is a sub-resource of the order, addressable on its own.',
          ],
          [
            'GET /api/orderListForUser',
            'GET /api/orders',
            'The caller is implied by the token, not by the path.',
          ],
        ]}
      />

      <p>
        Sub-resources are allowed when they are genuinely addressable and carry
        their own lifecycle — <code>/orders/:id/status</code>,{' '}
        <code>/orders/:id/location</code>, <code>/cart/items</code>. They are
        not allowed as decoration. If a sub-resource could be a top-level
        resource with a different name, make it one.
      </p>

      <Callout variant="warning" title="Do not encode the caller in the URL">
        <p>
          There is no <code>/api/restaurants/my/restaurant/orders</code> pattern
          here, because the caller is already known: it is in the verified
          token. Writing <code>my</code> into the path creates two URLs for one
          resource and hands every future maintainer a decision about which one
          to canonicalise. The restaurant owner&rsquo;s endpoints are guarded by{' '}
          <code>authorize('restaurant', 'admin')</code> and resolve ownership
          from <code>req.user.id</code>.
        </p>
      </Callout>

      <h2>The response envelope</h2>

      <p>
        Every response — success or failure — has the same three keys. This is
        not cosmetic; it is what lets one API client unwrap every endpoint in
        one place instead of two hundred.
      </p>

      <CodeBlock
        language="json"
        title="Success"
        code={`{
  "success": true,
  "message": "Restaurant created successfully",
  "data": {
    "restaurant": { "_id": "65f…", "name": "Green Bowl" }
  }
}`}
      />

      <CodeBlock
        language="json"
        title="Failure"
        code={`{
  "success": false,
  "message": "Minimum order amount is $15",
  "errors": [{ "field": "orderTotal", "message": "below minimum" }]
}`}
      />

      <PropertyTable
        headers={['Key', 'Type', 'Rules']}
        rows={[
          [
            'success',
            'boolean',
            'Always present. Derived from the HTTP status, never set by hand.',
          ],
          [
            'message',
            'string',
            'Human-readable, safe to show a user. No stack traces, no SQL, no ids of other users.',
          ],
          [
            'data',
            'object',
            'The payload. Omitted or null on failure. List endpoints nest their own pagination key.',
          ],
          [
            'errors',
            'array',
            'Field-level detail from Joi, present only on validation failures.',
          ],
        ]}
      />

      <Callout variant="danger" title="The envelope is not a licence to leak">
        <p>
          Wrapping everything in <code>data</code> does not mean the client can
          have everything. The envelope is a transport contract, not an
          authorisation boundary. When a customer fetches an order, the query is
          scoped to <code>_id</code> and <code>userId</code> together — the
          envelope never widens what the query returns.
        </p>
      </Callout>

      <h2>Status code discipline</h2>

      <p>
        Status codes are not decoration either. They are how caches, proxies,
        SDKs, and your own client&rsquo;s retry logic decide what happened.
        Returning <code>200</code> for a failure is the single most common way
        an API becomes impossible to operate.
      </p>

      <PropertyTable
        headers={['Code', 'NutriDeliver uses it for', 'Example']}
        rows={[
          [
            '200 OK',
            'A successful read, update, or delete that returns a body',
            'GET /api/orders, PUT /api/orders/:id/cancel',
          ],
          [
            '201 Created',
            'A resource now exists that did not before',
            'POST /api/restaurants, POST /api/orders',
          ],
          [
            '400 Bad Request',
            'The request is understood but violates a business rule',
            'Restaurant closed, minimum order not met',
          ],
          [
            '401 Unauthorized',
            'No token, or a token that failed verification',
            'Missing or expired access token',
          ],
          [
            '403 Forbidden',
            'A valid token for the wrong role, or someone else’s resource',
            'Customer trying to read another customer’s order',
          ],
          [
            '404 Not Found',
            'The resource does not exist, or you are not allowed to know that it does',
            'Order id that belongs to someone else',
          ],
          [
            '409 Conflict',
            'The request collides with existing state',
            'Duplicate email on register, duplicate offer code',
          ],
          [
            '422 Unprocessable',
            'Syntactically valid, semantically impossible after validation',
            'Joi rejected the payload',
          ],
          [
            '500 Internal',
            'An unhandled fault — the only code you never write deliberately',
            'Database unreachable',
          ],
        ]}
      />

      <Callout variant="tip" title="404 over 403 hides information">
        <p>
          When a customer requests an order that is not theirs, return 404 — not
          403. A 403 confirms the order exists, which is enough to enumerate
          someone else&rsquo;s order history. The rule generalises: if
          confirming existence is itself a leak, respond as though the resource
          were never there.
        </p>
      </Callout>

      <h2>Pagination</h2>

      <p>
        Every collection endpoint is paginated. NutriDeliver uses offset
        pagination (<code>page</code> / <code>limit</code>) because it supports
        random page access, which is what a paginated list in a mobile app
        actually needs. It is capped so a client cannot ask for the whole
        database.
      </p>

      <CodeBlock
        language="js"
        title="controllers/restaurantController.js"
        code={`export const getAllRestaurants = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    cuisineType,
    minRating,
    search,
    sortBy = 'rating',
    sortOrder = 'desc',
    isOpen,
  } = req.query;

  // Clamp before the query runs — never trust a client-supplied limit.
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const query = { isActive: true, isVerified: true };
  if (isOpen === 'true') query.isOpen = true;
  if (cuisineType) query.cuisineType = cuisineType;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(query)
      .select('name description cuisineType rating totalReviews images contact operatingHours isOpen')
      .sort(sortOptions)
      .skip((pageNum - 1) * perPage)
      .limit(perPage),
    Restaurant.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      restaurants,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / perPage),
        total,
      },
    },
  });
});`}
      />

      <Diagram caption="Offset pagination is what a paginated UI wants">
        {`
  Offset (page/limit)

  client          server                  database
    │  ?page=3          │                     │
    ├──────────────────▶│  skip(20).limit(10)│
    │                   ├────────────────────▶│
    │                   │◀──── 10 docs + 47 ──┤
    │  pagination:      │                     │
    │  { current: 3,    │                     │
    │    pages: 5,      │                     │
    │    total: 47 }    │                     │
    │◀──────────────────┤                     │

  Cursor (page=3 → "after 65f2…")

  client          server                  database
    │  ?cursor=65f2    │                     │
    ├──────────────────▶│  { $gt: 65f2 }      │
    │                   ├────────────────────▶│
    │                   │◀──── next 10 + null ┤
    │◀──────────────────┤                     │

  offset is fine for "page 3 of 5".
  cursor is required for infinite scroll over a
  collection that is still receiving writes.
`}
      </Diagram>

      <Split
        left={{
          title: 'Offset pagination',
          children: (
            <ul>
              <li>Supports random access: page 7 of 12 just works.</li>
              <li>
                One query, and the total count is free with countDocuments.
              </li>
              <li>
                Degrades as offset grows — skip(100000) still walks 100,000
                entries.
              </li>
              <li>
                Can duplicate or skip rows if the collection is written to
                mid-scroll.
              </li>
            </ul>
          ),
        }}
        right={{
          title: 'Cursor pagination',
          children: (
            <ul>
              <li>
                Constant cost regardless of depth — the index seeks directly.
              </li>
              <li>
                Stable under concurrent writes, which is what live order lists
                need.
              </li>
              <li>
                Infinite scroll becomes trivial: append, request the next
                cursor.
              </li>
              <li>
                No random page access, and the total count needs a second query.
              </li>
            </ul>
          ),
        }}
      />

      <p>
        NutriDeliver uses offset pagination for admin tables and order history,
        where the data set is bounded and mostly historical. If you extend this
        to a continuously-growing rider feed, switch that one endpoint to a
        cursor on <code>createdAt</code> + <code>_id</code> rather than
        increasing <code>limit</code>.
      </p>

      <h3>Filtering and sorting</h3>

      <p>
        Filters are query parameters with explicit names, not a generic{' '}
        <code>where</code> or <code>filter</code> blob. A generic filter
        language is a query injection surface with a friendly name. Explicit
        parameters are validated by Joi before they reach MongoDB, and each one
        maps to a field you chose to expose.
      </p>

      <CodeBlock
        language="js"
        title="validations/restaurantValidation.js"
        code={`export const listRestaurantsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),

  cuisineType: Joi.string().valid(
    'healthy', 'salads', 'protein', 'vegan', 'vegetarian',
    'gluten-free', 'keto', 'mediterranean', 'smoothies',
  ),

  minRating: Joi.number().min(0).max(5),
  priceRange: Joi.string().valid('low', 'medium', 'premium'),
  isOpen: Joi.boolean(),
  dietary: Joi.string(),   // comma-separated dietary tags

  search: Joi.string().max(80).allow(''),

  sortBy: Joi.string()
    .valid('rating', 'name', 'createdAt', 'deliveryTime')
    .default('rating'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}).unknown(false);`}
      />

      <Callout variant="note" title="Allow-list the sort field">
        <p>
          <code>sortBy</code> is the parameter most often used to wreck a
          database. Written as <code>sortOptions[sortBy] = …</code> with an
          unvalidated string, it lets a caller sort by any field, including ones
          with no index, which turns a 5 ms query into a collection scan.
          Joi&rsquo;s <code>.valid()</code> list above is the fix, and it is
          cheaper than any index you could add.
        </p>
      </Callout>

      <h2>Versioning</h2>

      <p>
        NutriDeliver versions at the URL prefix: <code>/api/v1</code>. The
        reason is that versioning by header requires every client — including
        yours, curl, and the admin panel — to remember to send a header, and the
        failure mode is silent. A URL prefix fails loudly.
      </p>

      <CodeBlock
        language="js"
        title="server.js"
        code={`// Every route module is mounted twice as the API grows: an unversioned
// alias during development, and the versioned prefix clients should target.
import restaurantRoutes from './routes/restaurants.js'
import orderRoutes from './routes/orders.js'
import cartRoutes from './routes/cart.js'
import paymentRoutes from './routes/payments.js'

app.use('/api/v1/restaurants', restaurantRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/payments', paymentRoutes)

// /api/health deliberately stays unversioned: a load balancer that cannot parse
// your version scheme should not mark you unhealthy.`}
      />

      <Steps>
        <Step title="Make the change additively by default">
          <p>
            New optional query parameters, new fields in a response body, and
            new endpoints are all non-breaking. Clients ignore what they do not
            recognise. Ship these freely under the same version.
          </p>
        </Step>
        <Step title="Reserve v2 for a removal or a semantic change">
          <p>
            Renaming a field, changing a price calculation, tightening
            validation so previously valid input now fails, or removing an
            endpoint — each of these breaks an existing client. That is when the
            version increments.
          </p>
        </Step>
        <Step title="Run both versions side by side">
          <p>
            Mount v1 and v2 simultaneously, share the controllers, and thin the
            old version with a deprecation header:{' '}
            <code>Deprecation: true</code> and{' '}
            <code>Sunset: Sat, 30 Nov 2026 00:00:00 GMT</code>. Mobile clients
            cannot all be forced to update on the same day.
          </p>
        </Step>
      </Steps>

      <h2>Organising a multi-role API</h2>

      <p>
        Eleven route modules, four roles, and roughly a hundred endpoints. The
        organising principle is simple:{' '}
        <strong>
          one router per domain, mounted once, with public routes declared
          before the authentication gate
        </strong>
        .
      </p>

      <CodeBlock
        language="js"
        title="routes/restaurants.js"
        code={`const router = express.Router();

// ─── Public: no token required ───────────────────────────────────────────
router.get('/', getAllRestaurants)
router.get('/:id', getRestaurantById)
router.get('/:id/menu', getRestaurantMenu)
router.get('/:id/status', getRestaurantStatus)
router.post('/:id/check-delivery', checkDelivery)

// ─── Everything below this line is authenticated ──────────────────────────
router.use(authenticate)
router.use(authorize('restaurant', 'admin'))

router.get('/restaurant', getMyRestaurant)
router.post('/', validate(validateRestaurant), createRestaurant)
router.put('/restaurant', validate(validateRestaurant), updateRestaurant)
router.put('/restaurant/toggle-status', toggleRestaurantStatus)
router.get('/restaurant/orders', getRestaurantOrders)
router.post('/restaurant/orders/:orderId/respond', respondToOrder)
router.get('/restaurant/analytics', getRestaurantAnalytics)
router.post(
  '/restaurant/images',
  uploadMultiple('images', 5),
  handleUploadError,
  uploadRestaurantImages,
)

export default router`}
      />

      <Callout variant="tip" title="Order matters more than it looks">
        <p>
          <code>router.use(authenticate)</code> is a line, not a prefix — it
          applies to every handler registered after it. Put the public routes
          above it and the guarded routes below, and the file reads as a
          permissions table. Reverse that order and a single forgotten{' '}
          <code>authenticate</code> in the chain exposes a private endpoint.
        </p>
      </Callout>

      <h2>Documenting it</h2>

      <p>
        NutriDeliver generates its OpenAPI spec from JSDoc comments with{' '}
        <a href="/docs/backend/docs">swagger-jsdoc</a>. The annotations live
        directly above the route they describe, which means the documentation
        and the routing table are edited together and cannot drift apart.
      </p>

      <CodeBlock
        language="js"
        title="routes/orders.js"
        code={`/**
 * @swagger
 * /orders/{orderId}/rate:
 *   post:
 *     summary: Rate completed order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order rated
 *       400:
 *         description: Order not delivered or invalid rating
 *       404:
 *         description: Order not found
 */
router.post('/:orderId/rate', authenticate, authorize('user'), rateOrder);`}
      />

      <CodeBlock
        language="js"
        title="config/swagger.js — where the spec is assembled"
        code={`import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'NutriDeliver API', version: '1.0.0' },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development' },
      { url: 'https://api.nutrideliver.com/api', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        // Success / Error / User / Restaurant / FoodItem / Order / Offer / …
      },
    },
    tags: [
      { name: 'Restaurants', description: 'Restaurant management' },
      { name: 'Orders', description: 'Order lifecycle and tracking' },
      // …
    ],
  },
  // Scanning routes AND controllers picks up both the @swagger blocks on the
  // route definitions and the terse @desc / @route / @access tags on handlers.
  apis: ['./routes/*.js', './controllers/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)`}
      />

      <p>
        Every controller handler also carries a three-line comment naming the
        route it serves and who may call it. It costs nothing and it makes a
        grep for a behaviour — say, every place a status can be written — answer
        in one command.
      </p>

      <CodeBlock
        language="js"
        title="The per-handler convention"
        code={`// @desc    Create new order
// @route   POST /api/orders
// @access  Private (User)
export const createOrder = asyncHandler(async (req, res) => { /* … */ })`}
      />

      <Callout variant="note" title="The spec is a build artefact">
        <p>
          <code>/api-docs.json</code> is served from the same process that
          serves the API, so the documentation is always exactly as current as
          the code in that deploy. It also means{' '}
          <a href="/docs/backend/testing">integration tests</a> can assert on{' '}
          <code>swaggerSpec.paths</code> — a route that exists but was never
          documented fails the suite.
        </p>
      </Callout>

      <h2>What to check before shipping an endpoint</h2>

      <PropertyTable
        headers={['Check', 'Why it matters']}
        rows={[
          [
            'Auth guard present and role correct',
            'The single most common source of a data breach.',
          ],
          [
            'Joi schema validates the body and query',
            'Stops malformed input at the boundary, before any database work.',
          ],
          [
            'Status code matches the table above',
            'Clients branch on this; 200-for-everything is unmaintainable.',
          ],
          [
            'Response uses the envelope',
            'Otherwise the client needs a special case for this endpoint.',
          ],
          [
            'Query scoped to the caller',
            'Ownership is part of the query, never a post-fetch check.',
          ],
          [
            'Pagination on every list endpoint',
            'An unbounded list is a denial-of-service vector.',
          ],
          [
            '@swagger block present',
            'Undocumented endpoints are the ones nobody maintains.',
          ],
        ]}
      />

      <p>
        Next:{' '}
        <a href="/docs/backend/restaurant-apis">Restaurant &amp; Food APIs</a> —
        the public catalogue, where these conventions meet a real problem:
        finding restaurants near someone, fast.
      </p>
    </>
  )
}

export function BackendRestaurantApis() {
  return (
    <>
      <p>
        The catalogue is the front door. Everything a customer does before an
        order exists happens here: browsing, filtering by cuisine and dietary
        need, searching, checking whether a restaurant delivers to them, and
        reading a menu. These endpoints are unauthenticated, heavily cached
        candidates, and the most expensive queries in the system — which shapes
        every decision that follows.
      </p>

      <h2>The surface</h2>

      <PropertyTable
        headers={['Endpoint', 'Access', 'What it does']}
        rows={[
          [
            'GET /api/restaurants',
            'Public',
            'Paginated listing with cuisine, rating, price, open, and dietary filters.',
          ],
          [
            'GET /api/restaurants/:id',
            'Public',
            'Full restaurant detail including contact, hours, and delivery settings.',
          ],
          [
            'GET /api/restaurants/:id/menu',
            'Public',
            'Available food items, optionally filtered by category.',
          ],
          [
            'GET /api/restaurants/:id/status',
            'Public',
            'Just isOpen plus operatingHours — the cheapest possible status poll.',
          ],
          [
            'POST /api/restaurants/:id/check-delivery',
            'Public',
            'Distance, delivery fee, minimum order, and estimated time for a coordinate.',
          ],
          [
            'GET /api/restaurants/restaurant',
            'Owner',
            'The caller’s own restaurant profile.',
          ],
          [
            'POST /api/restaurants',
            'Owner',
            'Create the restaurant and backfill the owner’s restaurantProfile.',
          ],
          [
            'PUT /api/restaurants/restaurant',
            'Owner',
            'Update own restaurant with schema validators running.',
          ],
          [
            'PUT /api/restaurants/restaurant/toggle-status',
            'Owner',
            'Flip isOpen manually, ahead of the scheduled hours sync.',
          ],
        ]}
      />

      <h2>Listing and filtering</h2>

      <p>
        The base query is not an empty object. Every public listing starts from{' '}
        <code>{'{ isActive: true, isVerified: true }'}</code>, because an
        unverified or suspended restaurant must never appear to a customer
        regardless of what else matches. Those two predicates belong in the
        query, not in a controller-level filter applied afterwards.
      </p>

      <CodeBlock
        language="js"
        title="controllers/restaurantController.js — the real listing query"
        code={`export const getAllRestaurants = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10, cuisineType, minRating,
    search, sortBy = 'rating', sortOrder = 'desc', isOpen,
  } = req.query;

  const query = { isActive: true, isVerified: true };

  if (isOpen === 'true') query.isOpen = true;
  if (cuisineType) query.cuisineType = cuisineType;
  if (minRating) query.rating = { $gte: parseFloat(minRating) };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const restaurants = await Restaurant.find(query)
    .select('name description cuisineType rating totalReviews images contact operatingHours isOpen')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await Restaurant.countDocuments(query);

  res.json({
    success: true,
    data: {
      restaurants,
      pagination: { current: page, pages: Math.ceil(total / limit), total },
    },
  });
});`}
      />

      <Callout variant="danger" title="Unescaped $regex is a denial-of-service">
        <p>
          The controller above passes <code>search</code> straight into{' '}
          <code>$regex</code>. That is fine for learning and dangerous in
          production: a pattern like <code>(a+)+$</code> forces MongoDB into
          catastrophic backtracking on every document in the collection. In
          production, escape the input or switch to a text index — see{' '}
          <a href="/docs/production/scaling">Scaling &amp; Performance</a>.
        </p>
      </Callout>

      <p>
        The <code>.select()</code> call matters as much as the query. The
        listing projection keeps out bank details, owner identity, and internal
        verification metadata — data a customer never needs and whose accidental
        transmission is both a privacy problem and a payload-size problem.
      </p>

      <h3>The only-show-open rule</h3>

      <p>
        A customer should never see a restaurant they cannot order from. Showing
        a closed restaurant is worse than omitting it: the user builds a cart,
        discovers the problem at checkout, and blames the product. So{' '}
        <code>isOpen: true</code> is a filter on the public listing, on the food
        listing, and on the menu endpoint — not just a badge rendered in the UI.
      </p>

      <PropertyTable
        headers={['Endpoint', 'Closed restaurant behaviour']}
        rows={[
          [
            'GET /api/restaurants',
            'Excluded from results when ?isOpen=true; shown greyed-out otherwise so the customer can plan ahead.',
          ],
          [
            'GET /api/food',
            'Excluded entirely — items from closed restaurants are not listed.',
          ],
          [
            'GET /api/restaurants/:id/menu',
            'Returns 400 with "Restaurant is currently closed".',
          ],
          [
            'POST /api/restaurants/:id/check-delivery',
            'Returns 400 before any distance maths runs.',
          ],
          [
            'POST /api/orders',
            'Rejected during order creation, after the cart is read.',
          ],
        ]}
      />

      <p>
        <code>isOpen</code> is owned by two things. The owner toggles it
        manually with <code>PUT /restaurant/toggle-status</code>, and a
        scheduled job reconciles it against <code>operatingHours</code> every
        five minutes. The manual toggle wins between job runs, which is what
        makes it useful — an owner who runs out of ingredients closes the
        restaurant immediately rather than waiting for the next sweep.
      </p>

      <CodeBlock
        language="js"
        title="controllers/restaurantController.js"
        code={`export const toggleRestaurantStatus = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  restaurant.isOpen = !restaurant.isOpen;
  await restaurant.save();

  res.json({
    success: true,
    message: \`Restaurant is now \${restaurant.isOpen ? 'open' : 'closed'}\`,
    data: { isOpen: restaurant.isOpen },
  });
});`}
      />

      <h2>Geographic queries</h2>

      <p>
        The single most important optimisation in the catalogue is proximity. A
        customer opening the app wants restaurants they can actually receive,
        and the sort order is by distance. Doing that with application-side
        maths means loading every restaurant and filtering in Node — untenable
        past a few thousand rows.
      </p>

      <p>
        MongoDB solves this natively, but only with the right index. The{' '}
        <code>Restaurant</code> schema already declares one:
      </p>

      <CodeBlock
        language="js"
        title="models/Restaurant.js"
        code={`// GeoJSON order matters: longitude first, then latitude. Reversing
// them compiles but silently returns nonsense distances.
restaurantSchema.index({
  'contact.address.coordinates': '2dsphere',
});

restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ cuisineType: 1 });
restaurantSchema.index({ isOpen: 1 });
restaurantSchema.index({ rating: -1 });`}
      />

      <p>
        With that index in place, <code>$near</code> becomes an indexed range
        scan and <code>$geoNear</code> in an aggregation pipeline returns the
        distance as a field you can sort on.
      </p>

      <CodeBlock
        language="js"
        title="geo query — $near with $geometry and maxDistance"
        code={`export const getNearbyRestaurants = asyncHandler(async (req, res) => {
  const { lat, lng, maxDistance = 10 } = req.query; // maxDistance in km

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng query parameters are required',
    });
  }

  const restaurants = await Restaurant.find({
    isActive: true,
    isVerified: true,
    isOpen: true,

    // The heart of it. $geoWithin constrains the candidate set using the
    // 2dsphere index; the $nearSphere inside it sorts by true great-circle
    // distance rather than by raw coordinate arithmetic.
    'contact.address.coordinates': {
      $geoWithin: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)], // lng, lat
        },
        $maxDistance: parseFloat(maxDistance) * 1000,       // metres
      },
    },
  })
    .select('name cuisineType rating images deliverySettings isOpen')
    .limit(50);

  res.json({
    success: true,
    data: { restaurants },
  });
});`}
      />

      <CodeBlock
        language="js"
        title="The same query as an aggregation, with distance attached"
        code={`const results = await Restaurant.aggregate([
  {
    $geoNear: {
      near: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      distanceField: 'distanceMeters',   // added to each document
      maxDistance: parseFloat(maxDistance) * 1000,
      spherical: true,                   // true distance, not degrees
      query: { isActive: true, isVerified: true, isOpen: true },
    },
  },
  {
    // Only now can we apply the non-geographic filters, because $geoNear must
    // be the first stage and cannot share its filter with them.
    $match: {
      cuisineType: { $in: cuisineTypes },
      rating: { $gte: parseFloat(minRating) },
    },
  },
  { $sort: { distanceMeters: 1 } },
  { $limit: 20 },
  {
    $project: {
      name: 1, cuisineType: 1, rating: 1, images: 1,
      deliverySettings: 1,
      distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] },
    },
  },
]);`}
      />

      <PropertyTable
        headers={['Operator', 'Use it when', 'Gotcha']}
        rows={[
          [
            '$near',
            'Simple find() with radius and implicit distance sort',
            'Cannot be combined with $or, $nor, $and at the same level',
          ],
          [
            '$nearSphere',
            'Same, but with true spherical great-circle maths',
            'Slightly slower than $near; identical results on a 2dsphere index',
          ],
          [
            '$geoWithin + $centerSphere',
            'A radius query you do not need sorted',
            'No distance value is returned',
          ],
          [
            '$geoNear (pipeline)',
            'You need the distance in the document, to sort or filter on it',
            'Must be the first stage of the pipeline; cannot $skip or $limit before it',
          ],
        ]}
      />

      <Callout variant="danger" title="maxDistance is in metres">
        <p>
          GeoJSON distances are always metres. Passing <code>10</code> thinking
          kilometres searches a ten-metre radius and returns nothing, which
          reads exactly like &ldquo;no restaurants near me&rdquo;. Multiply by
          1000 at the boundary and keep the unit in the variable name — the bug
          is silent otherwise.
        </p>
      </Callout>

      <p>
        The existing endpoints deliberately do not use <code>$geoNear</code>.{' '}
        <code>check-delivery</code> and the rider availability query operate on
        a <em>single</em> known restaurant and a <em>single</em> rider position,
        so both compute one distance in application code using the Haversine
        formula. That is the right call — a geo query would be index machinery
        to answer a question with exactly one answer.
      </p>

      <CodeBlock
        language="js"
        title="utils/helpers.js — the Haversine distance both controllers share"
        code={`export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // kilometres
};`}
      />

      <h2>Check-delivery</h2>

      <p>
        This is the endpoint the customer app calls the moment they pick an
        address. It answers four questions at once: can this restaurant reach
        me, how far is it, what will delivery cost, and what is the minimum
        order. It is a <code>POST</code> rather than a <code>GET</code> because
        the coordinates belong in a body rather than a query string, and because
        the validation is the point — a missing coordinate should not be a
        long-listed-but-empty result.
      </p>

      <CodeBlock
        language="js"
        title="controllers/restaurantController.js"
        code={`export const checkDelivery = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Delivery coordinates (lat, lng) are required',
    });
  }

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  if (!restaurant.isActive || !restaurant.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is not available for delivery',
    });
  }

  // Closed check comes BEFORE the distance maths — it is free and it is the
  // most common reason a customer cannot order.
  if (!restaurant.isOpen) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is currently closed',
    });
  }

  const restaurantLat = restaurant.contact.address.coordinates.lat;
  const restaurantLng = restaurant.contact.address.coordinates.lng;
  const distance = calculateDistance(restaurantLat, restaurantLng, lat, lng);

  const deliveryRadius  = restaurant.deliverySettings?.deliveryRadius  || 10;
  const deliveryFee     = restaurant.deliverySettings?.deliveryFee     || 2.99;
  const minOrderAmount  = restaurant.deliverySettings?.minOrderAmount  || 15;
  const estimatedTime   = restaurant.deliverySettings?.estimatedDeliveryTime || 30;

  const canDeliver = distance <= deliveryRadius;

  res.json({
    success: true,
    data: {
      canDeliver,
      distance: Math.round(distance * 100) / 100,
      deliveryRadius,
      deliveryFee,
      minOrderAmount,
      estimatedDeliveryTime: estimatedTime,
      message: canDeliver
        ? 'Delivery available to this address'
        : \`Address is outside delivery radius (\${deliveryRadius}km)\`,
    },
  });
});`}
      />

      <Callout variant="warning" title="This is a hint, not a gate">
        <p>
          <code>check-delivery</code> is advisory. Between the customer seeing{' '}
          <code>canDeliver: true</code> and pressing place-order, the restaurant
          can close or change its radius. The same checks therefore run again
          inside <code>POST /api/orders</code> — see{' '}
          <a href="/docs/backend/cart-orders">Cart &amp; Order APIs</a>. Never
          treat a passing pre-check as authorisation.
        </p>
      </Callout>

      <h2>Avoiding N+1</h2>

      <p>
        The dangerous pattern in a catalogue API is populating inside a loop. It
        looks reasonable and it is a latency cliff.
      </p>

      <CodeBlock
        language="js"
        title="The N+1 version — 1 query plus N"
        code={`const restaurants = await Restaurant.find(query).limit(20);

const result = [];
for (const restaurant of restaurants) {
  // A separate round trip per restaurant. 20 restaurants = 21 queries.
  const menuCount = await FoodItem.countDocuments({
    restaurantId: restaurant._id,
    isAvailable: true,
  });
  result.push({ ...restaurant.toObject(), menuCount });
}`}
      />

      <CodeBlock
        language="js"
        title="The fixed version — 2 queries total, or 1 with $lookup"
        code={`// Option A: one aggregation, no extra round trips at all.
const restaurants = await Restaurant.aggregate([
  { $match: query },
  { $sort: { rating: -1 } },
  { $skip: skip },
  { $limit: perPage },
  {
    $lookup: {
      from: 'fooditems',
      let: { rid: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$restaurantId', '$$rid'] },
                { $eq: ['$isAvailable', true] },
              ],
            },
          },
        },
        { $count: 'menuCount' },
      ],
      as: 'menu',
    },
  },
  {
    $addFields: {
      menuCount: { $ifNull: [{ $first: '$menu.menuCount' }, 0] },
    },
  },
  { $project: { menu: 0 } },
]);`}
      />

      <CodeBlock
        language="js"
        title="Option B: $facet — one query, counts and page from the same scan"
        code={`const [result] = await Restaurant.aggregate([
  { $match: query },
  {
    $facet: {
      // $facet runs these branches off a single upstream pass, so the total
      // count and the page of results never disagree with each other.
      data: [
        { $sort: { rating: -1 } },
        { $skip: skip },
        { $limit: perPage },
        {
          $lookup: {
            from: 'fooditems',
            localField: '_id',
            foreignField: 'restaurantId',
            as: 'menu',
          },
        },
        { $addFields: { menuCount: { $size: '$menu' } } },
        { $project: { menu: 0 } },
      ],
      total: [{ $count: 'count' }],
    },
  },
]);

const restaurants = result.data;
const total = result.total[0]?.count ?? 0;`}
      />

      <PropertyTable
        headers={['Technique', 'Queries', 'Use when']}
        rows={[
          [
            'populate()',
            '1 + 1 per populated path',
            'The referenced document is a single doc on a local replica set.',
          ],
          [
            '$lookup with a pipeline',
            '1',
            'You need a filtered or aggregated join — this is the general case.',
          ],
          ['$facet', '1', 'You need both a page of data and a total count.'],
          [
            'Promise.all over batched ids',
            '2',
            'Mongoose lean() plus a single find({ _id: { $in: ids } }).',
          ],
        ]}
      />

      <Callout variant="tip" title="select and lean together">
        <p>
          List endpoints should end in <code>.select(...)</code> and{' '}
          <code>.lean()</code>. <code>.lean()</code> skips hydration into
          Mongoose documents, which on a 20-item list is a measurable fraction
          of total response time. Reserve full documents for writes and for
          endpoints whose response is edited in place.
        </p>
      </Callout>

      <h2>Search and menus</h2>

      <p>
        The menu endpoint filters on availability rather than hiding unavailable
        items client-side, so a sold-out bowl never reaches a cart. Sorting by{' '}
        <code>{'{ categoryId: 1, name: 1 }'}</code> groups the menu into the
        order a kitchen expects, backed by the compound index on the{' '}
        <code>FoodItem</code> schema.
      </p>

      <CodeBlock
        language="js"
        title="controllers/restaurantController.js"
        code={`export const getRestaurantMenu = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = {
    restaurantId: req.params.id,
    isAvailable: true,
  };
  if (category) query.categoryId = category;

  const menu = await FoodItem.find(query)
    .populate('categoryId', 'name')
    .sort({ categoryId: 1, name: 1 });

  res.json({ success: true, data: { menu } });
});`}
      />

      <p>
        The status endpoint exists separately from the detail endpoint on
        purpose. A customer app that polls whether a restaurant is still open
        every thirty seconds should not be re-fetching the full restaurant
        document each time.
        <code>GET /:id/status</code> projects three fields, returns in a
        millisecond, and is trivially cacheable.
      </p>

      <h2>Owner endpoints</h2>

      <p>
        Every owner route resolves the restaurant from <code>ownerId</code>{' '}
        rather than accepting an id. That single line is what stops one
        restaurant owner editing another restaurant&rsquo;s menu.
      </p>

      <CodeBlock
        language="js"
        title="Ownership is always resolved, never asserted"
        code={`export const createRestaurant = asyncHandler(async (req, res) => {
  const existingRestaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (existingRestaurant) {
    return res.status(400).json({
      success: false,
      message: 'You already have a restaurant registered',
    });
  }

  // ownerId comes from the token, never from req.body. Even if a client posts
  // { ownerId: "<someone else>" }, this assignment happens after the spread
  // and therefore wins.
  const restaurant = await Restaurant.create({
    ...req.body,
    ownerId: req.user.id,
  });

  await User.findByIdAndUpdate(req.user.id, {
    restaurantProfile: {
      restaurantId: restaurant._id,
      roleInRestaurant: 'owner',
      permissions: ['menu_management', 'order_management', 'finance', 'settings'],
    },
  });

  res.status(201).json({
    success: true,
    message: 'Restaurant created successfully',
    data: { restaurant },
  });
});`}
      />

      <Callout variant="note" title="Why one restaurant per owner">
        <p>
          The <code>{'findOne({ ownerId })'}</code> guard is a deliberate
          modelling choice. Supporting multiple restaurants per owner means{' '}
          <code>findOne</code> becomes <code>find</code> everywhere, ownership
          checks become a separate lookup, and every owner endpoint needs an{' '}
          <code>activeRestaurantId</code> in the request. One-to-one keeps all
          of that out of the codebase. Revisit it if multi-location operators
          become a real requirement — not before.
        </p>
      </Callout>

      <h2>Performance checklist</h2>

      <PropertyTable
        headers={['Concern', 'What NutriDeliver does']}
        rows={[
          [
            'Query shape',
            'Base predicate of isActive + isVerified on every public query; projections on every list.',
          ],
          [
            'Indexes',
            '2dsphere on coordinates, plus singles on cuisineType, isOpen, and rating.',
          ],
          [
            'N+1',
            'Avoided with $lookup or $facet; never a query inside a loop.',
          ],
          [
            'Pagination',
            'page/limit capped at 50, with a parallel countDocuments.',
          ],
          [
            'Sort',
            'Validated against a Joi allow-list before reaching MongoDB.',
          ],
          [
            'Caching',
            'Catalogue reads are the obvious candidates for the middleware/cache.js layer.',
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/cart-orders">Cart &amp; Order APIs</a> —
        where the catalogue becomes a purchase, and where the pricing rules that
        decide what a customer actually pays are enforced.
      </p>
    </>
  )
}

export function BackendCartOrders() {
  return (
    <>
      <p>
        This is the chapter where NutriDeliver becomes a business. The cart is a
        convenience; the order is a financial record, a contract with three
        parties, and the thing every other subsystem reads. Two rules govern
        everything below: the server recomputes every price from source data,
        and an order moves only through legal state transitions. Break either
        and the platform loses money.
      </p>

      <h2>The restaurant-scoped cart</h2>

      <p>
        One cart per customer, belonging to exactly one restaurant. Adding an
        item from a different kitchen does not merge carts — it fails, with a
        message explaining why, and the customer clears or abandons the first
        cart. A merged cart is an order no single kitchen can prepare.
      </p>

      <PropertyTable
        headers={['Endpoint', 'Behaviour']}
        rows={[
          [
            'GET /api/cart',
            'Returns the cart, creating an empty one if needed. Items that became unavailable are pruned on read.',
          ],
          [
            'POST /api/cart/add',
            'Adds or increments an item. Rejects cross-restaurant adds. Recomputes totalAmount.',
          ],
          [
            'PUT /api/cart/update/:itemId',
            'Sets quantity. A quantity of zero or less removes the line.',
          ],
          [
            'DELETE /api/cart/remove/:itemId',
            'Removes the line; nulls restaurantId once the cart is empty.',
          ],
          [
            'DELETE /api/cart/clear',
            'Empties items, total, restaurant, and applied offer.',
          ],
          [
            'POST /api/cart/apply-offer',
            'Validates and attaches a discount, returning the new final amount.',
          ],
        ]}
      />

      <CodeBlock
        language="js"
        title="controllers/cartController.js — the restaurant-scope guard"
        code={`export const addToCart = asyncHandler(async (req, res) => {
  const { foodItemId, quantity = 1, specialInstructions } = req.body;

  const foodItem = await FoodItem.findOne({
    _id: foodItemId,
    isAvailable: true,
  }).populate('restaurantId');

  if (!foodItem) {
    return res.status(404).json({
      success: false,
      message: 'Food item not found or unavailable',
    });
  }

  let cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      userId: req.user.id,
      restaurantId: foodItem.restaurantId._id,
      items: [],
      totalAmount: 0,
    });
  }

  // The rule, in one conditional. An empty cart adopts the new restaurant;
  // a populated cart belonging to another kitchen is refused outright.
  if (
    cart.restaurantId &&
    cart.restaurantId.toString() !== foodItem.restaurantId._id.toString() &&
    cart.items.length > 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Your cart contains items from another restaurant. Please clear your cart first.',
    });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.foodItemId.toString() === foodItemId,
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].specialInstructions = specialInstructions;
  } else {
    cart.items.push({
      foodItemId,
      quantity,
      // Snapshot the price into the cart line so the displayed total does not
      // drift if the menu changes while the user is deciding.
      price: foodItem.price,
      specialInstructions,
    });
  }

  if (!cart.restaurantId) {
    cart.restaurantId = foodItem.restaurantId._id;
  }

  cart.totalAmount = cart.items.reduce(
    (total, item) => total + item.quantity * item.price,
    0,
  );

  await cart.save();
  await cart.populate('items.foodItemId', 'name price images calories');
  await cart.populate('restaurantId', 'name images');

  res.json({
    success: true,
    message: 'Item added to cart successfully',
    data: { cart },
  });
});`}
      />

      <Callout variant="note" title="The cart is a cache, the order is truth">
        <p>
          The cart&rsquo;s <code>totalAmount</code> and line prices exist so the
          customer sees a stable number while shopping. They are a convenience,
          not an authority — the same numbers are recomputed from{' '}
          <code>FoodItem</code> documents at order creation. Never charge
          against the cart&rsquo;s stored total.
        </p>
      </Callout>

      <h3>Carts self-heal on read</h3>

      <p>
        <code>GET /api/cart</code> prunes items whose food item has since been
        deleted or marked unavailable. A customer who left a tab open overnight
        should not return to a cart containing something the kitchen no longer
        makes — and should find out before checkout, not during it.
      </p>

      <h2>Creating an order</h2>

      <p>
        <code>POST /api/orders</code> is the most important controller in the
        codebase. It performs six validations, recomputes the entire price from
        scratch, writes an immutable snapshot, clears the cart, and updates
        denormalised counters. Each step exists because skipping it is a
        specific, known failure.
      </p>

      <Steps>
        <Step title="Read the cart, not the request">
          <p>
            The order is built from the server&rsquo;s cart. The client&rsquo;s{' '}
            <code>items</code> array is not consulted — a client that sends
            <code>price: 0</code> gets nothing, because that field is never
            read.
          </p>
        </Step>

        <Step title="Reject the empty cart">
          <p>
            A 400 with <code>Cart is empty</code>. Some code paths reach the
            order endpoint with nothing to buy.
          </p>
        </Step>

        <Step title="Re-check every item&rsquo;s availability">
          <p>
            The cart may be hours old. Naming the specific item in the message
            (&ldquo;Item &lsquo;Protein Bowl&rsquo; is no longer
            available&rdquo;) turns an opaque failure into something the
            customer can act on.
          </p>
        </Step>

        <Step title="Check the restaurant is active, verified, and open">
          <p>
            All three, in that order. An unverified restaurant is not a
            business-rule violation — it is not yet on the platform at all.
          </p>
        </Step>

        <Step title="Enforce the minimum order and the delivery radius">
          <p>
            From <code>deliverySettings</code>, with the same defaults the
            catalogue uses so a restaurant with unset settings behaves
            consistently everywhere.
          </p>
        </Step>

        <Step title="Recompute the totals, then write">
          <p>
            Never trust the client. Never trust the cart&rsquo;s stored total.
            Then clear the cart and increment the offer&rsquo;s usage count.
          </p>
        </Step>
      </Steps>

      <CodeBlock
        language="js"
        title="controllers/orderController.js — validation block"
        code={`export const createOrder = asyncHandler(async (req, res) => {
  const { deliveryAddress, paymentMethod, specialInstructions } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.foodItemId')
    .populate('restaurantId');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  for (const item of cart.items) {
    if (!item.foodItemId.isAvailable) {
      return res.status(400).json({
        success: false,
        message: \`Item "\${item.foodItemId.name}" is no longer available\`,
      });
    }
  }

  const restaurant = cart.restaurantId;
  if (!restaurant.isActive || !restaurant.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is not available for orders',
    });
  }
  if (!restaurant.isOpen) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is currently closed',
    });
  }

  const minOrderAmount = restaurant.deliverySettings?.minOrderAmount || 15;
  if (cart.totalAmount < minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: \`Minimum order amount is $\${minOrderAmount}\`,
    });
  }

  if (deliveryAddress.coordinates?.lat && deliveryAddress.coordinates?.lng) {
    const distance = calculateDistance(
      restaurant.contact.address.coordinates.lat,
      restaurant.contact.address.coordinates.lng,
      deliveryAddress.coordinates.lat,
      deliveryAddress.coordinates.lng,
    );
    const deliveryRadius = restaurant.deliverySettings?.deliveryRadius || 10;

    if (distance > deliveryRadius) {
      return res.status(400).json({
        success: false,
        message:
          \`Delivery address is outside the restaurant's delivery radius (\${deliveryRadius}km)\`,
      });
    }
  }`}
      />

      <h3>Recomputing the price</h3>

      <p>
        This is the block that decides what the customer pays. Every number
        comes from a database document or a restaurant setting — nothing comes
        from the request.
      </p>

      <CodeBlock
        language="js"
        title="controllers/orderController.js — totals and snapshot"
        code={`  // ── Totals, computed server-side from source records ──────────────
  const TAX_RATE = 0.1;

  const orderTotal = cart.totalAmount;
  const deliveryFee = restaurant.deliverySettings?.deliveryFee || 2.99;
  const tax = orderTotal * TAX_RATE;
  const discountAmount = cart.appliedOffer?.discountAmount || 0;
  const grandTotal = orderTotal + deliveryFee + tax - discountAmount;

  const order = await Order.create({
    userId: req.user.id,
    restaurantId: cart.restaurantId._id,

    // The snapshot. Name and price are copied in at purchase time, so a menu
    // edit tomorrow cannot rewrite what this order was.
    items: cart.items.map((item) => ({
      foodItemId: item.foodItemId._id,
      name: item.foodItemId.name,
      quantity: item.quantity,
      price: item.price,
      specialInstructions: item.specialInstructions,
    })),

    orderTotal,
    deliveryFee,
    tax,
    grandTotal,

    deliveryAddress,
    paymentMethod,
    specialInstructions,
    appliedOffer: cart.appliedOffer,

    estimatedDelivery: new Date(
      Date.now() +
        (restaurant.deliverySettings?.estimatedDeliveryTime || 30) * 60 * 1000,
    ),
  });

  // Clear the cart only after the order is durably written. Doing this first
  // means a failed insert loses the customer's basket.
  await Cart.findOneAndUpdate(
    { userId: req.user.id },
    { items: [], totalAmount: 0, restaurantId: null, appliedOffer: null },
  );

  if (cart.appliedOffer) {
    await Offer.findByIdAndUpdate(cart.appliedOffer.offerId, {
      $inc: { usedCount: 1 },
    });
  }

  for (const item of cart.items) {
    await FoodItem.findByIdAndUpdate(item.foodItemId._id, {
      $inc: { totalOrders: item.quantity },
    });
  }

  await order.populate('restaurantId', 'name contact');
  await order.populate('items.foodItemId', 'name images');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
});`}
      />

      <Callout
        variant="danger"
        title="The total is never accepted from the client"
      >
        <p>
          <code>POST /api/orders</code> does not read a <code>total</code>, a{' '}
          <code>price</code>, or a <code>discount</code> from the request body
          at all. This is not a style preference. A client that posts{' '}
          <code>{'{ grandTotal: 0 }'}</code> and receives a real order is a
          total loss for every order placed — the most common exploit in any
          food-delivery codebase.
        </p>
      </Callout>

      <PropertyTable
        headers={['Field', 'Source', 'Notes']}
        rows={[
          [
            'orderTotal',
            'Sum of cart line price × quantity',
            'Line prices were snapshotted when the item was added.',
          ],
          [
            'deliveryFee',
            'restaurant.deliverySettings.deliveryFee',
            'Default 2.99 when unset.',
          ],
          [
            'tax',
            'orderTotal × TAX_RATE',
            '10% on food, not on the delivery fee.',
          ],
          [
            'discountAmount',
            'cart.appliedOffer.discountAmount',
            'Set by offer validation, never by the client.',
          ],
          [
            'grandTotal',
            'orderTotal + deliveryFee + tax − discount',
            'The exact figure Stripe will charge, in dollars.',
          ],
        ]}
      />

      <h2>The order state machine</h2>

      <p>
        Orders move through eight states. Which transitions are legal is
        declared once, as a map, in the model — so the restaurant controller,
        the rider controller, the auto-cancel job, and the admin override all
        enforce the same rules.
      </p>

      <CodeBlock
        language="js"
        title="models/Order.js"
        code={`const validStatusTransitions = {
  pending:           ['confirmed', 'cancelled'],
  confirmed:         ['preparing', 'cancelled'],
  preparing:         ['ready_for_pickup', 'cancelled'],
  ready_for_pickup:  ['pickedup', 'cancelled'],
  pickedup:          ['out_for_delivery', 'cancelled'],
  out_for_delivery:  ['delivered', 'cancelled'],
  delivered:         [],   // terminal
  cancelled:         [],   // terminal
};

orderSchema.methods.canTransitionTo = function (newStatus) {
  const allowedTransitions = validStatusTransitions[this.status] || [];
  return allowedTransitions.includes(newStatus);
};`}
      />

      <Diagram caption="Who drives each transition, and what the guard is">
        {`
  customer                restaurant            rider             system
     │                       │                   │                  │
     │ POST /orders          │                   │                  │
     ├──────────────────────▶│                   │                  │
     │     status: pending   │                   │                  │
     │                       │                   │                  │
     │            POST .../respond {accept}     │                  │
     │                       ├──────────────────▶│                  │
     │                       │  → confirmed      │                  │
     │                       │                   │                  │
     │                       │ PUT .../status    │                  │
     │◀──────────────────────┤  → preparing      │                  │
     │◀──────────────────────┤  → ready_for_pickup                  │
     │                       │                   │                  │
     │                       │            POST .../accept           │
     │                       │                   ├─────────────────▶│
     │◀──────────────────────┤◀──────────────────┤  → pickedup      │
     │                       │                   │                  │
     │◀──────────────────────┤                   │ confirm-pickup   │
     │                       │                   ├─────────────────▶│
     │◀──────────────────────┤                   │ → out_for_delivery
     │◀──────────────────────┤                   │ confirm-delivery │
     │                       │                   ├─────────────────▶│
     │◀──────────────────────┤                   │ → delivered      │
     │                       │                   │                  │
     │ POST .../rate         │                   │                  │

  Any non-terminal state → cancelled, by customer, restaurant,
  admin, or the auto-cancel job. Terminal states accept nothing.
`}
      </Diagram>

      <CodeBlock
        language="js"
        title="controllers/orderController.js — enforcing a transition"
        code={`export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  // Ownership AND current state are both in the query. The restaurant cannot
  // touch another kitchen's order, and this is the read that the transition
  // check is performed against.
  const order = await Order.findOne({
    _id: orderId,
    restaurantId: restaurant._id,
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (!order.canTransitionTo(status)) {
    return res.status(400).json({
      success: false,
      message: \`Invalid status transition from \${order.status} to \${status}\`,
    });
  }

  order.status = status;
  order.statusHistory.push({
    status,
    changedBy: req.user.id,
    changedByRole: req.user.role,
    timestamp: new Date(),
  });

  if (status === 'ready_for_pickup') {
    order.deliveryDetails.estimatedPickupTime = new Date();
  } else if (status === 'preparing') {
    order.preparationTime =
      restaurant.deliverySettings?.estimatedDeliveryTime || 20;
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order },
  });
});`}
      />

      <Callout variant="tip" title="Record who moved it, not just what">
        <p>
          Every write to <code>status</code> appends an entry to{' '}
          <code>statusHistory</code> with the status, the actor, the role, and a
          timestamp. When a customer disputes &ldquo;the restaurant never
          accepted my order&rdquo;, the audit trail answers it without a single
          log rotation. Push the same append into the state-change helper so the
          rider path records it too.
        </p>
      </Callout>

      <h3>Atomic transitions, not read-then-write</h3>

      <p>
        Rider acceptance is the one place a naive read-then-write loses a race.
        Two riders tap accept in the same second; both read the order as
        unassigned; both write. The guard is to put the expected state in the
        query so the database itself resolves the race.
      </p>

      <CodeBlock
        language="js"
        title="controllers/orderController.js — compare-and-set via findOneAndUpdate"
        code={`export const acceptOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // The filter IS the lock. If a rider already claimed the order, the
  // 'deliveryDetails.riderId': { $exists: false } clause no longer matches,
  // the update matches zero documents, and order is null.
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: 'ready_for_pickup',
      'deliveryDetails.riderId': { $exists: false },
    },
    {
      'deliveryDetails.riderId': req.user.id,
      'deliveryDetails.assignedAt': new Date(),
      status: 'pickedup',
    },
    { new: true },
  );

  if (!order) {
    return res.status(400).json({
      success: false,
      message: 'Order not available for delivery',
    });
  }

  await User.findByIdAndUpdate(req.user.id, {
    'riderProfile.availabilityStatus.status': 'busy',
  });

  res.json({
    success: true,
    message: 'Order accepted successfully',
    data: { order },
  });
});`}
      />

      <Callout
        variant="warning"
        title="The same technique closes every rider race"
      >
        <p>
          <code>confirm-pickup</code>, <code>confirm-delivery</code>, and{' '}
          <code>location</code> all follow the same shape:{' '}
          <code>
            {
              "{ _id, 'deliveryDetails.riderId': req.user.id, status: expected }"
            }
          </code>{' '}
          as the filter, the change as the update. A rider who has already
          confirmed delivery cannot confirm it again, and cannot update the
          location of an order that is no longer theirs.
        </p>
      </Callout>

      <h2>Cancellation</h2>

      <p>
        Customer cancellation is deliberately narrower than the state machine.
        The map allows cancellation from any non-terminal state, but a customer
        should not be able to cancel an order a rider is already physically
        carrying. The controller narrows the window to the states where nothing
        has happened yet.
      </p>

      <CodeBlock
        language="js"
        title="controllers/orderController.js"
        code={`export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id,
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Narrower than validTransitions on purpose: past 'confirmed' the food is
  // being made and the customer must call instead.
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage',
    });
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    changedBy: req.user.id,
    changedByRole: req.user.role,
    reason: 'Cancelled by customer',
    timestamp: new Date(),
  });

  await order.save();

  // Refund if the payment already settled — see backend/payments.
  if (order.paymentStatus === 'paid') {
    await refundOrderPayment(order, 'Customer cancellation');
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order },
  });
});`}
      />

      <p>
        A restaurant rejection follows a different path:{' '}
        <code>respondToOrder</code> sets <code>cancelled</code> directly on a{' '}
        <code>pending</code> order and appends the reason to the order&rsquo;s
        instructions, which is why rejections are explained to the customer
        through the order record rather than a notification the customer may
        never open.
      </p>

      <h3>The auto-cancel timer</h3>

      <p>
        An order sitting in <code>ready_for_pickup</code> with no rider is the
        single most common failure mode in a delivery marketplace. A scheduled
        job every five minutes cancels anything older than ten minutes. The
        detail is in <a href="/docs/backend/background-jobs">Background Jobs</a>
        .
      </p>

      <h2>Rating</h2>

      <p>
        Rating is the only place a customer writes to another party&rsquo;s
        record. Two constraints make it safe: the order must belong to the
        caller and must be <code>delivered</code>, and the restaurant&rsquo;s
        average is a running mean rather than a recomputed sum.
      </p>

      <CodeBlock
        language="js"
        title="controllers/orderController.js"
        code={`export const rateOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { rating, review } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
    });
  }

  // status: 'delivered' in the query means an undelivered order is
  // indistinguishable from a nonexistent one — same 404, no information leak.
  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id,
    status: 'delivered',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or not delivered',
    });
  }

  order.rating = rating;
  order.review = review;
  await order.save();

  if (rating) {
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      const newTotalReviews = restaurant.totalReviews + 1;
      const newRating =
        ((restaurant.rating * restaurant.totalReviews) + rating) / newTotalReviews;

      restaurant.rating = parseFloat(newRating.toFixed(1));
      restaurant.totalReviews = newTotalReviews;
      await restaurant.save();
    }
  }

  res.json({
    success: true,
    message: 'Order rated successfully',
    data: { order },
  });
});`}
      />

      <Callout variant="note" title="Guard re-rating">
        <p>
          The controller above overwrites an existing rating. Add{' '}
          <code>{'order.rating: { $exists: false }'}</code> to the query, or a
          customer can rate the same delivery repeatedly and inflate or deflate
          a restaurant&rsquo;s score at will.
        </p>
      </Callout>

      <h2>Reading orders across roles</h2>

      <p>
        <code>GET /api/orders/:orderId</code> is the one endpoint every role
        calls. Rather than four near-identical routes, the ownership constraint
        is added to the query by role — and an admin falls through with no extra
        clause, which is the intended behaviour.
      </p>

      <CodeBlock
        language="js"
        title="controllers/orderController.js"
        code={`export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  let query = { _id: orderId };

  if (req.user.role === 'user') {
    query.userId = req.user.id;
  } else if (req.user.role === 'restaurant') {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (restaurant) query.restaurantId = restaurant._id;
  } else if (req.user.role === 'rider') {
    query.riderId = req.user.id;
  }
  // admin: no constraint — deliberate.

  const order = await Order.findOne(query)
    .populate('restaurantId', 'name images contact operatingHours')
    .populate('items.foodItemId', 'name images price calories')
    .populate('userId', 'profile firstName lastName phone')
    .populate('riderId', 'profile firstName lastName phone riderProfile');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.json({ success: true, data: { order } });
});`}
      />

      <p>
        One subtlety worth noting: riders are assigned under{' '}
        <code>deliveryDetails.riderId</code>, while this query filters on a
        top-level <code>riderId</code>. Align the two — either add{' '}
        <code>'deliveryDetails.riderId'</code> to the rider branch, or keep a
        mirrored top-level field updated on assignment — or a rider will 404 on
        the order they are actively delivering.
      </p>

      <h2>Rules to carry into the tests</h2>

      <PropertyTable
        headers={['Rule', 'Test that proves it']}
        rows={[
          [
            'Totals are server-computed',
            'POST an order with no body total; assert grandTotal equals the documented formula.',
          ],
          [
            'Cart cleared only after success',
            'Force Order.create to throw; assert the cart is still populated.',
          ],
          [
            'Cross-restaurant cart is refused',
            'Add item A, then item B; expect 400 and an unchanged cart.',
          ],
          [
            'Illegal transitions rejected',
            'PUT status: delivered on a pending order; expect 400.',
          ],
          [
            'Rider accept is exclusive',
            'Two concurrent accepts; exactly one succeeds.',
          ],
          [
            'Rating is owner-scoped',
            'User B rates user A’s delivered order; expect 404.',
          ],
          [
            'Offer usage is counted once',
            'Order with an offer, assert usedCount incremented exactly once.',
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/payments">Payments with Stripe</a> — the
        order exists, but nothing has been paid yet, and the order must not be
        treated as confirmed until the payment provider says so.
      </p>
    </>
  )
}

export function BackendPayments() {
  return (
    <>
      <p>
        Every other subsystem in NutriDeliver can be rebuilt in a week. Payments
        cannot, and the mistakes made here are not recoverable by a deploy. This
        chapter is about one principle applied relentlessly: the client&rsquo;s
        report that a payment succeeded is a hint, and Stripe&rsquo;s webhook is
        the fact. Everything else — idempotency keys, signature verification,
        the raw-body problem — is machinery in service of that one idea.
      </p>

      <h2>Why PaymentIntents</h2>

      <p>
        Stripe offers several payment flows. NutriDeliver uses{' '}
        <strong>PaymentIntents</strong> because they model the actual lifecycle
        of a card charge: it is created, it requires a payment method, it is
        confirmed, it succeeds or fails, and it can later be captured or
        refunded. A single object tracks that entire sequence, and it is
        idempotent under retries.
      </p>

      <PropertyTable
        headers={['Approach', 'Why not', 'What to use instead']}
        rows={[
          [
            'Charges API',
            'No place to hold a pending authorisation. Failed cards require a new charge, and double charges are trivial.',
            'PaymentIntents',
          ],
          [
            'Checkout Sessions',
            'Redirects the customer off-app. Correct for one-off SaaS, wrong for an in-app marketplace checkout.',
            'PaymentIntents + Stripe SDK',
          ],
          [
            'Client-only confirmation',
            'The client decides whether it paid. Tapping is not payment.',
            'Webhook as source of truth',
          ],
        ]}
      />

      <h2>Creating the intent</h2>

      <p>
        The amount always comes from the stored order, and the order query is
        scoped to the caller with <code>paymentStatus: 'pending'</code> — so a
        second intent cannot be created for an order that is already being paid.
      </p>

      <CodeBlock
        language="js"
        title="controllers/paymentController.js"
        code={`import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    userId: req.user.id,
    paymentStatus: 'pending',
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found or already processed',
    });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    // Dollars in your database, cents on the wire. Round before converting, or
    // 10.005 becomes 1000 cents and you have undercharged a cent.
    amount: Math.round(order.grandTotal * 100),
    currency: 'usd',

    // The link back. The webhook reads metadata.orderId and knows exactly
    // which order this charge belongs to — no client-supplied order id is
    // trusted anywhere.
    metadata: {
      orderId: order._id.toString(),
      userId: req.user.id,
    },

    automatic_payment_methods: { enabled: true },
  });

  res.json({
    success: true,
    data: {
      // clientSecret goes to the app; the secret key never leaves the server.
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
});`}
      />

      <Callout variant="danger" title="Never accept an amount from the client">
        <p>
          <code>createPaymentIntent</code> reads only <code>orderId</code>. The
          amount is looked up from the order document. The Swagger annotation in
          the repository documents an <code>amount</code> parameter — treat that
          as a documentation bug to fix, not a field to honour. A controller
          that accepts a client amount is a controller that lets a customer pay
          one cent for a forty-dollar order.
        </p>
      </Callout>

      <h2>Confirming, and why it is not enough</h2>

      <p>
        The confirm endpoint re-reads the intent from Stripe and checks its
        status before marking the order paid. That is a meaningful improvement
        over trusting the client&rsquo;s callback, and it is still only a
        convenience path — the app calls it so the user gets an immediate answer
        instead of waiting for the webhook to arrive.
      </p>

      <CodeBlock
        language="js"
        title="controllers/paymentController.js"
        code={`export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, orderId } = req.body;

  // Retrieve from Stripe rather than believing the request. A caller could
  // send the id of a payment they made for a different, smaller order.
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed',
    });
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, userId: req.user.id },
    { paymentStatus: 'paid', status: 'confirmed' },
    { new: true },
  );

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.json({
    success: true,
    message: 'Payment confirmed successfully',
    data: { order },
  });
});`}
      />

      <Callout
        variant="warning"
        title="This endpoint bypasses the state machine"
      >
        <p>
          Setting <code>status: 'confirmed'</code> directly skips the{' '}
          <code>canTransitionTo</code> check that{' '}
          <a href="/docs/backend/cart-orders">Cart &amp; Order APIs</a> enforces
          everywhere else. It works because <code>pending → confirmed</code> is
          legal, but the guarantee is accidental. Push this through the same
          transition helper the restaurant controller uses, and append to{' '}
          <code>statusHistory</code> so the audit trail is complete.
        </p>
      </Callout>

      <h2>The webhook is the source of truth</h2>

      <p>
        Between the card being charged and the webhook arriving there is a
        window of seconds to minutes. During it the order is genuinely unpaid no
        matter what the app displays. Design for that: the client should show a
        &ldquo;confirming payment&rdquo; state and poll, and the webhook should
        be the only thing that moves the order forward.
      </p>

      <Diagram caption="Why the client callback cannot be the source of truth">
        {`
   customer app                Stripe                 your API
       │                          │                      │
       │  create-intent           │                      │
       ├───────────────────────────────────────────────▶│
       │                          │                      │
       │                          │◀── PaymentIntent ────┤
       │  clientSecret            │                      │
       │◀───────────────────────────────────────────────┤
       │                          │                      │
       │  confirm with card  ───────────────────────────▶│
       │                          │                      │
       ├── the app can crash here ──╳                     │
       │  the network can drop   ──╳                     │
       │  the user can background ─╳                     │
       │                          │                      │
       │                          │  payment_intent.     │
       │                          │  succeeded           │
       │                          ├─────────────────────▶│
       │                          │                      │ ← the fact
       │                          │                      │
       │◀────── poll ────────────────────────────────────┤
       │      "paid"                                      │

   The webhook arrives whether or not the app is alive.
   That is the entire argument.
`}
      </Diagram>

      <h3>The raw-body gotcha</h3>

      <p>
        This is the single most common reason a Stripe webhook returns{' '}
        <code>400 No signatures found</code> in a codebase that otherwise looks
        correct. <code>stripe.webhooks.constructEvent</code> verifies an HMAC
        signature computed over the <em>exact bytes</em> of the request body. If{' '}
        <code>express.json()</code> has already parsed that body, the original
        bytes are gone — re-serialising produces different whitespace, different
        key ordering, and a signature that does not match.
      </p>

      <CodeBlock
        language="js"
        title="server.js — the webhook must be mounted BEFORE express.json()"
        code={`import express from 'express'
import { webhookHandler } from './controllers/paymentController.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL?.split(','), credentials: true }))

// ── Must be registered before express.json() ─────────────────────────────
// express.raw() leaves req.body as a Buffer so the exact bytes Stripe signed
// are preserved. Mounting this any later means the body has already been
// parsed and signature verification can never succeed.
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler,
)

// Everything below this line gets parsed JSON.
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/payments', paymentRoutes)`}
      />

      <Callout variant="danger" title="Order of registration is load-bearing">
        <p>
          Middleware matches in registration order. Move the webhook route below{' '}
          <code>app.use(express.json())</code> and the endpoint stops working —
          silently, because a 400 from signature verification looks like a
          Stripe configuration problem rather than a middleware ordering one.
          Put it in a test the moment you add it.
        </p>
      </Callout>

      <h3>Verifying and handling events</h3>

      <CodeBlock
        language="js"
        title="controllers/paymentController.js — the webhook"
        code={`export const webhookHandler = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing signature' });
  }

  let event;
  try {
    // req.body is a Buffer because of express.raw(). constructEvent throws
    // if the signature does not match — that is the security check.
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    // Do not leak the reason — it tells an attacker whether they were close.
    return res.status(400).json({ success: false, message: \`Webhook error: \${err.message}\` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const { orderId } = intent.metadata;

      await Order.findOneAndUpdate(
        { _id: orderId },
        {
          paymentStatus: 'paid',
          paymentIntentId: intent.id,
          status: 'confirmed',
          statusHistory: {
            status: 'confirmed',
            changedByRole: 'system',
            reason: 'payment_intent.succeeded',
            timestamp: new Date(),
          },
        },
      );

      await createNotification(
        intent.metadata.userId,
        'Payment received',
        'Your payment was successful.',
        'payment',
        { orderId },
      );
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      await Order.findOneAndUpdate(
        { _id: intent.metadata.orderId },
        { paymentStatus: 'failed' },
      );
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      await Order.findOneAndUpdate(
        { paymentIntentId: charge.payment_intent },
        { paymentStatus: 'refunded' },
      );
      break;
    }

    default:
      // Acknowledge everything. A webhook that returns non-2xx is retried by
      // Stripe for three days, and an unhandled event type is not an error.
      logger.info(\`Unhandled Stripe event: \${event.type}\`);
  }

  // 200 fast. Do the slow work after acknowledging, or Stripe will time out
  // and deliver the event again.
  res.json({ received: true });
};`}
      />

      <PropertyTable
        headers={['Event', 'Order field', 'Also do']}
        rows={[
          [
            'payment_intent.succeeded',
            'paymentStatus → paid, status → confirmed',
            'Notify the customer and the restaurant; kick off preparation.',
          ],
          [
            'payment_intent.payment_failed',
            'paymentStatus → failed',
            'Notify the customer so they can retry with another method.',
          ],
          [
            'charge.refunded',
            'paymentStatus → refunded',
            'Notify both parties; adjust restaurant earnings.',
          ],
          [
            'payment_intent.canceled',
            'paymentStatus → failed',
            'Release the pending order so it can be cancelled cleanly.',
          ],
          [
            'charge.dispute.created',
            'nothing automatic',
            'Flag the order for admin review — never auto-refund a dispute.',
          ],
        ]}
      />

      <h3>Idempotency</h3>

      <p>
        Stripe delivers at least once. The same{' '}
        <code>payment_intent.succeeded</code> can arrive twice — a network
        retry, a manual resend from the dashboard, a duplicate during a provider
        incident. Every handler above is written to be replay-safe: the order
        update is keyed on the order id and sets absolute values rather than
        incrementing counters. Store the event id and short-circuit on a repeat
        if you add any step that is not naturally idempotent.
      </p>

      <CodeBlock
        language="js"
        title="Webhook idempotency guard"
        code={`// A small collection of processed event ids. Stripe guarantees event.id
// is stable across deliveries, so it is the natural idempotency key.
const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true },
  type: String,
  processedAt: { type: Date, default: Date.now },
});

export const webhookHandler = async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  const seen = await ProcessedEvent.findOneAndUpdate(
    { eventId: event.id },
    { $setOnInsert: { eventId: event.id, type: event.type } },
    { upsert: true, new: true },
  );

  if (seen.processedAt < new Date(Date.now() - 1000)) {
    // Already handled on an earlier delivery.
    return res.json({ received: true, duplicate: true });
  }

  // …handle the event…

  res.json({ received: true });
};`}
      />

      <h2>Refunds</h2>

      <p>
        A refund needs an authorisation check before it needs Stripe code, and
        the permission model is per-order rather than per-role: an admin may
        refund anything; a restaurant may refund only its own orders.
      </p>

      <CodeBlock
        language="js"
        title="controllers/paymentController.js"
        code={`export const processRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // A restaurant is scoped to its own orders. An admin is not.
  if (req.user.role === 'restaurant') {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (
      !restaurant ||
      order.restaurantId.toString() !== restaurant._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this order',
      });
    }
  }

  const refund = await stripe.refunds.create({
    payment_intent: order.paymentIntentId,
    amount: Math.round(amount * 100),
    reason: 'requested_by_customer',
    metadata: { orderId: order._id.toString(), reason },
  });

  order.paymentStatus = 'refunded';
  await order.save();

  await createNotification(
    order.userId,
    'Refund processed',
    \`A refund of $\${amount} has been issued for your order.\`,
    'payment',
    { orderId: order._id.toString(), refundId: refund.id },
  );

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: { order },
  });
});`}
      />

      <Callout
        variant="warning"
        title="Store the PaymentIntent id on the order"
      >
        <p>
          The repository&rsquo;s refund controller has the Stripe call commented
          out, because the order document does not persist{' '}
          <code>paymentIntentId</code> yet — the webhook in this chapter writes
          it. Until that field exists there is nothing to refund against, so
          this is the first thing to fix if you are reading this as a checklist.
        </p>
      </Callout>

      <h2>Saved payment methods</h2>

      <p>
        Saving a card is attaching a PaymentMethod to a Stripe Customer and
        storing only the resulting ids locally. Card details never touch your
        server — PAN, expiry, and CVC exist only inside Stripe&rsquo;s vault.
        That is the entire security argument for using Stripe here, and it is
        also why you must not build a card form that posts raw details to
        Express.
      </p>

      <CodeBlock
        language="js"
        title="attaching and detaching payment methods"
        code={`export const addPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.body;

  const customer = await stripe.customers.create({
    email: req.user.email,
    metadata: { userId: req.user.id },
  });

  const method = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customer.id,
  });

  await User.findByIdAndUpdate(req.user.id, {
    stripeCustomerId: customer.id,
    savedPaymentMethods: [
      ...(req.user.savedPaymentMethods || []),
      { id: method.id, brand: method.card.brand, last4: method.card.last4 },
    ],
  });

  res.json({
    success: true,
    message: 'Payment method added successfully',
    data: { id: method.id, brand: method.card.brand, last4: method.card.last4 },
  });
});`}
      />

      <h2>Rate limiting and testing</h2>

      <PropertyTable
        headers={['Concern', 'Configuration']}
        rows={[
          [
            'Payment limiter',
            '30 requests per 15 minutes per IP, applied to all of /api/payments via router.use(paymentLimiter).',
          ],
          [
            'Test cards',
            '4242 4242 4242 4242 succeeds; 4000 0000 0000 9995 declines.',
          ],
          [
            'Local webhooks',
            'stripe listen --forward-to localhost:5000/api/payments/webhook',
          ],
          [
            'Signature secret',
            'stripe listen prints whsec_… — use it as STRIPE_WEBHOOK_SECRET.',
          ],
        ]}
      />

      <Steps>
        <Step title="Forward webhooks locally">
          <CodeBlock
            code={`stripe listen --forward-to localhost:5000/api/payments/webhook`}
          />
          <p>
            The CLI prints a signing secret. Put it in <code>.env</code> as{' '}
            <code>STRIPE_WEBHOOK_SECRET</code> — do not use the dashboard
            secret, which will not match locally forwarded events.
          </p>
        </Step>

        <Step title="Place an order and create an intent">
          <CodeBlock
            language="bash"
            code={`curl -X POST http://localhost:5000/api/payments/create-intent \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"orderId":"65f1c2a4e8b9d0123456789ab"}'`}
          />
        </Step>

        <Step title="Watch the webhook land">
          <p>
            The <code>stripe listen</code> terminal prints every event
            delivered. A <code>payment_intent.succeeded</code> should appear
            within a second or two of the test card being confirmed, and{' '}
            <code>paymentStatus</code> on the order should become{' '}
            <code>paid</code> without you doing anything.
          </p>
        </Step>

        <Step title="Replay it">
          <CodeBlock code={`stripe events resend evt_test_webhook_id`} />
          <p>
            If your idempotency guard is working, the order is unchanged and the
            response contains <code>duplicate: true</code>.
          </p>
        </Step>
      </Steps>

      <h2>The pre-launch checklist</h2>

      <PropertyTable
        headers={['Check', 'Why it matters']}
        rows={[
          [
            'Webhook route mounted before express.json()',
            'Otherwise signature verification can never pass.',
          ],
          [
            'constructEvent is called and errors are handled',
            'Skipping it accepts forged payment confirmations.',
          ],
          [
            'No secret key or client secret leaks to the client',
            'The client secret is safe to share; the secret key is not.',
          ],
          [
            'Amount always read from the order',
            'The only defence against paying one cent.',
          ],
          [
            'paymentIntentId persisted on the order',
            'Without it, refunds cannot be executed.',
          ],
          [
            'Webhook handlers are idempotent',
            'Stripe guarantees at-least-once delivery.',
          ],
          [
            'Test mode fully exercised before going live',
            'Decline paths are where production payment bugs live.',
          ],
        ]}
      />

      <Callout variant="danger" title="Never use live keys in development">
        <p>
          A leaked live secret key lets an attacker charge real cards to your
          account, and Stripe&rsquo;s key rotation is disruptive rather than
          instant. Keep <code>sk_live_</code> and{' '}
          <code>STRIPE_WEBHOOK_SECRET</code> in a secrets manager, scoped to the
          production deploy only.
        </p>
      </Callout>

      <p>
        Next: <a href="/docs/backend/offers">Offers &amp; Discounts</a> — the
        remaining piece of the pricing calculation, and a rich source of rules
        that must all be checked in one place.
      </p>
    </>
  )
}

export function BackendOffers() {
  return (
    <>
      <p>
        Discounts are where a marketplace loses money quietly. A code that
        applies to the wrong restaurant, is honoured after expiry, or is
        redeemed a thousand times when the limit was fifty, produces no error —
        just a shrinking margin and a confused finance team. The rule that keeps
        this safe is the same one that governs orders: the client may suggest a
        code, but every condition is re-evaluated server-side against current
        data.
      </p>

      <h2>The offer</h2>

      <PropertyTable
        headers={['Field', 'Type', 'Meaning']}
        rows={[
          [
            'code',
            'string, unique',
            'What the customer types. Stored and matched case-insensitively, upper-cased on write.',
          ],
          [
            'description',
            'string',
            'Customer-facing explanation: "20% off your first order".',
          ],
          [
            'discountType',
            "'percentage' | 'fixed'",
            'Whether discountValue is a percentage or an absolute amount.',
          ],
          [
            'discountValue',
            'number',
            'The percentage (0–100) or the flat amount in dollars.',
          ],
          [
            'maxDiscount',
            'number',
            'Ceiling for percentage offers. Without it, 20% off a $200 order is a $40 hole.',
          ],
          [
            'minOrderAmount',
            'number',
            'Subtotal below which the code is worthless. Checked against food subtotal, not grand total.',
          ],
          [
            'validFrom / validUntil',
            'Date',
            'The window. Both are checked on every validation, not cached.',
          ],
          [
            'usageLimit / usedCount',
            'number',
            'Total redemptions allowed, and how many have happened.',
          ],
          [
            'applicableCategories',
            'ObjectId[]',
            'Empty array means all categories.',
          ],
          [
            'applicableRestaurants',
            'ObjectId[]',
            'Empty array means all restaurants.',
          ],
          [
            'isActive',
            'boolean',
            'The admin kill switch. Independent of the date window.',
          ],
        ]}
      />

      <h2>Managing offers in the admin panel</h2>

      <p>
        Everything above is the rule set; this is the surface an operator
        actually uses to create and supervise those rules. The table
        deliberately shows the fields that answer &ldquo;can I trust this
        offer?&rdquo; — type, value, minimum, usage against limit, the date
        window, and status — so an operator can audit the whole portfolio
        without opening a single row.
      </p>

      <Screenshot
        src={offersImage}
        alt="The NutriDeliver admin Offer Management screen. A table lists offers with columns for Code, Title, Type, Value, Min Order, Usage, Validity, Status and Actions. Two active percentage offers are shown, each worth 10 percent, with a usage count of zero out of an unlimited limit and validity from Oct 11 to Oct 12, 2026."
        caption="Offer management. Every column exists to answer a specific operational question: is the scope right (Type, Min Order), is it still worth issuing (Validity, Status), and can it still be spent (Usage)."
      />

      <Callout
        variant="tip"
        title="Read the validity window as a date range, not a deadline"
      >
        <p>
          Showing <code>Oct 11 – Oct 12, 2026</code> rather than &ldquo;expires
          tomorrow&rdquo; keeps the row interpretable a week later. An operator
          scanning this table six days from now can still tell which offers are
          dead without opening each one.
        </p>
      </Callout>

      <h2>Listing offers</h2>

      <p>
        The public list is not an admin dump. It filters to active and currently
        valid offers, sorts by expiry so the ones about to die appear first, and
        applies the scope filters when a restaurant or category context is
        supplied.
      </p>

      <CodeBlock
        language="js"
        title="controllers/offerController.js"
        code={`export const getActiveOffers = asyncHandler(async (req, res) => {
  const { restaurantId, categoryId } = req.query;

  const query = {
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  };

  if (restaurantId) {
    // An empty applicableRestaurants array means "applies everywhere", which is
    // why $size: 0 is OR'd alongside the $in match rather than omitted.
    query.$or = [
      { applicableRestaurants: { $in: [restaurantId] } },
      { applicableRestaurants: { $size: 0 } },
    ];
  }

  if (categoryId) {
    query.$or = [
      { applicableCategories: { $in: [categoryId] } },
      { applicableCategories: { $size: 0 } },
    ];
  }

  const offers = await Offer.find(query).sort({ validUntil: 1 });

  res.json({ success: true, data: { offers } });
});`}
      />

      <Callout variant="warning" title="Two $or clauses cannot coexist">
        <p>
          The second <code>$or</code> overwrites the first — assigning{' '}
          <code>query.$or</code> twice means the restaurant filter is silently
          discarded when a category is also supplied. Build the scope as a
          single <code>$and</code> of named clauses, or accumulate into one{' '}
          <code>$or</code> array. This is a live bug in the controller above and
          a good illustration of why filters deserve tests.
        </p>
      </Callout>

      <h2>Validating a code</h2>

      <p>
        <code>POST /api/offers/validate</code> answers &ldquo;what would this
        code be worth?&rdquo; without committing anything. The customer types a
        code, the app asks what it is worth, and only if they proceed does{' '}
        <code>POST /api/cart/apply-offer</code> attach it. Six conditions must
        all hold, and each has a distinct failure message so the customer knows
        what to change.
      </p>

      <Steps>
        <Step title="The code exists, is active, and is inside its date window">
          <p>
            All three in one <code>findOne</code>. A code that exists but is
            inactive or expired is indistinguishable from one that never
            existed, which is correct — telling a customer &ldquo;this code
            expired&rdquo; confirms the code&rsquo;s existence and invites
            enumeration.
          </p>
        </Step>

        <Step title="The usage limit has not been reached">
          <p>
            Checked against the live <code>usedCount</code>, not against any
            cached figure. A limit of zero is treated as unlimited, so{' '}
            <code>usageLimit: null</code> means &ldquo;no limit&rdquo; rather
            than &ldquo;no uses&rdquo;.
          </p>
        </Step>

        <Step title="The subtotal meets the minimum">
          <p>
            Compared against the food subtotal, before delivery fee and tax. A
            customer should not unlock a discount by paying a large delivery
            fee, and minimum-order rules exist to protect the restaurant&rsquo;s
            margin on food preparation.
          </p>
        </Step>

        <Step title="The scope matches">
          <p>
            If the offer names specific restaurants, the cart&rsquo;s restaurant
            must be one of them. The same applies to categories and, where the
            model carries it, to individual food items.
          </p>
        </Step>

        <Step title="The user is eligible">
          <p>
            New-customer-only, first-N-orders, and per-user usage limits need a
            check against the user&rsquo;s order history. An offer intended for
            acquisition must not be redeemable by someone who has ordered fifty
            times.
          </p>
        </Step>

        <Step title="The discount is computed and capped">
          <p>
            Percentage offers are capped by <code>maxDiscount</code>; fixed
            offers are not, because a flat amount cannot exceed the order value.
            The result is clamped so a discount can never exceed the subtotal.
          </p>
        </Step>
      </Steps>

      <CodeBlock
        language="js"
        title="controllers/offerController.js — validateOffer"
        code={`export const validateOffer = asyncHandler(async (req, res) => {
  const { code, cartTotal, restaurantId } = req.body;

  const offer = await Offer.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });

  if (!offer) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired offer code',
    });
  }

  if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'This offer has reached its usage limit',
    });
  }

  if (cartTotal < offer.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: \`Minimum order amount of $\${offer.minOrderAmount} required\`,
    });
  }

  if (
    offer.applicableRestaurants.length > 0 &&
    !offer.applicableRestaurants.includes(restaurantId)
  ) {
    return res.status(400).json({
      success: false,
      message: 'This offer is not applicable to this restaurant',
    });
  }

  res.json({
    success: true,
    data: {
      valid: true,
      offer: {
        id: offer._id,
        code: offer.code,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        discountAmount: calculateDiscount(offer, cartTotal),
        minOrderAmount: offer.minOrderAmount,
        maxDiscount: offer.maxDiscount,
      },
    },
  });
});`}
      />

      <h2>Discount arithmetic</h2>

      <p>
        This function is small and it is the most security-relevant arithmetic
        in the catalogue. It should live in one module, be a pure function, and
        be unit-tested against the cases that make platforms lose money.
      </p>

      <CodeBlock
        language="js"
        title="utils/offerHelpers.js — extracted so it can be tested in isolation"
        code={`export const calculateDiscount = (offer, subtotal) => {
  if (!offer || subtotal <= 0) return 0;

  let discount;

  if (offer.discountType === 'percentage') {
    discount = (subtotal * offer.discountValue) / 100;

    // maxDiscount is the ceiling that stops 20% off from eating a large order.
    if (offer.maxDiscount && discount > offer.maxDiscount) {
      discount = offer.maxDiscount;
    }
  } else {
    discount = offer.discountValue;
  }

  // A discount can never exceed what is being discounted. Without this clamp,
  // a $50 fixed coupon on a $12 cart produces a negative total, which becomes
  // a refund the moment it reaches Stripe.
  discount = Math.min(discount, subtotal);

  // Round at the boundary. Money stored as a float with 12 decimal places is
  // a reconciliation problem three weeks from now.
  return Math.round(discount * 100) / 100;
};`}
      />

      <PropertyTable
        headers={['Offer', 'Subtotal', 'Result', 'Note']}
        rows={[
          ['20% off, max $10', '$40.00', '$8.00', 'Below the cap.'],
          [
            '20% off, max $10',
            '$120.00',
            '$10.00',
            'Cap applies. Without it this is a $24 hole.',
          ],
          [
            '$15 off',
            '$12.00',
            '$12.00',
            'Clamped to the subtotal; never negative.',
          ],
          ['$15 off', '$60.00', '$15.00', 'Flat offers ignore maxDiscount.'],
          ['10% off', '$0.00', '$0.00', 'Empty cart short-circuits.'],
        ]}
      />

      <h3>Why rounding happens once</h3>

      <p>
        Round at exactly one point — the moment the discount leaves the
        function. Rounding the tax, then the subtotal, then the total produces a
        result that differs by a cent from summing the displayed components, and
        customers who add up their receipts and email support is a bad afternoon
        for everyone. Store integers — cents, not dollars — if you want this to
        stop being a concern entirely.
      </p>

      <h2>Applying the offer to the cart</h2>

      <p>
        Validation and application are separate endpoints on purpose. Validating
        is free of side effects and safe to call on every keystroke; applying
        writes state and is called once, on confirmation. Both run the same
        checks, because a code can expire between the two.
      </p>

      <CodeBlock
        language="js"
        title="controllers/cartController.js — applyOfferToCart"
        code={`export const applyOfferToCart = asyncHandler(async (req, res) => {
  const { offerCode } = req.body;

  const cart = await Cart.findOne({ userId: req.user.id })
    .populate('items.foodItemId');

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const offer = await Offer.findOne({
    code: offerCode.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });

  if (!offer) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired offer code',
    });
  }

  if (cart.totalAmount < offer.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message:
        \`Minimum order amount of $\${offer.minOrderAmount} required for this offer\`,
    });
  }

  if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
    return res.status(400).json({
      success: false,
      message: 'This offer has reached its usage limit',
    });
  }

  const discountAmount = calculateDiscount(offer, cart.totalAmount);

  // The discount, not just the code, is snapshotted onto the cart. The offer may
  // be edited or deleted before checkout, and the order must still be priceable.
  cart.appliedOffer = {
    offerId: offer._id,
    code: offer.code,
    discountAmount,
  };

  await cart.save();

  res.json({
    success: true,
    message: 'Offer applied successfully',
    data: {
      cart,
      discount: discountAmount,
      finalAmount: cart.totalAmount - discountAmount,
    },
  });
});`}
      />

      <Callout
        variant="danger"
        title="The discount on the cart is a claim, not a fact"
      >
        <p>
          <code>cart.appliedOffer.discountAmount</code> is written by the
          client&rsquo;s flow. The order controller must recompute the discount
          from the offer document at order creation — code, minimum, usage
          limit, scope, and arithmetic — rather than trusting the stored number.
          That single change is the difference between a coupon system and an
          exploit.
        </p>
      </Callout>

      <h2>Redeeming: increment once, atomically</h2>

      <p>
        The redemption count is incremented in{' '}
        <a href="/docs/backend/cart-orders">createOrder</a>, after the order is
        durably written. That ordering matters: incrementing first means a
        failed order write burns a user&rsquo;s single-use coupon.
      </p>

      <CodeBlock
        language="js"
        title="Atomic redemption with a ceiling"
        code={`// The naive $inc lets a code with usageLimit 50 be redeemed by 60
// simultaneous checkouts. This form fails when the ceiling is reached, and the
// order is aborted rather than shipped for free.
const claimed = await Offer.findOneAndUpdate(
  {
    _id: cart.appliedOffer.offerId,
    isActive: true,
    validUntil: { $gte: new Date() },
    $expr: {
      $or: [
        { $eq: ['$usageLimit', null] },   // unlimited
        { $lt: ['$usedCount', '$usageLimit'] },
      ],
    },
  },
  { $inc: { usedCount: 1 } },
  { new: true },
);

if (!claimed) {
  // The code was exhausted between validation and checkout.
  return res.status(409).json({
    success: false,
    message: 'This offer has reached its usage limit',
  });
}`}
      />

      <p>
        A 409 is the correct code here: the request is valid, but it conflicts
        with the current state of the resource. See{' '}
        <a href="/docs/backend/api-design">API Design &amp; Routing</a> for why
        409 beats 400 for this case.
      </p>

      <h2>Admin management</h2>

      <CodeBlock
        language="js"
        title="controllers/offerController.js — duplicate code handling"
        code={`export const createOffer = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, validFrom, validUntil } = req.body;

  // Normalise on write so WELCOME10, welcome10, and " Welcome10 " cannot all
  // be created and all match at redemption time.
  const normalisedCode = code.trim().toUpperCase();

  const existingOffer = await Offer.findOne({ code: normalisedCode });
  if (existingOffer) {
    return res.status(409).json({
      success: false,
      message: 'Offer code already exists',
    });
  }

  const offer = await Offer.create({
    code: normalisedCode,
    description: req.body.description,
    discountType,
    discountValue,
    minOrderAmount: req.body.minOrderAmount || 0,
    maxDiscount: req.body.maxDiscount,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    usageLimit: req.body.usageLimit ?? null,
    applicableCategories: req.body.applicableCategories || [],
    applicableRestaurants: req.body.applicableRestaurants || [],
  });

  res.status(201).json({
    success: true,
    message: 'Offer created successfully',
    data: { offer },
  });
});`}
      />

      <Callout
        variant="tip"
        title="Always set maxDiscount on percentage offers"
      >
        <p>
          An admin creating &ldquo;50% off&rdquo; without a ceiling has created
          a liability equal to half of every order in scope. Make the field
          required in the Joi schema for <code>discountType: 'percentage'</code>
          , with a sensible default, rather than relying on the admin panel to
          remember.
        </p>
      </Callout>

      <h2>What to test</h2>

      <PropertyTable
        headers={['Case', 'Expected']}
        rows={[
          ['Percentage below cap', 'subtotal × value / 100'],
          ['Percentage above cap', 'Exactly maxDiscount'],
          [
            'Fixed discount larger than subtotal',
            'Clamped to subtotal; grandTotal never negative',
          ],
          [
            'Code one day before validFrom',
            '400 Invalid or expired offer code',
          ],
          [
            'Code one day after validUntil',
            '400 Invalid or expired offer code',
          ],
          [
            'usedCount equals usageLimit',
            '400 This offer has reached its usage limit',
          ],
          [
            'Offer scoped to another restaurant',
            '400 Not applicable to this restaurant',
          ],
          [
            'Two concurrent redemptions at the limit',
            'Exactly one succeeds; the other gets 409',
          ],
          [
            'Client posts a fabricated discountAmount',
            'Ignored; recomputed from the offer document',
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/uploads">File Uploads</a> — restaurant
        photography is what makes a healthy menu sell, and getting images into
        Cloudinary without leaving an upload directory full of orphans takes a
        little care.
      </p>
    </>
  )
}

export function BackendUploads() {
  return (
    <>
      <p>
        A food delivery app is a photography app with a cart attached.
        Restaurant imagery, menu shots, rider documents, and delivery proof all
        flow through the same pipeline, and that pipeline has three jobs: accept
        only what should be accepted, store it somewhere that survives a
        container restart, and transform it so a 4 MB phone photo does not
        arrive in a list view.
      </p>

      <h2>Memory or disk</h2>

      <p>
        Multer offers two storage engines and the choice matters more than it
        looks. NutriDeliver uses <strong>memory storage</strong>: files arrive
        as a <code>Buffer</code> in memory, are streamed straight to Cloudinary,
        and are never written to a local filesystem at all.
      </p>

      <Split
        left={{
          title: 'Disk storage',
          children: (
            <ul>
              <li>
                Streams to disk, so memory use stays flat regardless of file
                size.
              </li>
              <li>
                Needs a directory that exists, is writable, and is mounted on
                every instance.
              </li>
              <li>
                Leaves orphans when the process dies between receiving and
                uploading.
              </li>
              <li>
                Needs a second step to read the file back and send it to
                Cloudinary.
              </li>
              <li>
                Broken the moment you scale horizontally without shared volumes.
              </li>
            </ul>
          ),
        }}
        right={{
          title: 'Memory storage',
          children: (
            <ul>
              <li>
                Cloudinary accepts a Buffer directly — no temp file, no
                read-back.
              </li>
              <li>
                Nothing to clean up; a failed upload leaves nothing behind.
              </li>
              <li>Stateless, so any instance can serve any upload.</li>
              <li>
                Holds the file in memory for its lifetime, so file size limits
                are mandatory.
              </li>
              <li>With a 5 MB cap, memory pressure is negligible.</li>
            </ul>
          ),
        }}
      />

      <Callout
        variant="note"
        title="The repository currently uses disk storage"
      >
        <p>
          <code>middleware/upload.js</code> in NutriDeliver configures{' '}
          <code>multer.diskStorage</code> writing to <code>uploads/</code>. That
          is a fine starting point and it works locally, but it is the first
          thing to replace when you move to Cloudinary — otherwise the two
          storage layers are both in play and files land on local disk that
          nobody ever cleans up.
        </p>
      </Callout>

      <h2>The Cloudinary module</h2>

      <p>
        One module owns the Cloudinary configuration and exposes three verbs:
        upload, delete, and transform. Nothing outside this file imports the
        Cloudinary SDK, which means replacing the provider is one rewrite.
      </p>

      <CodeBlock
        language="js"
        title="utils/cloudinary.js"
        code={`import { v2 as cloudinary } from 'cloudinary';
import { promisify } from 'util';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadAsync = promisify(cloudinary.uploader.upload);
const destroyAsync = promisify(cloudinary.uploader.destroy);

export const uploadImage = async (buffer, options = {}) => {
  try {
    // Upload the Buffer directly — no temp file involved.
    const result = await uploadAsync(buffer, {
      resource_type: 'image',
      // quality: 'auto'      → Cloudinary picks per-image quality/size.
      // fetch_format: 'auto' → serves AVIF or WebP to clients that support
      //                        them, JPEG to the ones that do not.
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error) {
    // Never throw from an upload helper. A failed image should fail the
    // specific request, not take down a whole batch.
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await destroyAsync(publicId);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Transformations are applied at delivery time, not upload time. One stored
// original serves every size the app needs, with no re-upload and no storage cost.
export const optimizeImage = (publicId, width = 800, height = 600) =>
  cloudinary.url(publicId, {
    secure: true,
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });

export const createThumbnail = (publicId, width = 300, height = 200) =>
  cloudinary.url(publicId, {
    secure: true,
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });

// Turning a stored URL back into a publicId is what makes deletion possible.
export const extractPublicId = (url) => {
  const matches = url.match(/\\/upload\\/(?:v\\d+\\/)?([^.]+)/);
  return matches ? matches[1] : null;
};`}
      />

      <h2>The upload middleware</h2>

      <CodeBlock
        language="js"
        title="middleware/upload.js — memory storage, with a real allow-list"
        code={`import multer from 'multer';

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

// Memory storage: the file lands in req.file.buffer and nowhere else.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // The client's Content-Type header is attacker-controlled. This is a cheap
  // first gate, not a security boundary — see the sniffing note below.
  if (!ALLOWED.has(file.mimetype)) {
    return cb(new Error(\`Unsupported file type: \${file.mimetype}\`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB
    files: 5,
    fields: 12,
  },
});

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount) =>
  upload.array(fieldName, maxCount);

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files.' });
    }
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};`}
      />

      <Callout variant="warning" title="mimeType is a hint, not a verdict">
        <p>
          <code>req.file.mimetype</code> comes from the client&rsquo;s{' '}
          <code>Content-Type</code>, which anyone can set. A genuine defence
          sniffs the actual bytes — Cloudinary does this on upload, and rejects
          files it cannot decode as images. For the untrusted case (rider
          identity documents), verify server-side before storing.
        </p>
      </Callout>

      <h3>Limit everything, not just size</h3>

      <PropertyTable
        headers={['Limit', 'Recommended', 'What it prevents']}
        rows={[
          [
            'fileSize',
            '5 MB for images, 10 MB for documents',
            'Memory exhaustion from a single oversized upload.',
          ],
          ['files', '5 per request', 'Filling Cloudinary quota in one call.'],
          ['fields', '12', 'Field-injection into multipart payloads.'],
          ['parts', '20', 'Multipart smuggling with deep nesting.'],
        ]}
      />

      <h2>Transformation on upload</h2>

      <p>
        Cloudinary can resize, crop, and re-encode at upload time, which caps
        what you ever store, or at delivery time, which costs nothing extra and
        lets one original serve every screen size. NutriDeliver does both:
        normalisation at upload, responsive delivery at render.
      </p>

      <CodeBlock
        language="js"
        title="controllers — uploading to a per-entity folder"
        code={`import { uploadImage, deleteImage, extractPublicId } from '../utils/cloudinary.js';

export const uploadRestaurantImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No images uploaded' });
  }

  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  // Folder per entity means the Cloudinary media library stays navigable and
  // a whole restaurant can be purged with one prefix delete.
  const uploads = await Promise.all(
    req.files.map((file) =>
      uploadImage(file.buffer, {
        folder: \`nutrideliver/restaurants/\${restaurant._id}\`,
        // Normalise once, on the way in: cap the longest edge, strip metadata,
        // and let quality: auto pick the encoding.
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
        ],
        // Strips GPS coordinates and camera metadata from published images.
        // Restaurant photos routinely leak the exact location of the kitchen.
        phash: true,
      }),
    ),
  );

  const succeeded = uploads.filter((u) => u.success);
  const failed = uploads.filter((u) => !u.success);

  if (succeeded.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Image upload failed',
      errors: failed.map((f) => f.error),
    });
  }

  const images = [...restaurant.images, ...succeeded.map((u) => u.url)];

  await Restaurant.findByIdAndUpdate(restaurant._id, { images });

  res.json({
    success: true,
    message: \`\${succeeded.length} image(s) uploaded\`,
    data: {
      images,
      failedCount: failed.length,
    },
  });
});`}
      />

      <PropertyTable
        headers={['Entity', 'Folder', 'Largest edge', 'Notes']}
        rows={[
          [
            'User avatar',
            'nutrideliver/avatars',
            '512 px',
            'Square crop; replaces the previous avatar.',
          ],
          [
            'Restaurant images',
            'nutrideliver/restaurants/:id',
            '1600 px',
            'Up to 5 per request; gallery order preserved.',
          ],
          [
            'Food item images',
            'nutrideliver/food/:id',
            '1200 px',
            'First image is the card thumbnail.',
          ],
          [
            'Rider documents',
            'nutrideliver/riders/:id/docs',
            '2000 px',
            'Never publicly served; keep the folder private.',
          ],
          [
            'Delivery proof',
            'nutrideliver/proof/:orderId',
            '1200 px',
            'Timestamped; retained for dispute resolution.',
          ],
        ]}
      />

      <h2>Replacing an image without leaking one</h2>

      <p>
        When an owner changes their profile picture, the old file stays in
        Cloudinary unless you delete it. Across a few thousand avatar changes
        that is a few gigabytes of orphaned assets that nobody is paying for and
        nobody can find. The replacement pattern is upload-then-delete, in that
        order, so a failure never leaves a record pointing at a deleted file.
      </p>

      <CodeBlock
        language="js"
        title="Safe replacement"
        code={`export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file provided' });
  }

  const previousUrl = req.user.profile.avatar;

  // 1. Upload first. If this fails, nothing has changed.
  const uploaded = await uploadImage(req.file.buffer, {
    folder: \`nutrideliver/avatars/\${req.user._id}\`,
    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
  });

  if (!uploaded.success) {
    return res.status(400).json({ success: false, message: 'Upload failed' });
  }

  // 2. Point the record at the new asset.
  req.user.profile.avatar = uploaded.url;
  await req.user.save();

  // 3. Only now discard the old one, and only if it is one of ours.
  if (previousUrl?.includes('res.cloudinary.com')) {
    const oldPublicId = extractPublicId(previousUrl);
    if (oldPublicId) {
      await deleteImage(oldPublicId); // failure here is not fatal
    }
  }

  res.json({
    success: true,
    message: 'Avatar updated',
    data: { avatar: req.user.profile.avatar },
  });
});`}
      />

      <Callout variant="tip" title="Two assets during the transition window">
        <p>
          Deleting the old image immediately means a cached URL 404s for anyone
          whose client still holds it. On a 30-day Cloudinary transformation
          expiry the cost is negligible; on an aggressively short-lived edge
          cache it is a broken image in someone&rsquo;s profile. Pick a window
          deliberately.
        </p>
      </Callout>

      <h2>Security limits</h2>

      <p>
        Uploads are the most direct path to executing attacker-controlled
        content on a server, and the allow-list is the first of several layers.
      </p>

      <Steps>
        <Step title="Restrict the mime type with an explicit allow-list">
          <p>
            Not <code>startsWith('image/')</code> — that admits{' '}
            <code>image/svg+xml</code>, which is XML that can carry script. An
            explicit set of the formats you actually accept is the whole
            difference.
          </p>
        </Step>

        <Step title="Cap the file size and the file count">
          <p>
            Multer enforces both before the file is buffered, and the limits
            must be set in the middleware — not checked afterwards, by which
            point the memory is already spent.
          </p>
        </Step>

        <Step title="Strip metadata on upload">
          <p>
            EXIF carries GPS coordinates, device identifiers, and occasionally
            the name of the person who took the photo. Strip it at upload,
            before the asset is publicly addressable.
          </p>
        </Step>

        <Step title="Serve documents from a non-public folder">
          <p>
            A rider&rsquo;s licence is not a public image. Use{' '}
            <code>type: 'authenticated'</code> in the Cloudinary upload options
            and a signed URL, so the bytes require a server-issued token.
          </p>
        </Step>

        <Step title="Never derive a path from the original filename">
          <p>
            <code>../../etc/passwd</code> in a filename is the oldest upload bug
            there is. The disk-storage configuration in the repository derives
            paths from <code>file.fieldname</code> plus a random suffix, which
            is the right instinct — keep filenames out of the storage path
            entirely.
          </p>
        </Step>

        <Step title="Rate-limit the upload routes">
          <p>
            Upload endpoints are cheap to abuse and expensive to serve. Ten
            images a minute per authenticated user is generous for a real
            person.
          </p>
        </Step>
      </Steps>

      <PropertyTable
        headers={['Threat', 'Defence']}
        rows={[
          [
            'Malicious upload (polyglot, SVG script)',
            'Explicit mime allow-list; strip SVG; Cloudinary decodes and re-encodes.',
          ],
          [
            'Memory exhaustion via large files',
            'Multer limits.fileSize, enforced before buffering.',
          ],
          [
            'Path traversal via filename',
            'Random generated names; original filename never used as a path.',
          ],
          ['EXIF GPS leak', 'Strip metadata on upload.'],
          [
            'Orphan accumulation',
            'Delete the previous asset on replace; sweep by folder prefix periodically.',
          ],
          [
            'Private documents served publicly',
            'Authenticated resource type plus signed URLs.',
          ],
          ['Upload spam', 'Per-route rate limit plus per-user quota.'],
        ]}
      />

      <h2>Wiring it up</h2>

      <CodeBlock
        language="js"
        title="routes/restaurants.js"
        code={`router.post(
  '/restaurant/images',
  authenticate,
  authorize('restaurant', 'admin'),
  uploadMultiple('images', 5),
  handleUploadError,   // must follow the multer middleware
  uploadRestaurantImages,
);`}
      />

      <Callout
        variant="warning"
        title="handleUploadError must come after multer"
      >
        <p>
          Multer throws synchronously through the middleware chain. Its error
          handler has to be registered downstream of the multer instance for
          <code>LIMIT_FILE_SIZE</code> to be caught and turned into a 400. Put
          it upstream and oversized files fall through to the central error
          handler, which reports a 500 for what is a client mistake.
        </p>
      </Callout>

      <CodeBlock
        language="bash"
        title="Exercising it"
        code={`# One file, one field
curl -X POST http://localhost:5000/api/users/avatar \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -F "avatar=@profile.jpg"

# Several files at once
curl -X POST http://localhost:5000/api/restaurants/restaurant/images \\
  -H "Authorization: Bearer $ACCESS_TOKEN" \\
  -F "images=@front.jpg" -F "images=@inside.jpg" -F "images=@menu.jpg"`}
      />

      <h2>Delivery-side decisions</h2>

      <PropertyTable
        headers={['Decision', 'Recommendation']}
        rows={[
          [
            'Store URL or publicId?',
            'Both. publicId is what makes deletion possible; the URL is what the client renders.',
          ],
          [
            'Eager or lazy transformations?',
            'Lazy at delivery (URL params). One original, every size, no re-upload.',
          ],
          [
            'Format on upload?',
            'Keep quality: auto and fetch_format: auto; let Cloudinary negotiate per client.',
          ],
          [
            'Where to cap size?',
            'Upload-time cap for safety, delivery-time width for bandwidth.',
          ],
          [
            'Private documents',
            'Authenticated resource type plus signed URLs with a short expiry.',
          ],
          [
            'Orphan cleanup',
            'A scheduled sweep deleting assets with no referencing document older than 24 hours.',
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/notifications">Notifications</a> — every
        one of these endpoints exists to make somebody&rsquo;s phone buzz, which
        is the last piece of the order pipeline.
      </p>
    </>
  )
}

export function BackendNotifications() {
  return (
    <>
      <p>
        An order that happens silently is an order the customer assumes was
        lost. Notification is therefore not a nice-to-have feature — it is part
        of the order lifecycle. This chapter covers the three channels
        NutriDeliver uses, the utility that makes them consistent, and the
        fan-out pattern that turns one status change into messages for three
        different people.
      </p>
      <h2>Three channels, three purposes</h2>
      <PropertyTable
        headers={['Channel', 'Technology', 'Use it for']}
        rows={[
          [
            'In-app',
            'Notification collection + REST',
            'The durable record. Survives app restarts, unread counts, history.',
          ],
          [
            'Push',
            'Firebase Cloud Messaging',
            'Time-critical events. The rider must know an order is waiting even with the app closed.',
          ],
          [
            'Email',
            'Nodemailer over Gmail SMTP',
            'Low-frequency, high-value: verification, password reset, order receipt.',
          ],
        ]}
      />
      <Callout variant="note" title="In-app is the source of record">
        <p>
          Push is best-effort and email is often unread. The{' '}
          <code>Notification</code> document is the only channel a user can
          reliably go back to, so it is written first and every other channel is
          treated as a copy of it.
        </p>
      </Callout>
      <h2>The collection</h2>
      <CodeBlock
        language="js"
        title="models/notification.js"
        code={`const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['order', 'promotion', 'system', 'rider'],
      default: 'system',
    },
    // Mixed payload — for an order notification this carries { orderId },
    // which the client uses to route to the tracking screen.
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Serves GET /notifications (recent first) and the unread-count query together.
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });`}
      />
      <h2>The create utility</h2>
      <p>
        Writing a notification means creating the document, pushing to the
        device, and optionally emailing. Doing that inline at every call site is
        how you end up with nine slightly different implementations. One utility
        owns all three channels, and it never throws — a notification failure
        must not fail the order that triggered it.
      </p>
      <CodeBlock
        language="js"
        title="utils/createNotification.js"
        code={`import Notification from '../models/notification.js';
import User from '../models/User.js';
import { sendPushNotification } from './pushNotification.js';
import { sendEmail } from './sendEmail.js';

// Which channel fires for which event. Push is for anything time-critical;
// email is reserved for things a user might need a receipt of.
const CHANNELS = {
  order_placed:      { push: true,  email: true },
  order_confirmed:   { push: true,  email: false },
  order_preparing:   { push: true,  email: false },
  order_ready:       { push: true,  email: false },
  rider_assigned:    { push: true,  email: false },
  order_delivered:   { push: true,  email: true },
  order_cancelled:   { push: true,  email: true },
  order_auto_cancel: { push: true,  email: true },
  payment_received:  { push: true,  email: false },
  refund_processed:  { push: true,  email: true },
  new_offer:         { push: true,  email: false },
  system:            { push: false, email: true },
};

export const createNotification = async (
  userId,
  { title, message, type = 'system', data = {}, event = 'system' },
) => {
  const channels = CHANNELS[event] ?? CHANNELS.system;

  // ── 1. In-app, always ──────────────────────────────────────────────────
  let notification = null;
  try {
    notification = await Notification.create({ userId, title, message, type, data });
  } catch (error) {
    console.error('Failed to store notification:', error.message);
    // Return early only if we cannot even record it. Never throw onward.
    return { success: false, stored: false };
  }

  // ── 2. Push, if the event warrants it and the user wants it ─────────────
  let pushResult = null;
  try {
    const user = await User.findById(userId).select('fcmTokens notificationPreferences');

    if (channels.push && user?.notificationPreferences?.push !== false) {
      const tokens = (user.fcmTokens || []).filter((t) => t.active);
      const stale = [];

      for (const token of tokens) {
        const result = await sendPushNotification(token, { title, message }, data);

        // FCM reports unregistered tokens with a specific error code. When one
        // appears, deactivate it — otherwise you retry a dead token forever.
        if (result.shouldRemoveToken) stale.push(token._id ?? token);
      }

      if (stale.length > 0) {
        await User.updateMany(
          { _id: userId, 'fcmTokens.token': { $in: stale } },
          { $set: { 'fcmTokens.$.active': false } },
        );
      }

      pushResult = { sent: tokens.length - stale.length, stale: stale.length };
    }
  } catch (error) {
    console.error('Push notification failed:', error.message);
  }

  // ── 3. Email, only for the events worth an inbox copy ──────────────────
  if (channels.email) {
    try {
      const user = await User.findById(userId).select('email profile notificationPreferences');
      if (user?.email && user.notificationPreferences?.email !== false) {
        await sendEmail({
          email: user.email,
          template: event,
          templateData: [user.profile?.firstName ?? 'there', data],
        });
      }
    } catch (error) {
      console.error('Notification email failed:', error.message);
    }
  }

  return { success: true, stored: true, notification, push: pushResult };
};

/**
 * Fan-out helper. One order status change produces a different message for the
 * customer, the restaurant, and the rider — same event, three audiences.
 */
export const notifyOrderParties = async (order, event) => {
  const restaurantOwnerId = order.restaurantOwnerId?.toString();
  const riderId = order.deliveryDetails?.riderId?.toString();

  const jobs = [
    createNotification(order.userId, {
      ...event.toCustomer,
      type: 'order',
      event: event.key,
      data: { orderId: order._id.toString() },
    }),
  ];

  if (restaurantOwnerId) {
    jobs.push(
      createNotification(restaurantOwnerId, {
        ...event.toRestaurant,
        type: 'order',
        event: event.key,
        data: { orderId: order._id.toString() },
      }),
    );
  }

  if (riderId) {
    jobs.push(
      createNotification(riderId, {
        ...event.toRider,
        type: 'rider',
        event: event.key,
        data: { orderId: order._id.toString() },
      }),
    );
  }

  // AllSettled, not all: one failed push must not cancel the others.
  const results = await Promise.allSettled(jobs);
  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length) {
    console.error(\`\${failures.length} notification(s) failed for \${event.key}\`);
  }
};`}
      />
      <h2>Reading and clearing notifications</h2>
      <p>
        The notification endpoints are almost entirely reads, and every query is
        scoped by <code>userId</code>. The unread count is returned alongside
        the page rather than as a separate request, because the client needs it
        for the badge on every screen and a second round trip for one integer is
        not worth it.
      </p>
      <CodeBlock
        language="js"
        title="controllers/notificationController.js"
        code={`export const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = { userId: req.user.id };
  if (unreadOnly === 'true') query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user.id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: { current: page, pages: Math.ceil(total / limit), total },
    },
  });
});`}
      />
      <CodeBlock
        language="js"
        title="markAllAsRead — one write, not a loop"
        code={`export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true },
  );

  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false,
  });

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: { unreadCount },
  });
});`}
      />
      <p>
        The repository&rsquo;s controller already exposes a{' '}
        <code>createNotification(userId, title, message, type, data)</code>{' '}
        helper and a <code>createNotifications</code> fan-out using{' '}
        <code>insertMany</code>. The version above is the same idea widened to
        cover all three channels — worth consolidating, because right now the
        controllers call <code>createNotification</code> and nothing sends
        anything anywhere.
      </p>
      <h2>Email over Nodemailer</h2>
      <p>
        Gmail with an app password is the pragmatic choice for a project without
        a transactional email budget: no domain to verify, no DNS records, and
        500 messages a day. The transporter is created per call, which is cheap
        and avoids a stale connection pool.
      </p>
      <CodeBlock
        language="js"
        title="utils/sendEmail.js"
        code={`import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,   // a 16-character app password
    },
  });

// Templates are plain functions returning { subject, html }. Interpolating a
// user-controlled name into HTML is an injection point — escape it, or use a
// templating engine that does.
const emailTemplates = {
  orderConfirmation: (name, order) => ({
    subject: \`NutriDeliver - Order Confirmation #\${order.orderId}\`,
    html: \`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E8B57;">Order Confirmed</h2>
        <p>Hello \${escapeHtml(name)},</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p><strong>Order ID:</strong> \${order.orderId}</p>
          <p><strong>Total:</strong> $\${order.grandTotal}</p>
        </div>
      </div>
    \`,
  }),
};

export const sendEmail = async ({ email, template, templateData }) => {
  const transporter = createTransporter();
  const content = emailTemplates[template](...templateData);

  await transporter.sendMail({
    from: \`"NutriDeliver" <\${process.env.EMAIL_USER}>\`,
    to: email,
    subject: content.subject,
    html: content.html,
  });

  return { success: true };
};`}
      />
      <Callout variant="warning" title="Gmail will rate-limit you">
        <p>
          500 messages a day is generous for development and nowhere near enough
          for a launch. When you outgrow it, swap the transporter for Resend,
          Postmark, or SES — which is why every call site uses{' '}
          <code>{'sendEmail({ template, templateData })'}</code> rather than
          touching Nodemailer directly. That signature is the abstraction.
        </p>
      </Callout>
      <h2>Push with Firebase</h2>
      <p>
        FCM is a token-based system. The app registers a device token on launch
        and posts it to the backend; the backend stores it against the user and
        sends to every active token for that user. Tokens are not permanent —
        they rotate when the app is reinstalled and die when the user resets the
        device — so deactivating them is routine maintenance, not an edge case.
      </p>
      <CodeBlock
        language="js"
        title="utils/pushNotification.js — the real approach"
        code={`import admin from 'firebase-admin';

const initializeFirebase = () => {
  if (admin.apps.length) return;   // idempotent

  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
};

export const sendPushNotification = async (deviceToken, notification, data = {}) => {
  try {
    initializeFirebase();

    const response = await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        ...data,
        // FCM data values must all be strings. Numbers become "[object Object]"
        // on the client unless you serialise them here.
        orderId: data.orderId ?? '',
        timestamp: new Date().toISOString(),
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });

    return { success: true, messageId: response };
  } catch (error) {
    // This is the signal that makes token cleanup possible.
    if (error.code === 'messaging/registration-token-not-registered') {
      return { success: false, error: 'Token not registered', shouldRemoveToken: true };
    }
    return { success: false, error: error.message };
  }
};`}
      />
      <CodeBlock
        language="js"
        title="Device token registration endpoint"
        code={`// POST /api/users/push-token
export const registerPushToken = asyncHandler(async (req, res) => {
  const { token, platform = 'ios' } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  const user = await User.findById(req.user.id);

  const existing = user.fcmTokens.find((t) => t.token === token);
  if (existing) {
    // Same device, fresh token — reactivate rather than duplicate.
    existing.active = true;
    existing.updatedAt = new Date();
  } else {
    user.fcmTokens.push({
      token,
      platform,
      active: true,
      // One user with two phones is normal; one token with two users is not.
      deviceId: req.body.deviceId ?? null,
    });
  }

  await user.save();

  res.json({
    success: true,
    message: 'Push token registered',
    data: { deviceCount: user.fcmTokens.filter((t) => t.active).length },
  });
});`}
      />
      <Callout variant="note" title="A token identifies a device, not a person">
        <p>
          The same FCM token can arrive from a shared family phone. Store tokens
          as an array on the user and send to every active entry — that is what
          makes logout-and-login-on-a-new-device work, since the token array is
          rebuilt rather than inherited.
        </p>
      </Callout>
      <h2>When to send what</h2>
      <PropertyTable
        headers={['Event', 'In-app', 'Push', 'Email']}
        rows={[
          [
            'Order placed',
            'Yes',
            'Yes — to the restaurant',
            'Receipt to the customer',
          ],
          ['Restaurant accepted', 'Yes', 'Yes — to the customer', 'No'],
          ['Food ready for pickup', 'Yes', 'Yes — to nearby riders', 'No'],
          ['Rider assigned', 'Yes', 'Yes — to the customer', 'No'],
          [
            'Picked up / out for delivery',
            'Yes',
            'Yes — to the customer',
            'No',
          ],
          [
            'Delivered',
            'Yes',
            'Yes — to the customer',
            'Yes, with a rating link',
          ],
          [
            'Cancelled or auto-cancelled',
            'Yes',
            'Yes — customer and restaurant',
            'Yes',
          ],
          ['Refund processed', 'Yes', 'Yes', 'Yes'],
          ['New offer', 'Yes', 'Yes', 'Only if opted in'],
          [
            'Email verification, password reset',
            'No',
            'No',
            'Yes — these are inbox-only by nature',
          ],
        ]}
      />
      <p>
        The pattern to notice: push for anything a person is waiting on, email
        for anything they might want a record of. A rider waiting for the next
        delivery job needs a push; a customer needing proof of what they paid
        needs an email. Sending everything everywhere trains people to ignore
        notifications, which is worse than sending nothing.
      </p>
      <h2>The order-status fan-out</h2>
      <p>
        One transition, three audiences. The event map makes each message
        explicit rather than interpolating one string three ways.
      </p>
      <CodeBlock
        language="js"
        title="utils/orderEvents.js"
        code={`export const ORDER_EVENTS = {
  confirmed: {
    key: 'order_confirmed',
    toCustomer: {
      title: 'Order confirmed',
      message: 'The restaurant has accepted your order and is preparing it.',
    },
    toRestaurant: {
      title: 'Order confirmed',
      message: 'Payment received. The customer is waiting.',
    },
    toRider: null,   // no rider action yet — the job is not posted
  },

  ready_for_pickup: {
    key: 'order_ready',
    toCustomer: {
      title: 'Order ready',
      message: 'Your food is ready. A rider is being assigned.',
    },
    toRestaurant: {
      title: 'Awaiting rider',
      message: 'An order is waiting for collection.',
    },
    toRider: {
      title: 'New delivery available',
      message: 'An order near you is ready for pickup.',
    },
  },

  delivered: {
    key: 'order_delivered',
    toCustomer: {
      title: 'Order delivered',
      message: 'Enjoy your meal. Rate your order when you have a moment.',
    },
    toRestaurant: {
      title: 'Order delivered',
      message: 'Delivered and paid out. Thanks for a great service.',
    },
    toRider: {
      title: 'Delivery complete',
      message: 'Payout added to your pending balance.',
    },
  },

  cancelled: {
    key: 'order_cancelled',
    toCustomer: {
      title: 'Order cancelled',
      message: 'Your order was cancelled. Any payment will be refunded.',
    },
    toRestaurant: {
      title: 'Order cancelled',
      message: 'An order was cancelled. No action needed.',
    },
    toRider: {
      title: 'Delivery cancelled',
      message: 'The delivery you were assigned has been cancelled.',
    },
  },
};`}
      />
      <CodeBlock
        language="js"
        title="controllers/orderController.js — notify after the write"
        code={`// Fire and forget. The order is already committed; a slow or failing
// notification must not roll it back or delay the response. Await it only
// where the user is actively waiting on the outcome.
order.save()
  .then(() => notifyOrderParties(order, ORDER_EVENTS[status]))
  .catch((error) =>
    logger.error('Notification fan-out failed', { orderId: order._id, error }),
  );`}
      />
      <Callout
        variant="danger"
        title="Never await notifications on the hot path"
      >
        <p>
          An FCM round trip takes 100–400 ms. Awaiting it inside{' '}
          <code>confirmDelivery</code> means the rider waits a third of a second
          for a message about the fact they just triggered. Persist the order
          first, respond immediately, and let delivery catch up. When
          reliability matters more than latency — a payment confirmation — move
          the work to a background job instead of holding the request open.
        </p>
      </Callout>
      <h2>Preferences</h2>
      <CodeBlock
        language="js"
        title="controllers/notificationController.js"
        code={`export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, push, sms } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      notificationPreferences: {
        // Falling back to the current value keeps a partial update from
        // silently resetting the channels the user did not mention.
        email: email ?? req.user.notificationPreferences?.email,
        push: push ?? req.user.notificationPreferences?.push,
        sms: sms ?? req.user.notificationPreferences?.sms,
      },
    },
    { new: true, runValidators: true },
  );

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: { user },
  });
});`}
      />
      <p>
        Transactional email — verification, password reset, receipts — must
        ignore these preferences, because a user who unchecks email still needs
        to be able to log in. Only marketing and promotional sends consult them.
      </p>
      <h2>Cleanup</h2>
      <p>
        Notifications accumulate at a rate proportional to order volume, and an
        unbounded collection is a slow collection. A daily job deletes read
        notifications older than thirty days; unread ones are kept, because an
        unread notification is unresolved business.
      </p>
      <CodeBlock
        language="js"
        title="utils/backgroundJobs.js"
        code={`export const cleanupOldNotifications = async () => {
  try {
    const Notification = (await import('../models/notification.js')).default;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true,      // unread messages are still outstanding work
    });

    if (result.deletedCount > 0) {
      console.log(\`Cleaned up \${result.deletedCount} old notifications\`);
    }

    return result.deletedCount;
  } catch (error) {
    console.error('Cleanup notifications job error:', error);
    return 0;
  }
};`}
      />
      <h2>What to test</h2>
      <PropertyTable
        headers={['Case', 'Expected']}
        rows={[
          [
            'A notification is created',
            'One document, unread, correctly scoped to the user.',
          ],
          [
            'Push send fails',
            'The order still succeeds; the in-app document still exists.',
          ],
          [
            'FCM reports an unregistered token',
            'That token is deactivated and never retried.',
          ],
          [
            'Email transport throws',
            'No unhandled rejection; the error is logged.',
          ],
          [
            'Push disabled in preferences',
            'The in-app record is still written; no FCM call is made.',
          ],
          [
            'Order delivered',
            'Three notifications created: customer, restaurant, rider.',
          ],
          [
            'User A lists notifications',
            'Only user A’s documents are returned, regardless of page.',
          ],
          ['mark-all-read', 'A single updateMany, and unreadCount returns 0.'],
        ]}
      />
      <p>
        Next: <a href="/docs/backend/realtime">Real-Time &amp; WebSockets</a> —
        push notifies; WebSocket is what keeps a tracking screen live while the
        customer watches a rider approach.
      </p>{' '}
    </>
  )
}
