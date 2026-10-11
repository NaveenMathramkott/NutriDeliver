import dashboardImage from "../../../assets/admin_dashboard.png";
import settingsImage from "../../../assets/admin_dashboard_settings.png";
import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import { Diagram, PropertyTable, Split, Step, Steps } from "../primitives";
import { Screenshot } from "../screenshot";

export function MobileCustomer() {
  return (
    <>
      <p>
        The customer app is the largest of the three mobile apps: twenty-two
        screens covering authentication, discovery, the ordering funnel, and
        account management. Most of them are ordinary CRUD screens. Three are
        not — the cart, checkout, and live tracking — and those three are where
        the interesting engineering lives, because they are the only places in
        this app where a mistake costs money.
      </p>

      <p>
        Everything here builds on the shared foundation in{" "}
        <a href="/docs/mobile/setup">Expo App Setup</a> and{" "}
        <a href="/docs/mobile/api-client">API Client &amp; State</a>. This
        chapter assumes a working Expo Router shell and an API client that
        already handles token refresh; neither is repeated here.
      </p>

      <h2>The route map</h2>

      <p>
        Expo Router is file-based, and the folder names carry meaning. A
        parenthesised folder groups routes under a shared layout without
        appearing in the URL. Everything outside those groups is a stack screen
        pushed on top of whatever came before.
      </p>

      <CodeBlock
        language="text"
        title="app/ — the customer app route tree"
        code={`app/
├── _layout.tsx              Root: providers, auth gate, splash screen
├── +not-found.tsx           Catch-all for malformed deep links
│
├── (auth)/                  Unauthenticated group — redirects out once logged in
│   ├── _layout.tsx          Stack; hides the tab bar, sets a full-screen layout
│   ├── login.tsx            Email + password
│   ├── register.tsx         Name, email, phone, password
│   ├── otp-verify.tsx       Six-digit code posted to /auth/verify-email
│   └── forgot-password.tsx  Request code, then reset in the same screen
│
├── (tabs)/                  Authenticated group — the persistent bottom bar
│   ├── _layout.tsx          <Tabs> with Home, Search, Orders, Account
│   ├── index.tsx            Home: featured, categories, nearby, search entry
│   ├── search.tsx           Search with dietary / price / calorie filters
│   ├── orders.tsx           Order history, grouped by month
│   └── account.tsx          Profile hub linking to the account sub-screens
│
├── restaurant/
│   ├── [id].tsx            Restaurant detail: info, rating, hours
│   └── [id]/menu.tsx        Full menu, grouped by category
│
├── food/[id].tsx            Food detail: nutrition, ingredients, allergens
│
├── cart.tsx                 Cart, scoped to one restaurant
├── checkout.tsx             Address, offer, payment method, review
├── payment.tsx              Stripe sheet + payment result
│
├── order/
│   ├── confirmation.tsx     Order ID, ETA, status timeline
│   ├── [id].tsx             Order detail with a reorder action
│   └── [id]/tracking.tsx    Map, rider marker, live ETA
│
└── account/
    ├── profile.tsx          Personal info and dietary preferences
    ├── addresses.tsx        Saved delivery addresses
    ├── favourites.tsx       Saved restaurants and items
    ├── notifications.tsx    In-app notification centre
    └── support.tsx          Help centre and contact form`}
      />

      <h3>Why three groups and not one stack</h3>

      <Split
        left={{
          title: "Grouped by auth state",
          children: (
            <ul>
              <li>
                <code>(auth)</code> renders a bare stack with no tab bar, which
                is what a signed-out user should see.
              </li>
              <li>
                <code>(tabs)</code> is only mounted once a valid token exists,
                so an unauthenticated deep link can never render a tab screen.
              </li>
              <li>
                Cart and checkout sit outside both groups so they can be pushed
                over the tabs and still reach the authenticated context.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "What the root layout does",
          children: (
            <ul>
              <li>
                Hydrates the Redux store from persisted auth state on boot.
              </li>
              <li>
                Validates the refresh token before rendering anything, to avoid
                a login flash.
              </li>
              <li>
                Opens the Socket.IO connection and registers push handlers once.
              </li>
              <li>
                Hides the splash screen only after that validation resolves.
              </li>
            </ul>
          ),
        }}
      />

      <CodeBlock
        language="tsx"
        title="app/_layout.tsx — the auth gate"
        code={`export default function RootLayout() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((s) => s.auth.status)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  useEffect(() => {
    if (status === 'unknown') return

    const inAuthGroup = segments[0] === '(auth)'
    const signedIn = status === 'authenticated'

    if (signedIn && inAuthGroup) router.replace('/')
    if (!signedIn && !inAuthGroup) router.replace('/login')
  }, [status, segments])

  if (status === 'unknown') return <SplashScreen />

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
          <Stack.Screen name="checkout" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </Provider>
  )
}`}
      />

      <Callout variant="note" title="Three-state auth, not two">
        <p>
          The store tracks <code>unknown</code>, <code>authenticated</code>, and{" "}
          <code>anonymous</code> — not a boolean. A boolean cannot distinguish
          &ldquo;we have not checked yet&rdquo; from &ldquo;checked, not logged
          in&rdquo;, and that distinction is the whole difference between a
          clean launch and a login screen flashing on every cold start.
        </p>
      </Callout>

      <h2>Discovery</h2>

      <p>
        Six screens: home, restaurant list, restaurant detail, menu, food
        detail, and search. The list and search screens are the same component
        with different query parameters, which keeps filter logic in one place.
      </p>

      <CodeBlock
        language="tsx"
        title="Filter state lives in the URL, not in Redux"
        code={`export function SearchScreen() {
  const params = useLocalSearchParams<{
    q?: string
    dietary?: string   // comma-separated tags
    minPrice?: string
    maxPrice?: string
    maxCalories?: string
  }>()

  // The URL is the single source of truth, so a filtered result set is
  // shareable, survives a back navigation, and needs no Redux slice.
  const query = useMemo(
    () => ({
      search: params.q,
      dietary: params.dietary?.split(',').filter(Boolean),
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      maxCalories: params.maxCalories ? Number(params.maxCalories) : undefined,
    }),
    [params],
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['food-search', query],
    queryFn: () => foodApi.search(query),
  })

  return (
    <View>
      <FilterSheet
        value={query}
        onChange={(next) =>
          router.setParams(
            Object.fromEntries(
              Object.entries(next).filter(([, v]) => v != null && v !== ''),
            ),
          )
        }
      />
      <FlatList
        data={data?.foods ?? []}
        refreshing={isFetching}
        onRefresh={refetch}
        renderItem={({ item }) => <FoodRow item={item} />}
      />
    </View>
  )
}`}
      />

      <p>
        Filters in the URL rather than in Redux for a simple reason: the search
        screen is a <em>view onto a query</em>, not application state. Putting
        it in the URL makes every filtered result linkable, makes the hardware
        back button behave correctly, and means there is no slice to
        synchronise.
      </p>

      <h3>Food detail and nutrition</h3>

      <p>
        This is the screen that justifies the product. A food item carries
        calories, protein, carbs, fat, ingredients, allergens, and dietary tags.
        Render the macros as a small grid rather than a paragraph — nobody reads
        a wall of numbers.
      </p>

      <PropertyTable
        headers={["Field", "Source", "Rendering note"]}
        rows={[
          [
            "nutrition.calories",
            "FoodItem.nutrition",
            "The headline number. Shown first, largest.",
          ],
          [
            "nutrition.protein / carbs / fat",
            "FoodItem.nutrition",
            "Grams, rendered as a three-column grid.",
          ],
          [
            "ingredients",
            "Array of strings",
            "Bulleted, with allergens highlighted inline.",
          ],
          [
            "dietaryTags",
            "keto, vegan, gluten-free, high-protein",
            "Chips. Filtering on these is a first-class use case.",
          ],
          [
            "preparationTime",
            "Minutes",
            "Shown next to price so it informs the decision.",
          ],
          [
            "isAvailable",
            "Boolean",
            "Unavailable items stay visible but the add button is disabled.",
          ],
        ]}
      />

      <Callout variant="tip" title="Show unavailable items greyed out">
        <p>
          Hiding sold-out items makes the menu feel broken and sends customers
          to a competitor. Rendering them disabled communicates stock honestly
          and costs one conditional. Note that the backend still rejects orders
          containing unavailable items — this is presentation, not enforcement.
        </p>
      </Callout>

      <h2>The cart</h2>

      <p>
        The cart is the first screen with real business rules, and the rule that
        matters is that a cart belongs to exactly one restaurant. Adding an item
        from a different restaurant cannot merge into the existing cart; it
        replaces it, and the user is told why.
      </p>

      <CodeBlock
        language="tsx"
        title="app/cart.tsx — the restaurant-scope warning"
        code={`export function CartScreen() {
  const dispatch = useAppDispatch()
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  })

  const [pendingRestaurant, setPendingRestaurant] = useState<Restaurant | null>(null)

  // The guard lives at the point of adding, not in the cart screen, because
  // that is where the user has the other restaurant in context.
  const addItem = async (item: FoodItem) => {
    const sameRestaurant = cart?.restaurant._id === item.restaurant._id

    if (!sameRestaurant) {
      setPendingRestaurant(item.restaurant)
      return
    }
    await dispatch(addToCart({ foodItemId: item._id, quantity: 1 }))
  }

  const confirmReplace = async () => {
    await dispatch(clearCart())
    await dispatch(
      addToCart({
        foodItemId: pendingRestaurant!.items[0]._id,
        quantity: 1,
      }),
    )
    setPendingRestaurant(null)
    router.push('/cart')
  }

  if (pendingRestaurant) {
    return (
      <ReplaceCartDialog
        restaurantName={pendingRestaurant.name}
        onConfirm={confirmReplace}
        onCancel={() => setPendingRestaurant(null)}
      />
    )
  }

  return (
    <View>
      {cart?.restaurant && <RestaurantHeader restaurant={cart.restaurant} />}
      <FlatList
        data={cart?.items ?? []}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => <CartRow item={item} onRemove={removeItem} />}
      />
      <CartTotals subtotal={cart?.subtotal} discount={cart?.discount} />
      <Button
        disabled={!canCheckout(cart)}
        onPress={() => router.push('/checkout')}
      >
        Proceed to checkout
      </Button>
    </View>
  )
}`}
      />

      <Callout variant="warning" title="Never merge two restaurant carts">
        <p>
          A merged cart produces an order no single kitchen can prepare. The
          server rejects it at <code>POST /api/orders</code> with{" "}
          <code>Cart is empty</code> or a validation error, and the customer
          loses their cart contents entirely. The replacement must be explicit
          and confirmed, and the old cart must be cleared on the server — not
          just in local state.
        </p>
      </Callout>

      <p>
        The checkout button is also gated on the restaurant being open, the
        minimum order amount being met, and the delivery address being inside
        the delivery radius. Each of those has a matching server check; the
        client check exists purely to avoid a pointless round trip.
      </p>

      <h2>Checkout and order creation</h2>

      <p>
        Checkout collects an address, an optional offer code, a tip, and a
        payment method. Tapping pay does two things in sequence: create the
        order, then create a PaymentIntent for it.
      </p>

      <Diagram caption="Checkout sequence — order first, payment against the order">
        {`
   Checkout screen
        │
        ├── POST /api/orders            { cartId, addressId, offerCode, tip }
        │      │
        │      ├─ server re-validates: cart non-empty, items still
        │      │  available, restaurant open, min order met,
        │      │  address inside radius
        │      ├─ recomputes subtotal, discount, fees, tax  (never trusts
        │      │  the client) and snapshots items + prices
        │      ├─ clears the cart, status = "pending"
        │      └─ emits order:new to the restaurant room
        │
        ├── POST /api/payments/create-intent   { orderId }
        │      └─ returns clientSecret + publishableKey
        │
        └── Stripe SDK confirms the PaymentIntent
               │
               └─ POST /api/payments/confirm  { orderId, paymentIntentId }
                      │
                      └─ the real confirmation is the STRIPE WEBHOOK,
                         which is what flips the order to paid
`}
      </Diagram>

      <p>
        Order creation comes first because the PaymentIntent needs an{" "}
        <code>orderId</code> to attach to. Doing it the other way round leaves
        orphaned intents every time a user abandons the payment sheet.
      </p>

      <Callout
        variant="danger"
        title="The client success callback is a hint, not a fact"
      >
        <p>
          When the Stripe SDK reports success, the client calls{" "}
          <code>POST /api/payments/confirm</code> — but that is an optimisation
          so the user is not left waiting. The authoritative confirmation is the{" "}
          <code>payment_intent.succeeded</code> webhook, which may arrive before
          or after the app returns from the payment sheet. Both paths must be
          idempotent. See{" "}
          <a href="/docs/backend/payments">Payments with Stripe</a>.
        </p>
      </Callout>

      <h3>Two payment integrations, and when to use each</h3>

      <Split
        left={{
          title: "Native SDK (@stripe/stripe-react-native)",
          children: (
            <ul>
              <li>
                Card entry, Apple Pay, Google Pay all in one native sheet.
              </li>
              <li>3-D Secure and SCA handled by the OS, no custom UI.</li>
              <li>Best for cards, which is most of consumer checkout.</li>
              <li>
                Requires a development build — the Expo Go client will not load
                it.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Server create-intent flow",
          children: (
            <ul>
              <li>
                Server owns the full payment lifecycle; the client only holds a
                secret.
              </li>
              <li>Works unchanged on web and in Expo Go.</li>
              <li>
                Needed for UPI and other redirect-based local payment methods.
              </li>
              <li>Clunky card entry — do not build a card form yourself.</li>
            </ul>
          ),
        }}
      />

      <CodeBlock
        language="tsx"
        title="app/payment.tsx — confirm with the native SDK"
        code={`const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet()
const { user } = useAppSelector((s) => s.auth)

const pay = async () => {
  setSubmitting(true)

  // 1. The order already exists. Attach an intent to it.
  const intent = await paymentApi.createIntent(order._id)

  // 2. Configure the native sheet with the server-supplied secret.
  const { error } = await initPaymentSheet({
    paymentIntent: intent.clientSecret,
    merchantDisplayName: 'NutriDeliver',
    customer: { id: user._id, ...user.customerProfile },
    primaryButtonLabel: 'Pay',
  })
  if (error) {
    setSubmitting(false)
    return
  }

  // 3. Present, then confirm server-side for a fast local state change.
  const result = await presentPaymentSheet()
  if (result?.paymentSheetResult?.result === 'completed') {
    await paymentApi.confirm(order._id, result.paymentSheetResult?.paymentIntent?.id)
    router.replace('/order/confirmation')
  }

  setSubmitting(false)
}`}
      />

      <h2>Live tracking</h2>

      <p>
        Once an order is in flight, the tracking screen opens a Socket.IO
        connection and joins a room named for the customer. Every status change
        and every rider position update is pushed into that room by the server —
        the client never polls.
      </p>

      <CodeBlock
        language="js"
        title="hooks/useOrderTracking.js — subscribing to the customer room"
        code={`import { io } from 'socket.io-client'

export function useOrderTracking(orderId) {
  const dispatch = useAppDispatch()
  const userId = useAppSelector((s) => s.auth.user?._id)

  useEffect(() => {
    if (!orderId || !userId) return

    const socket = io(API_URL, {
      transports: ['websocket'],
      auth: { token: getAccessToken() },
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    })

    socket.emit('join', { room: \`customer-\${userId}\` })

    socket.on('order:status', (payload) => {
      if (payload.orderId !== orderId) return
      dispatch(orderStatusChanged(payload))
    })

    socket.on('rider:location', (payload) => {
      if (payload.orderId !== orderId) return
      dispatch(riderMoved(payload))
    })

    socket.on('order:cancelled', (payload) => {
      dispatch(orderCancelled(payload))
    })

    return () => {
      socket.emit('leave', { room: \`customer-\${userId}\` })
      socket.disconnect()
    }
  }, [orderId, userId, dispatch])

  // Backoff when the socket is down, so a dead network does not become a
  // battery drain from a tight reconnection loop.
}`}
      />

      <PropertyTable
        headers={["Event", "Payload", "What the screen does"]}
        rows={[
          [
            "order:status",
            "{ orderId, status, statusHistory }",
            "Advances the timeline, updates the ETA label.",
          ],
          [
            "rider:location",
            "{ orderId, location, etaMinutes }",
            "Moves the rider marker, recomputes ETA.",
          ],
          [
            "order:cancelled",
            "{ orderId, reason, refund }",
            "Stops tracking, shows the reason, offers reorder.",
          ],
          [
            "connect_error",
            "—",
            'Shows a thin banner: "Reconnecting…". Never a modal.',
          ],
        ]}
      />

      <Callout variant="tip" title="Keep an HTTP fallback for tracking">
        <p>
          If the socket will not connect — a corporate proxy, an aggressive
          carrier NAT — the tracking screen should fall back to a 20-second{" "}
          <code>GET /api/orders/:orderId</code> poll rather than showing a dead
          screen. Sockets are the primary channel, not the only one.
        </p>
      </Callout>

      <h2>Offline behaviour</h2>

      <p>
        Mobile networks drop constantly — lifts, basements, tunnels. Three
        mechanisms handle this, and they are deliberately different in kind.
      </p>

      <Steps>
        <Step title="Reads come from cache first">
          <p>
            Persisted query results mean the last known menu, order list, and
            profile render instantly and offline. Stale data with a visible
            timestamp beats a spinner.
          </p>
        </Step>

        <Step title="Writes that are safe get queued">
          <p>
            Location pings, availability toggles, and non-payment preference
            changes are queued in memory and flushed on reconnect, in order. See{" "}
            <a href="/docs/mobile/rider">Rider App</a> for the queue
            implementation.
          </p>
        </Step>

        <Step title="Writes that cost money never queue">
          <p>
            Order creation and payment confirmation are never retried
            automatically. The user re-taps, the app shows the current server
            state, and the backend idempotency keys make a repeat safe.
          </p>
        </Step>
      </Steps>

      <CodeBlock
        language="tsx"
        title="A small offline banner, mounted once at the root"
        code={`export function ConnectivityBanner() {
  const [state, setState] = useState<NetInfoState | null>(null)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setState)
    return unsubscribe
  }, [])

  if (!state || state.isConnected) return null

  return (
    <Banner variant="warning">
      You are offline. Browsing is cached; checkout will need a connection.
    </Banner>
  )
}`}
      />

      <h3>Pull to refresh and background refresh</h3>

      <p>
        <code>RefreshControl</code> on the order history and restaurant list is
        cheap and expected. Background refresh matters more: a user who left the
        app open on an order tracking screen should return to current data.
        Refetch on <code>AppState</code> change back to <code>active</code>,
        throttled to once every thirty seconds so a user flicking between apps
        does not generate a request storm.
      </p>

      <h2>Optimistic updates — where and where not</h2>

      <p>
        Optimistic UI means rendering the result before the server confirms it.
        It makes an app feel instant. It also means you now have to reconcile
        two truths, and that is only worth it when the operation is easily
        reversible and cheap to undo.
      </p>

      <PropertyTable
        headers={["Action", "Optimistic?", "Why"]}
        rows={[
          [
            "Add / remove cart item",
            "Yes",
            "Trivially reversible, local to the cart, and the user can see it immediately.",
          ],
          [
            "Favourite a restaurant",
            "Yes",
            "Single boolean, no money, rollback is one more PATCH.",
          ],
          [
            "Set dietary preferences",
            "Yes",
            "Low stakes and self-evident; rollback on failure.",
          ],
          [
            "Mark a notification read",
            "Yes",
            "Pure UI state; refetching is unnecessary.",
          ],
          [
            "Change quantity at checkout",
            "No",
            "Changes the total, which the user is about to be charged.",
          ],
          [
            "Apply an offer code",
            "No",
            "Discount eligibility is a server rule with real expiry conditions.",
          ],
          [
            "Place an order",
            "No",
            "Creates a record, triggers a payment, notifies a restaurant. Not retryable.",
          ],
          [
            "Confirm payment",
            "No",
            "Money moves. Only the webhook can be trusted.",
          ],
        ]}
      />

      <CodeBlock
        language="tsx"
        title="An optimistic favourite, with a rollback path"
        code={`const toggleFavourite = createAsyncThunk(
  'favourites/toggle',
  async ({ restaurantId, isFavourite }: FavouriteArg) => {
    await restaurantApi.setFavourite(restaurantId, !isFavourite)
    return { restaurantId, isFavourite: !isFavourite }
  },
)

// The reducer flips the flag immediately on .pending so the heart fills in
// under one frame. On .rejected it flips back — which is why the thunk must
// return the value it tried to set, so the reducer knows what to undo.
favouritesSlice.extraReducers = (builder) => {
  builder
    .addCase(toggleFavourite.pending, (state, action) => {
      state.entities[action.meta.arg.restaurantId] = {
        ...state.entities[action.meta.arg.restaurantId],
        isFavourite: action.meta.arg.isFavourite === false,
      }
    })
    .addCase(toggleFavourite.fulfilled, (state, action) => {
      state.entities[action.payload.restaurantId].isFavourite =
        action.payload.isFavourite
    })
    .addCase(toggleFavourite.rejected, (state, action) => {
      state.entities[action.meta.arg.restaurantId].isFavourite =
        action.meta.arg.isFavourite
    })
}`}
      />

      <Callout
        variant="warning"
        title="Optimistic and payments are mutually exclusive"
      >
        <p>
          Never show a confirmed payment that has not been confirmed by the
          webhook. The user closes the app, the card fails, and you have told
          them the order is paid. The correct optimistic UI for payment is
          exactly none — show a spinner, then show the truth.
        </p>
      </Callout>
    </>
  );
}

export function MobileRestaurant() {
  return (
    <>
      <p>
        The restaurant app serves a single owner or manager who needs one thing
        above all else: to know, immediately and unambiguously, what the kitchen
        owes them right now. Seventeen screens, but the design effort is
        concentrated in three — the dashboard, the order responder, and menu
        management.
      </p>

      <h2>Route map</h2>

      <CodeBlock
        language="text"
        title="app/ — the restaurant app route tree"
        code={`app/
├── _layout.tsx          Root providers + role guard (restaurant role required)
├── index.tsx            Redirects to /(tabs)/dashboard
│
├── (auth)/
│   ├── login.tsx        Restaurant-specific credentials
│   └── setup.tsx        First-run: name, cuisine, address, hours, bank
│
├── (tabs)/
│   ├── _layout.tsx      Orders, Menu, Analytics, Profile
│   ├── dashboard.tsx    Today at a glance + pending orders
│   ├── menu.tsx         Categories and items, availability toggles
│   ├── analytics.tsx    Daily/weekly sales, popular items, peak hours
│   └── profile.tsx      Operating hours, images, payout details
│
├── orders/
│   ├── [id].tsx         Order detail: items, special instructions
│   └── history.tsx      Past orders with status and date filters
│
├── menu/
│   ├── categories.tsx   Add, rename, reorder, deactivate
│   ├── item/[id].tsx    Create or edit an item, nutrition, images
│   └── upload.tsx       Image picker and Cloudinary upload progress
│
├── earnings.tsx         Daily/weekly/monthly earnings and payouts
└── support.tsx`}
      />

      <h2>The dashboard</h2>

      <p>
        The dashboard answers four questions in one screen: how much did I make
        today, how many orders are outstanding, what needs my attention, and am
        I even open. Order of importance is order of placement.
      </p>

      <PropertyTable
        headers={["Block", "Data", "Source"]}
        rows={[
          [
            "Today stat tiles",
            "Revenue, order count, average prep time",
            "GET /api/restaurants/restaurant/analytics",
          ],
          [
            "Pending orders",
            "Orders in pending status, newest first",
            "GET /api/restaurants/restaurant/orders?status=pending",
          ],
          [
            "In-progress orders",
            "confirmed / preparing / ready_for_pickup",
            "Same endpoint, filtered by status",
          ],
          [
            "Open-closed toggle",
            "Manual override of isOpen",
            "PUT /api/restaurants/restaurant/toggle-status",
          ],
        ]}
      />

      <Callout variant="note" title="The open toggle is not the whole truth">
        <p>
          <code>isOpen</code> is also driven by operating hours through a
          background job every five minutes. If the owner manually opens at
          03:00 the job may close them again on its next pass unless the manual
          toggle sets an explicit override flag. Decide which behaviour you want
          and document it — this is a common source of &ldquo;my restaurant
          closed itself&rdquo; bug reports.
        </p>
      </Callout>

      <h2>Receiving and answering orders</h2>

      <p>
        A new order arrives on the{" "}
        <code>
          restaurant-{"{"}id{"}"}
        </code>{" "}
        Socket.IO room and, if the app is backgrounded, as an FCM push. Three
        channels, because they fail independently: sockets die when the app is
        suspended, push is unreliable under load, and both die without network.
      </p>

      <CodeBlock
        language="js"
        title="hooks/useIncomingOrders.js — three channels, one reducer"
        code={`export function useIncomingOrders() {
  const dispatch = useAppDispatch()
  const restaurantId = useAppSelector(
    (s) => s.restaurant.profile?._id,
  )
  const [ping, setPing] = useState<AudioSound | null>(null)

  // Channel 1: sound. Loaded lazily and looped, so a new order is audible
  // even when the screen is on another tab.
  useEffect(() => {
    Audio.Sound.createAsync(
      require('../../assets/sounds/new-order.mp3'),
      { shouldPlay: true, isLooping: true, volume: 1.0 },
    ).then(({ sound }) => setPing(sound))
    return () => ping?.unloadAsync()
  }, [ping])

  useEffect(() => {
    if (!restaurantId) return

    const socket = io(API_URL, {
      transports: ['websocket'],
      auth: { token: getAccessToken() },
    })
    socket.emit('join', { room: \`restaurant-\${restaurantId}\` })

    socket.on('order:new', (payload) => {
      dispatch(orderReceived(payload))
      // If the app is backgrounded the socket will not have fired — the FCM
      // handler below calls the same reducer instead.
      if (AppState.currentState === 'active') ping?.replayAsync()
    })

    socket.on('order:status', (p) => dispatch(orderStatusChanged(p)))

    return () => {
      socket.emit('leave', { room: \`restaurant-\${restaurantId}\` })
      socket.disconnect()
    }
  }, [restaurantId, dispatch, ping])
}`}
      />

      <Callout variant="warning" title="Do not rely on the socket alone">
        <p>
          iOS suspends sockets within seconds of backgrounding, and Android does
          the same under memory pressure. Push notification plus a polling
          fallback on app foreground is the combination that actually delivers
          orders. Sound playback in particular must be wired to the notification
          handler, not only to the socket callback. See{" "}
          <a href="/docs/mobile/notifications">
            Push &amp; Local Notifications
          </a>
          .
        </p>
      </Callout>

      <h3>Accept or reject, against a deadline</h3>

      <p>
        Every pending order carries a countdown. When it expires the backend
        auto-cancels and refunds, and the restaurant gets nothing. The timer is
        therefore a commercial constraint, and the UI should make it feel like
        one.
      </p>

      <CodeBlock
        language="tsx"
        title="Order response — a timer that must not be gamed by the client"
        code={`export function OrderResponder({ order }: { order: Order }) {
  const dispatch = useAppDispatch()
  const deadline = useMemo(
    () => new Date(order.responseDeadline ?? order.placedAt + ACCEPT_WINDOW_MS),
    [order],
  )
  const remaining = useCountdown(deadline)
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  const respond = async (action: 'accept' | 'reject') => {
    if (remaining <= 0) return

    try {
      await dispatch(
        respondToOrder({ orderId: order._id, action, rejectionReason: reason }),
      ).unwrap()
      playFeedback(action === 'accept' ? 'accepted' : 'rejected')
    } catch (err) {
      // The server is the only authority on whether this order was still
      // pending. Two operators, two devices, same order — the second one
      // gets "Order cannot be accepted at this stage".
      Alert.alert('Cannot respond', (err as ApiError).message)
      dispatch(orderStatusChanged({ orderId: order._id, status: 'unknown' }))
    }
  }

  return (
    <View>
      <AcceptTimer remaining={remaining} total={ACCEPT_WINDOW_MS} urgent={remaining < 30} />
      <OrderItems items={order.items} />
      <SpecialInstructions text={order.specialInstructions} />

      <Button onPress={() => respond('accept')} disabled={remaining <= 0}>
        Accept
      </Button>
      <Button variant="outline" onPress={() => setShowReject(true)}>
        Reject
      </Button>
    </View>
  )
}`}
      />

      <Callout variant="danger" title="The timer is cosmetic">
        <p>
          The countdown only tells the user how long they have left. The server
          owns the deadline and the auto-cancel job owns enforcement. If the
          client clock is wrong, or the response arrives after the job ran, the
          response fails with{" "}
          <code>Order cannot be accepted at this stage</code>. Never gate the
          button on the client timer alone — always handle the 400.
        </p>
      </Callout>

      <h2>The status state machine</h2>

      <p>
        After accepting, the restaurant advances the order through preparation
        with <code>PUT /api/restaurants/restaurant/orders/:orderId/status</code>
        . Only two transitions are legitimate from this app, and the UI should
        offer exactly those two buttons — no free-text status picker.
      </p>

      <Diagram caption="Transitions the restaurant app is allowed to request">
        {`
   pending ──accept──▶ confirmed ──▶ preparing ──▶ ready_for_pickup
     │                    │            │              │
     │                  reject       reject          reject
     ▼                    ▼            ▼              ▼
  cancelled            cancelled    cancelled      cancelled

   From this app the only writable moves are:
     confirmed        → preparing
     preparing        → ready_for_pickup
   Everything else (pickedup, out_for_delivery, delivered) is the
   rider's. Everything else (cancelled) is shared with the admin.
`}
      </Diagram>

      <CodeBlock
        language="js"
        title="Advancing an order, client side"
        code={`const advance = async (order: Order, status: OrderStatus) => {
  try {
    await restaurantApi.updateOrderStatus(order._id, status)
    dispatch(orderStatusChanged({ orderId: order._id, status }))
  } catch (err) {
    // Refetch rather than guess — the admin panel or a background job may
    // have moved the order while this device was offline.
    const fresh = await restaurantApi.getOrder(order._id)
    dispatch(orderStatusChanged({ orderId: order._id, status: fresh.status }))
    toast('Order updated elsewhere', 'Showing the current status.')
  }
}

// Buttons are derived from the current status, so an illegal transition is
// never offered — and if the server rejects it anyway we recover cleanly.
const nextActions: Record<OrderStatus, OrderStatus[]> = {
  pending: [],
  confirmed: ['preparing'],
  preparing: ['ready_for_pickup'],
  ready_for_pickup: [],
  pickedup: [],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
}`}
      />

      <p>
        Accepting sets a <code>preparationTime</code> in minutes, which the
        backend turns into an <code>estimatedDelivery</code> the customer sees.
        A wrong estimate propagates: it drives the customer's ETA display, the
        support burden when it is missed, and the restaurant's own on-time
        metric. Default it from the item count and let the owner adjust it in
        one tap.
      </p>

      <h2>Menu management</h2>

      <p>
        Four screens cover categories, items, inventory, and uploads. The
        underlying model is simple; the work is in making data entry fast, since
        a restaurant owner updating a menu is doing it on a phone, between
        services, with one hand.
      </p>

      <PropertyTable
        headers={["Operation", "Endpoint", "Notes"]}
        rows={[
          [
            "List menu",
            "GET /api/food/restaurant/:restaurantId",
            "Grouped by category on the client.",
          ],
          [
            "Create item",
            "POST /api/food",
            "Accepts multipart for the primary image.",
          ],
          [
            "Update item",
            "PUT /api/food/:id",
            "Partial updates; omit fields you are not changing.",
          ],
          [
            "Toggle availability",
            "PATCH /api/food/:id/availability",
            "One call per item — batch it in a loop with concurrency 4.",
          ],
          [
            "Delete item",
            "DELETE /api/food/:id",
            "Soft-deletes if the item appears in past orders.",
          ],
          [
            "Upload image",
            "POST /api/food/:id/images",
            "Cloudinary; show a per-image upload progress bar.",
          ],
        ]}
      />

      <Callout variant="note" title="Hard delete breaks order history">
        <p>
          Order items are snapshots, so a deleted food item does not corrupt
          past orders. But analytics pipelines that <code>$lookup</code> to{" "}
          <code>fooditems</code> for popular-item reports will lose the join.
          Soft-delete (<code>isActive: false</code>) keeps analytics intact and
          takes one extra conditional everywhere.
        </p>
      </Callout>

      <p>
        The nutrition form is the highest-friction screen in the app, because it
        asks for six numbers the owner probably does not have. Make every field
        optional, show a per-100 g hint next to each, and persist a local draft
        so an interrupted entry is never lost.
      </p>

      <h2>Analytics and earnings</h2>

      <p>
        Both read from aggregation endpoints rather than client-side arithmetic.
        <code>GET /api/restaurants/restaurant/analytics</code> returns daily and
        weekly buckets; the earnings screen adds fee and payout breakdowns.
      </p>

      <CodeBlock
        language="ts"
        title="Peak hours are the chart restaurants actually want"
        code={`export function AnalyticsScreen() {
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily')

  const { data } = useQuery({
    queryKey: ['restaurant-analytics', period],
    queryFn: () => restaurantApi.getAnalytics(period),
    // Analytics change slowly. Two minutes of staleness is invisible and
    // removes a burst of identical aggregation pipelines.
    staleTime: 120_000,
  })

  const { daily, popularItems, peakHours = [] } = data ?? {}

  return (
    <ScrollView>
      <PeriodToggle value={period} onChange={setPeriod} />

      <BarChart
        data={daily.map((d) => ({ label: d.date, orders: d.orders }))}
        accessorKey="orders"
      />

      {/* The most actionable view: when should this kitchen be staffed? */}
      <BarChart
        data={peakHours.map((h) => ({
          label: h.hourLabel,
          orders: h.orders,
        }))}
        accessorKey="orders"
      />

      <PopularItems items={popularItems} />
    </ScrollView>
  )
}`}
      />

      <p>
        Cache these queries aggressively. A dashboard is the first screen on app
        open and the most expensive aggregation on the platform; a two-minute{" "}
        <code>staleTime</code> with a pull-to-refresh override is the right
        trade.
      </p>

      <h2>Operating hours</h2>

      <p>
        <code>PUT /api/restaurants/restaurant</code> carries the full profile,
        including a seven-day <code>operatingHours</code> structure. The screen
        is a per-day toggle plus two time pickers. Two behaviours worth building
        in from the start:
      </p>

      <ul>
        <li>
          <strong>Closed days are hidden from discovery.</strong> Public
          listings filter on <code>isOpen</code>, maintained by the background
          job — so a correct hours screen immediately improves storefront
          accuracy.
        </li>
        <li>
          <strong>Warn about orders in flight.</strong> Closing while an order
          is <code>preparing</code> does not cancel it, but the restaurant
          should be warned that the customer is still waiting.
        </li>
      </ul>

      <Callout variant="tip" title="Two screens, three apps, one pattern">
        <p>
          Auth, API client, socket lifecycle, and pull-to-refresh are identical
          across all three mobile apps. Copy the folder structure from the{" "}
          <a href="/docs/mobile/customer">Customer App</a> chapter rather than
          inventing a new one — divergence between three copies of the same
          client is where mobile bugs breed.
        </p>
      </Callout>
    </>
  );
}

export function MobileRider() {
  return (
    <>
      <p>
        The rider app is the most operationally demanding of the three, because
        it runs on the phone least likely to have power, signal, or the user's
        full attention. Sixteen screens, one critical loop: be online, see a
        nearby job, take it, ride there, pick it up, ride there, prove it, get
        paid.
      </p>

      <h2>Route map</h2>

      <CodeBlock
        language="text"
        title="app/ — the rider app route tree"
        code={`app/
├── _layout.tsx          Providers, role guard, socket bootstrap
├── index.tsx            Redirects to /(tabs)/home
│
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx     Phone, name, vehicle type
│   └── documents.tsx    Licence, RC, insurance, selfie — multipart upload
│
├── (tabs)/
│   ├── _layout.tsx      Home, Available, Earnings, Profile
│   ├── home.tsx         Availability toggle + active order summary
│   ├── available.tsx    Geo-sorted list of nearby ready orders
│   ├── earnings.tsx     Today / week / month, payouts, performance
│   └── profile.tsx      Personal info, vehicle, document status
│
├── delivery/
│   ├── [id].tsx         Active delivery: addresses, notes, contact, actions
│   ├── navigate.tsx     Map + turn-by-turn handoff
│   └── confirm.tsx      Pickup confirmation and delivery photo proof
│
├── earnings/
│   ├── history.tsx      Per-order earnings breakdown
│   ├── performance.tsx  Rating, completion rate, on-time percentage
│   └── payouts.tsx      Payout history and next payout date
│
└── support.tsx`}
      />

      <h2>Registration and document upload</h2>

      <p>
        Riders register with a phone number and a vehicle type, then upload
        documents. Registration creates the user with{" "}
        <code>isVerified: false</code> — the account exists immediately, but the
        rider cannot go online until an admin approves the documents. That is
        the <code>pending</code> to <code>verified</code> transition covered in{" "}
        <a href="/docs/admin/verification">Verification Workflows</a>.
      </p>

      <CodeBlock
        language="tsx"
        title="Document upload with per-file progress"
        code={`const REQUIRED = ['licence', 'vehicleRegistration', 'insurance'] as const

export function DocumentUploadScreen() {
  const [files, setFiles] = useState<Record<string, LocalFile>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async () => {
    const missing = REQUIRED.filter((k) => !files[k])
    if (missing.length > 0) {
      setErrors({ __all: \`Still needed: \${missing.join(', ')}\` })
      return
    }

    // One multipart request for all documents rather than one per file:
    // fewer round trips, one retry, and the server validates the set
    // atomically instead of accepting a partial application.
    const form = new FormData()
    for (const [type, file] of Object.entries(files)) {
      form.append('documents', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any)
      form.append('types', type)
    }

    await dispatch(uploadRiderDocuments(form)).unwrap()
    router.replace('/home')
  }

  return (
    <ScrollView>
      {REQUIRED.map((type) => (
        <DocumentField
          key={type}
          label={DOCUMENT_LABELS[type]}
          hint={DOCUMENT_HINTS[type]}
          value={files[type]}
          onPick={(asset) => setFiles((f) => ({ ...f, [type]: asset }))}
        />
      ))}
      {errors.__all && <Text className="text-red-600">{errors.__all}</Text>}
      <Button onPress={submit} loading={isUploading}>Submit for review</Button>
    </ScrollView>
  )
}`}
      />

      <Callout variant="tip" title="Guide the camera, do not just accept it">
        <p>
          Blurred licence photos generate a full review-rejection round trip
          every time. A live preview frame with a "hold steady, keep the whole
          document in frame" hint, plus a client-side brightness check, raises
          first-pass approval rates substantially and saves support load.
        </p>
      </Callout>

      <h2>Availability</h2>

      <p>
        A single switch, backed by <code>PUT /api/riders/availability</code>{" "}
        with <code>{'{ status: "available" | "offline" }'}</code>. The store has
        three values — <code>available</code>, <code>busy</code>,{" "}
        <code>offline</code> — and the rider controls only the first and last.{" "}
        <code>busy</code> is set by the server on accept and cleared on
        delivery. The UI must reflect a server-set <code>busy</code> state as
        read-only, or riders will fight the system.
      </p>

      <h2>Available orders</h2>

      <p>
        <code>GET /api/riders/orders/available</code> returns orders in{" "}
        <code>ready_for_pickup</code> with no rider assigned, within a radius of
        the rider&rsquo;s current position. The API already computes{" "}
        <code>distance</code>; the client sorts by it and refuses to render
        anything further than the server&rsquo;s own cutoff.
      </p>

      <CodeBlock
        language="tsx"
        title="The list a rider scans in two seconds"
        code={`export function AvailableOrdersScreen() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['available-orders'],
    queryFn: () => riderApi.getAvailableOrders(),
    // Orders appear by push, so the list must react to push, not to polling.
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  const orders = useMemo(
    () => [...(data?.orders ?? [])].sort((a, b) => a.distance - b.distance),
    [data],
  )

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o._id}
      refreshing={isFetching}
      onRefresh={refetch}
      ListEmptyComponent={<EmptyState title="Nothing nearby right now" />}
      renderItem={({ item }) => (
        <AvailableOrderCard
          order={item}
          onAccept={() => dispatch(acceptOrder(item._id))}
          onReject={() => dispatch(rejectOrder(item._id))}
        />
      )}
    />
  )
}`}
      />

      <p>
        Each card shows pickup distance, dropoff distance, delivery fee, and the
        total payout including tip. Anything less prominent is information the
        rider will not read at a junction.
      </p>

      <h3>The race condition on accept</h3>

      <p>
        Five riders tap accept on the same order within the same second. If the
        handler reads the order, decides it is free, and then writes the rider,
        you assign it five times and send five riders to one restaurant.
      </p>

      <p>
        The fix is a single atomic conditional update — the condition and the
        write are one database operation, not two.
      </p>

      <CodeBlock
        language="js"
        title="acceptOrder — atomic, not read-then-write"
        code={`const order = await Order.findOneAndUpdate(
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
)

// A null result means another rider won. The 400 is not an edge case —
// on a busy evening it is the normal outcome for all but one rider.
if (!order) {
  return res.status(400).json({
    success: false,
    message: 'Order not available for delivery',
  })
}`}
      />

      <Callout variant="note" title="The client must handle losing gracefully">
        <p>
          When <code>acceptOrder</code> rejects, the app should show{" "}
          &ldquo;Another rider got this one&rdquo; and remove the card from the
          list. Treating it as an error state is a bad experience on what is
          actually the system working correctly.
        </p>
      </Callout>

      <h2>Navigation</h2>

      <p>
        Two viable approaches, and the honest answer is that turn-by-turn
        quality comes from the OS map apps, not from an in-app map.
      </p>

      <Split
        left={{
          title: "expo-location + react-native-maps",
          children: (
            <ul>
              <li>Full control over the camera, marker, and route polyline.</li>
              <li>The customer sees the same map in the tracking screen.</li>
              <li>
                Costs a map API key and a build-time native config change.
              </li>
              <li>
                Turn-by-turn is still weak — you are drawing a line, not a
                navigator.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Deep link into Google/Apple Maps",
          children: (
            <ul>
              <li>
                Best routing, live traffic, and voice guidance — for free.
              </li>
              <li>
                Nearly instant handoff, no map tiles to load on a weak device.
              </li>
              <li>
                Worse for the rider: context switching loses your own UI state.
              </li>
              <li>Fine when the drop-off flow is short.</li>
            </ul>
          ),
        }}
      />

      <p>
        NutriDeliver uses both: an in-app map for situational awareness and the
        rider&rsquo;s current leg, plus a <code>Linking.openURL</code> button
        for full navigation. On iOS, <code>maps:</code> with{" "}
        <code>dirflg=d</code> launches Apple Maps turn-by-turn; on Android,{" "}
        <code>google.navigation:</code> does the same with Google Maps.
      </p>

      <h2>Throttled location pings</h2>

      <p>
        While <code>out_for_delivery</code>, the rider&rsquo;s position is
        pushed to the customer. Unthrottled, this is a battery catastrophe and a
        database write storm.
      </p>

      <CodeBlock
        language="js"
        title="hooks/useLocationStream.js — three seconds, and a queue"
        code={`import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'

const PING_INTERVAL_MS = 3000
const MIN_DISTANCE_M = 10
const MAX_BATCH_AGE_MS = 15_000

// Defined at module scope: a background task must be registered before the
// app is backgrounded or iOS refuses to start it.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations?.length) return

  const locations = data.locations
  const latest = locations[locations.length - 1]

  try {
    await api.put(\`/orders/\${latest.orderId}/location\`, {
      lat: latest.coords.latitude,
      lng: latest.coords.longitude,
      accuracy: latest.coords.accuracy,
      recordedAt: latest.timestamp,
    })
  } catch {
    // Network dropped. The fix is dropped rather than queued here: the
    // customer's view is a live map, and a stale position drawn as if it
    // were current is worse than no position at all.
  }
})

export async function startStreaming(orderId: string) {
  const foreground = await Location.requestForegroundPermissionsAsync()

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: PING_INTERVAL_MS,
    distanceInterval: MIN_DISTANCE_M,
    pausesUpdatesAutomatically: true,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Delivering order',
      notificationBody: 'Your location is shared with the customer.',
      notificationColor: '#16a34a',
    },
    // Android needs this to keep running when the screen is off.
    isBackgrounded: true,
  })
}`}
      />

      <PropertyTable
        headers={["Setting", "Value", "Reasoning"]}
        rows={[
          [
            "timeInterval",
            "3000 ms",
            "Three seconds is imperceptible on a map and cuts write volume by 90%.",
          ],
          [
            "distanceInterval",
            "10 m",
            "Stops pings when the rider is stationary at a traffic light.",
          ],
          [
            "accuracy",
            "Balanced",
            "High accuracy drains battery; low accuracy makes the rider look lost.",
          ],
          [
            "pausesUpdatesAutomatically",
            "true",
            "Stops location entirely when the rider is not moving.",
          ],
          [
            "showsBackgroundLocationIndicator",
            "true",
            "Required on iOS — without it the app is rejected.",
          ],
        ]}
      />

      <Callout
        variant="danger"
        title="Background location is a permission you must justify"
      >
        <p>
          Apple requires a written justification for{" "}
          <code>NSLocationWhenInUseUsageDescription</code> and especially for{" "}
          <code>NSLocationAlwaysAndWhenInUseUsageDescription</code>. The string
          must state the user-facing reason: &ldquo;Your location is shared with
          the customer while you deliver so they can see when their food
          arrives.&rdquo; Store review rejects vague strings, and Android 14+
          requires foreground and background to be requested as separate grants.
          See <a href="/docs/production/checklist">Launch Checklist</a>.
        </p>
      </Callout>

      <h2>Pickup and delivery confirmation</h2>

      <Steps>
        <Step title="Arrive at the restaurant">
          <p>
            The rider taps confirm pickup. The endpoint{" "}
            <code>POST /api/orders/:orderId/confirm-pickup</code> checks that
            the assigned rider is the one calling and that the status is{" "}
            <code>pickedup</code>, then moves to <code>out_for_delivery</code>.
            This is where the location stream starts.
          </p>
        </Step>

        <Step title="Deliver, with proof">
          <p>
            <code>POST /api/orders/:orderId/confirm-delivery</code> accepts a
            photo. Capture it through the app — not the camera roll — so the
            timestamp is trustworthy and the image is attached at capture.
          </p>
        </Step>

        <Step title="Earnings are credited server-side">
          <p>
            The confirmation handler increments{" "}
            <code>riderProfile.earnings.pendingPayout</code>, writes an{" "}
            <code>Earning</code> record, and returns the rider to{" "}
            <code>available</code>. The client never computes its own pay.
          </p>
        </Step>
      </Steps>

      <CodeBlock
        language="tsx"
        title="Delivery confirmation with photo proof"
        code={`export function ConfirmDeliveryScreen({ orderId }: Props) {
  const [proof, setProof] = useState<Asset | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const confirm = async () => {
    if (!proof) return
    setSubmitting(true)

    try {
      const form = new FormData()
      form.append('deliveryImage', {
        uri: proof.uri,
        name: \`delivery-\${orderId}.jpg\`,
        type: 'image/jpeg',
      } as any)

      // Stop the location stream first. Leaving it running after
      // delivery keeps the OS indicator on for no reason.
      await stopStreaming()
      await dispatch(confirmDelivery({ orderId, form })).unwrap()
      router.replace('/earnings')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View>
      <CameraCard onCapture={setProof} />
      <Button onPress={confirm} disabled={!proof || submitting}>
        Confirm delivery
      </Button>
    </View>
  )
}`}
      />

      <h2>When connectivity drops mid-delivery</h2>

      <p>
        This is the scenario the app is designed around. A rider in a basement
        or a lift is the normal case, not the exception.
      </p>

      <CodeBlock
        language="js"
        title="A retry queue for writes that are safe to repeat"
        code={`const queue = createWriteQueue({
  // These endpoints are idempotent, so a retry cannot double-charge or
  // double-credit. confirm-delivery is NOT in this list.
  endpoints: [
    () => api.put(\`/riders/location\`, latestFix),
    () => api.put('/riders/availability', { status }),
  ],
  maxAgeMs: 60_000,
  backoffMs: [1_000, 5_000, 15_000, 30_000],
})

NetInfo.addEventListener((state) => {
  if (!state.isConnected) {
    setOfflineBanner(true)
    return
  }
  setOfflineBanner(false)
  queue.flush()          // sequential — order matters for location history
})`}
      />

      <PropertyTable
        headers={["Operation", "Queued?", "Reasoning"]}
        rows={[
          [
            "Location ping",
            "No — dropped",
            "The customer needs a current fix. A three-second-old one drawn as live is a lie.",
          ],
          [
            "Availability toggle",
            "Yes",
            "Idempotent, and the rider expects the state to stick.",
          ],
          [
            "Reject an order",
            "Yes",
            "Idempotent; failing to reject means the order is offered again.",
          ],
          [
            "Confirm pickup",
            "Yes, idempotency key",
            "State transition guarded server-side; safe with a key.",
          ],
          [
            "Confirm delivery",
            "No",
            "Money and ratings are attached. Force an explicit user retry.",
          ],
        ]}
      />

      <Callout variant="warning" title="Show the queue, do not hide it">
        <p>
          A rider who believes their location is being shared when it is not
          will receive an angry customer call. Display a persistent banner with
          the number of unsent items and when they were captured. Transparency
          here costs a label and saves support tickets.
        </p>
      </Callout>

      <h2>Earnings, performance, and payouts</h2>

      <p>
        Four screens cover the money, and all four read server-side. The payout
        screen is the one riders screenshot, so make it unambiguous: current
        balance, pending payout, next payout date, and a per-order history that
        reconciles to the cent.
      </p>

      <CodeBlock
        language="ts"
        title="Earnings — four separate queries, not one mega-fetch"
        code={`export function EarningsScreen() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Split by concern so each screen region renders as soon as its own
  // request lands. One combined call makes the page wait for the slowest
  // aggregation, and blocks the fast balance number behind it.
  const balance = useQuery({
    queryKey: ['rider-earnings', period],
    queryFn: () => riderApi.getEarnings(period),
    staleTime: 30_000,
  })

  const payouts = useQuery({
    queryKey: ['rider-payouts'],
    queryFn: () => riderApi.getPayouts(),
  })

  const performance = useQuery({
    queryKey: ['rider-stats'],
    queryFn: () => riderApi.getStats(),
    staleTime: 300_000,
  })

  return (
    <ScrollView refreshing={balance.isRefetching} onRefresh={balance.refetch}>
      <EarningsHeader {...balance.data} />
      <PeriodTabs value={period} onChange={setPeriod} />
      <PayoutSchedule {...payouts.data} />
      <PerformanceMetrics {...performance.data} />
    </ScrollView>
  )
}`}
      />

      <h2>Battery, honestly</h2>

      <p>
        The rider app is the only NutriDeliver app that can be open for ten
        hours on a two-year-old phone. Four practices keep it alive:
      </p>

      <ul>
        <li>
          <strong>Native location task, not a JS interval.</strong> A{" "}
          <code>setInterval</code> stops the moment the JS thread is throttled.
          A native task manager keeps running and batches efficiently.
        </li>
        <li>
          <strong>Images are thumbnailed at capture.</strong> Uploading a 4 MB
          delivery photo over a weak connection is a real failure mode.
        </li>
        <li>
          <strong>Analytics are cached hard.</strong> A five-minute{" "}
          <code>staleTime</code> on the performance screen means opening the app
          at the end of a shift does not run six aggregation pipelines.
        </li>
        <li>
          <strong>No socket reconnect storms.</strong> Exponential backoff with
          a ceiling, plus a visible &ldquo;reconnecting&rdquo; state. A
          one-second retry loop will drain a battery faster than the location
          stream.
        </li>
      </ul>

      <Callout variant="note" title="Test on a real device, on a real network">
        <p>
          Simulators report perfect location instantly and never lose signal.
          Every one of the offline behaviours described here needs to be
          exercised on a physical phone in a lift, on mobile data, with the
          screen locked. None of it can be reproduced in a simulator.
        </p>
      </Callout>
    </>
  );
}

export function MobileNotifications() {
  return (
    <>
      <p>
        Notifications are how a food delivery platform survives the minutes
        between a customer placing an order and a rider arriving. Getting them
        wrong is not a cosmetic bug — a restaurant that does not learn about an
        order in thirty seconds loses it to the next platform.
      </p>

      <p>
        NutriDeliver uses <code>expo-notifications</code> as the client SDK,
        Firebase Cloud Messaging as the transport, and{" "}
        <code>firebase-admin</code> on the backend to send. Push and in-app
        notifications are both stored as <code>Notification</code> documents, so
        a user who dismisses a push can still read the history in-app.
      </p>

      <h2>The three kinds of notification</h2>

      <PropertyTable
        headers={["Kind", "Delivered by", "Examples"]}
        rows={[
          [
            "Remote push",
            "FCM via expo-notifications",
            "New order for a restaurant, order status change, verification decision.",
          ],
          [
            "Local notification",
            "expo-notifications schedule API",
            "Preparation timer finishing, upcoming payout, re-order nudge.",
          ],
          [
            "In-app record",
            "GET /api/notifications",
            "Everything, permanently, with a read/unread flag.",
          ],
        ]}
      />

      <Callout variant="note" title="Push is a delivery attempt, not a record">
        <p>
          FCM drops messages. Devices are offline, notifications are disabled,
          iOS suppresses pushes for apps that are uninstalled. Every push must
          correspond to a stored <code>Notification</code> document, and every
          screen that reacts to a push must be able to reconstruct its state
          from a plain HTTP call when the push does not arrive.
        </p>
      </Callout>

      <h2>Requesting permission, and iOS timing</h2>

      <p>
        <code>expo-notifications</code> must be imported at the top of the entry
        file — <code>app/_layout.tsx</code> — not inside an effect. Importing it
        dynamically causes a silent registration failure that is very hard to
        debug.
      </p>

      <CodeBlock
        language="tsx"
        title="Permission request, at a moment the user understands"
        code={`// app/_layout.tsx — top of file, before anything else.
import 'expo-notifications'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Foreground behaviour: show the banner. Background behaviour is handled
// by setNotificationHandler's omitted fields.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function requestPushPermission(userId: string) {
  // Android needs the channel to exist before the permission prompt on some
  // OEM builds, and always before a notification is posted.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16a34a',
      sound: 'default',
    })
  }

  const { status: existing, canAskAgain } =
    await Notifications.getPermissionsAsync()

  // Do not re-prompt on every launch. iOS shows the system dialog exactly
  // once; after a denial you must send the user to Settings.
  if (existing === 'denied') {
    return { granted: false, canAskAgain, needsSettings: true }
  }

  if (existing === 'granted') {
    await registerDeviceToken(userId)
    return { granted: true, canAskAgain, needsSettings: false }
  }

  // Ask from a context that explains why: a bare system prompt on first
  // launch gets a reflexive dismissal that is effectively permanent.
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  })

  if (status === 'granted') await registerDeviceToken(userId)
  return { granted: status === 'granted', canAskAgain, needsSettings: false }
}`}
      />

      <Callout
        variant="warning"
        title="The iOS permission rules are unforgiving"
      >
        <p>
          iOS shows the notification prompt <strong>once</strong>, ever, for a
          given install. Deny it and the only route is{" "}
          <code>Linking.openSettings()</code>. Two consequences: never ask on
          first launch before showing value, and always give the denied state a
          real screen with a Settings button rather than silently disabling
          notifications. Separately, <code>getDevicePushTokenAsync</code> only
          returns a real FCM token on a physical device — the simulator returns
          nothing useful.
        </p>
      </Callout>

      <h2>Registering the token with the backend</h2>

      <p>
        The token is per-install and changes on reinstall, on restore from
        backup to a different device, and after some OS updates. Register it on
        every successful login, not once at install.
      </p>

      <CodeBlock
        language="tsx"
        title="Registering and unregistering the device token"
        code={`import * as Device from 'expo-device'
import Constants from 'expo-constants'

async function registerDeviceToken(userId: string) {
  if (!Device.isDevice) {
    // Push does not work on simulators; skip rather than send garbage.
    return
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId

  const { data: expoToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  })

  // The backend resolves the Expo token to an FCM token and stores both.
  // Storing the Expo token keeps the server provider-agnostic.
  await notificationsApi.registerDevice({
    token: expoToken.data,
    platform: Platform.OS,
    deviceName: Device.deviceName ?? 'Unknown device',
    appVersion: Constants.expoConfig?.version,
  })
}

// On logout, remove the token — otherwise the next person holding the
// device receives this user's order notifications.
await notificationsApi.unregisterDevice(token)`}
      />

      <PropertyTable
        headers={["Field", "Purpose"]}
        rows={[
          ["user", "Who the notification belongs to."],
          ["token", "Expo push token; resolved server-side to FCM."],
          [
            "platform",
            "ios or android — selects the handler config and channel.",
          ],
          [
            "deviceName / appVersion",
            "Lets you find and kill stale tokens after a rollout.",
          ],
          [
            "lastSeenAt",
            "Prune tokens not seen in 30 days. FCM invalidates them silently otherwise.",
          ],
        ]}
      />

      <h2>Foreground versus background handling</h2>

      <p>
        The same listener has to serve two different situations. In the
        foreground the user is looking at the screen, so an in-app banner is
        enough. In the background the app is not running the JavaScript thread,
        so the OS notification handler must be registered at module scope.
      </p>

      <CodeBlock
        language="tsx"
        title="Task manager — must be at module scope, not in an effect"
        code={`import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { router } from 'expo-router'

// Outside any component. Expo captures this at require() time; a handler
// defined inside useEffect is never registered.
TaskManager.defineTask(NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return

  const notification = data?.notification?.request?.content

  // The payload is our navigation instruction. This is what makes a
  // notification deep-link rather than just alert.
  const target = notification?.data as PushPayload | undefined

  if (target?.screen) {
    router.push(target.screen, target.params as any)
  }
})

// Configure the handler once, then register the task.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Must be awaited before app finish() so the task is registered in time.
await TaskManager.defineTask(NOTIFICATION_TASK, taskDefinition)`}
      />

      <Callout variant="danger" title="Handler registration races the OS">
        <p>
          On Android, if the task is not registered before the app process is
          killed and restarted by a notification tap, the handler does not run
          and the user lands on the home screen. Register the task at module
          scope and await it before hiding the splash screen — the splash screen
          is the only reliable synchronisation point you have.
        </p>
      </Callout>

      <h2>Deep-linking from a notification</h2>

      <p>
        Every push payload carries a <code>data</code> object with a{" "}
        <code>screen</code> and <code>params</code>. Expo Router turns that into
        a real navigation, so tapping a notification about order ABC lands on
        the tracking screen for order ABC, not on a home screen the user then
        has to navigate out of.
      </p>

      <CodeBlock
        language="js"
        title="Backend: utils/pushNotification.js — payload construction"
        code={`export async function sendPush(userId, { title, body, data }) {
  const devices = await DeviceToken.find({
    user: userId,
    lastSeenAt: { $gte: new Date(Date.now() - 30 * 864e5) },
  })

  if (devices.length === 0) return { sent: 0, skipped: 1 }

  const messages = devices.map((d) => ({
    to: d.token,
    sound: 'default',
    channelId: 'orders',          // Android channel
    title,
    body,
    data: {
      // Notification type drives both the icon and the destination screen.
      type: data.type,
      screen: SCREENS_BY_TYPE[data.type] ?? '/',
      params: { id: data.orderId ?? data.restaurantId ?? '' },
    },
  }))

  // Chunked because FCM caps a multicast request at 500 tokens.
  for (const chunk of chunkArray(messages, 500)) {
    await expo.sendPushNotificationsAsync(chunk)
  }

  // Persisted regardless of delivery success — the in-app record is the
  // authoritative one, the push is a best-effort nudge toward it.
  await Notification.create({ user: userId, title, body, data, isRead: false })

  return { sent: messages.length, skipped: 0 }
}`}
      />

      <PropertyTable
        headers={["Notification type", "Screen", "Params"]}
        rows={[
          ["order_status", "/order/[id]", "{ id: orderId }"],
          ["order_new", "/orders/[id]", "{ id: orderId } — restaurant only"],
          ["order_assigned", "/delivery/[id]", "{ id: orderId } — rider only"],
          ["verification_result", "/documents", "—"],
          ["payout_processed", "/earnings/payouts", "—"],
          ["offer", "/", "—"],
        ]}
      />

      <p>
        Guard the target screen with the same auth check the router uses. A push
        arriving while the user is signed out must route to login and stash the
        destination, not crash on an undefined order.
      </p>

      <h2>Android notification channels</h2>

      <p>
        Android 8+ requires every notification to belong to a channel, and the
        channel configuration is immutable after creation on most versions —
        changing importance later requires a new channel ID. Create your
        channels deliberately.
      </p>

      <CodeBlock
        language="js"
        title="Three channels, not one"
        code={`const CHANNELS = [
  {
    id: 'orders',
    name: 'Order updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  },
  {
    id: 'orders_silent',
    name: 'Order updates (silent)',
    // LOW importance and no sound: status changes that do not need to
    // interrupt. Used for pickup assignment on riders, who would
    // otherwise get an alert for every order on the platform.
    importance: Notifications.AndroidImportance.LOW,
    sound: undefined,
  },
  {
    id: 'reminders',
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
]`}
      />

      <Callout
        variant="note"
        title="Respect the user's notification preferences"
      >
        <p>
          <code>PUT /api/notifications/preferences</code> stores per-channel
          email, push, and SMS toggles. Check them server-side before sending —
          honouring an opt-out only in the client UI is not honouring it.
        </p>
      </Callout>

      <h2>Local notifications</h2>

      <p>
        Some of the most valuable notifications never come from the server. They
        are scheduled on the device, fire whether or not the app is running, and
        cost nothing.
      </p>

      <CodeBlock
        language="tsx"
        title="Scheduling order-related local reminders"
        code={`// Preparation timer: notify the restaurant when the food should
// be ready, so a slow kitchen catches itself before the customer does.
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Order ready soon',
    body: \`\${order.orderId} should be plated in \${order.preparationTime} min\`,
    data: { type: 'order_status', screen: '/orders/[id]', params: { id: order._id } },
  },
  trigger: {
    channelId: 'reminders',
    seconds: Math.max(30, order.preparationTime * 60 - 300),
  },
})

// Cancel on every state change, or the rider gets notified about an
// order that was already delivered.
await Notifications.cancelScheduledNotificationAsync(triggerId)`}
      />

      <h2>Testing push, honestly</h2>

      <p>
        This is where most projects lose an afternoon, so it is worth being
        blunt about what does and does not work.
      </p>

      <PropertyTable
        headers={["Setup", "Works?", "Notes"]}
        rows={[
          [
            "Expo Go, Android",
            "Unreliable",
            "Expo Go strips the FCM native module. Push silently does nothing.",
          ],
          [
            "Expo Go, iOS",
            "Works for basic cases",
            "Expo Go has its own Expo account token; test-mode FCM behaves differently.",
          ],
          [
            "Development build, physical device",
            "Yes",
            "This is the only configuration that matches production.",
          ],
          [
            "Simulator / emulator",
            "No",
            "Neither platform delivers APNs or FCM to a simulator.",
          ],
        ]}
      />

      <Steps>
        <Step title="Build a development client">
          <CodeBlock
            language="bash"
            title="A dev build, not Expo Go"
            code={`npx expo install expo-dev-client
npx expo prebuild
eas build --profile development --platform android`}
          />
        </Step>

        <Step title="Configure credentials for EAS">
          <p>
            <code>eas credentials</code> generates the APNs key and uploads the
            FCM service account. Do this once per project; the credentials live
            in EAS, not in the repository.
          </p>
        </Step>

        <Step title="Register a real device">
          <p>
            <code>Device.isDevice</code> must be true for a token to be
            returned. Log the token to confirm registration reached the backend,
            then check that the <code>DeviceToken</code> document exists.
          </p>
        </Step>

        <Step title="Send a test push from the dashboard, not from curl">
          <p>
            Use Stripe-style test tooling or a small admin endpoint. Sending raw
            FCM by hand skips the Expo token resolution step and will fail in
            confusing ways.
          </p>
        </Step>

        <Step title="Test the three states explicitly">
          <p>
            Foreground, backgrounded, and app-killed. Each has different code
            paths, and the app-killed case is the one that is broken more often
            than not.
          </p>
        </Step>
      </Steps>

      <Callout variant="danger" title="Expo Go is not a push test environment">
        <p>
          If your notifications work in Expo Go and not in a development build,
          the failure is almost certainly missing native FCM configuration
          rather than your code. Build the dev client before you start debugging
          anything — otherwise you will spend hours fixing working code.
        </p>
      </Callout>

      <h2>Observing delivery</h2>

      <p>
        Push delivery is a black box unless you measure it. Log every send and
        every FCM response, and expose a delivery rate.
      </p>

      <CodeBlock
        language="js"
        title="A metric worth having: push delivery rate"
        code={`// Sent from the backend on every sendPush call.
metrics.increment('push.sent', { type, platform })
metrics.increment('push.failed', { type, reason: err.code })

// Feed from FCM delivery reports where available, or infer from
// GET /api/notifications/:id/read — a notification that is never opened
// was either never delivered or never seen.`}
      />

      <p>
        An unexplained drop in delivery rate after an iOS release usually means
        a token pruning problem, not a code problem — FCM invalidated a batch of
        tokens and <code>lastSeenAt</code> pruning is the only thing that
        removes them. See{" "}
        <a href="/docs/production/observability">Logging &amp; Monitoring</a>.
      </p>
    </>
  );
}

export function AdminSetup() {
  return (
    <>
      <p>
        The admin panel is an internal tool: a handful of operators, desktop
        browser, dense tables. That constraint shapes every decision. It does
        not need SSR, SEO, or a component framework — it needs to start
        instantly, render ten thousand rows without lag, and be boring in the
        way that internal tools should be.
      </p>

      <p>
        NutriDeliver&rsquo;s admin panel is React 19 on Vite with TypeScript,
        Tailwind CSS v4, shadcn/ui, Redux Toolkit, and react-router. This
        chapter covers standing it up and the structure that keeps it
        maintainable.
      </p>

      <h2>Create the project</h2>

      <Steps>
        <Step title="Scaffold with Vite's React TypeScript template">
          <CodeBlock
            language="bash"
            title="Scaffold"
            code={`npm create vite@latest adminPanel -- --template react-ts
cd adminPanel
npm install`}
          />
        </Step>

        <Step title="Install Tailwind v4">
          <p>
            Tailwind v4 has no <code>tailwind.config.js</code> and no PostCSS
            plugin package beyond the single <code>@tailwindcss/postcss</code>{" "}
            entry. The whole configuration lives in your CSS file.
          </p>
          <CodeBlock
            language="bash"
            title="Tailwind v4 — two packages"
            code={`npm i tailwindcss @tailwindcss/postcss postcss autoprefixer`}
          />
          <CodeBlock
            language="text"
            title="postcss.config.js"
            code={`export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}`}
          />
          <CodeBlock
            language="css"
            title="src/index.css — the entire Tailwind setup"
            code={`@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-card: 0.75rem;
}

@custom-variant dark (&:is(.dark *));`}
          />
        </Step>

        <Step title="Initialise shadcn/ui">
          <CodeBlock
            language="bash"
            title="shadcn init"
            code={`npx shadcn@latest init

# Add what the dashboard actually needs.
npx shadcn@latest add button card badge input label \\
  table dialog dropdown-menu select sheet skeleton switch \\
  tabs toast tooltip separator scroll-area pagination`}
          />
        </Step>
      </Steps>

      <h2>Why shadcn/ui</h2>

      <p>
        This is the one styling decision worth defending properly, because a
        component library is a long-term commitment.
      </p>

      <Split
        left={{
          title: "What shadcn/ui is",
          children: (
            <ul>
              <li>
                Not a dependency. The CLI copies component source into your
                repo.
              </li>
              <li>
                Built on Radix primitives for accessibility, styled with
                Tailwind and CVA.
              </li>
              <li>
                You can read, edit, or delete any component — nothing is hidden
                in node_modules.
              </li>
              <li>New components arrive as a pull request you review.</li>
            </ul>
          ),
        }}
        right={{
          title: "What it costs you",
          children: (
            <ul>
              <li>
                No automatic upgrades — upstream changes do not reach you.
              </li>
              <li>
                Consistency is a team discipline, not an enforced constraint.
              </li>
              <li>You own every accessibility bug in copied source.</li>
              <li>Adding a component is an explicit action, not an install.</li>
            </ul>
          ),
        }}
      />

      <p>
        The trade is ownership. In an internal tool you will inevitably need a{" "}
        <code>DataTable</code> that behaves unlike anything upstream shipped,
        and with a traditional library you would file an issue and wait. With
        shadcn you edit a file you already own. For a product like this — dense,
        bespoke, and operated by a small team — that is the right trade.
      </p>

      <Callout variant="note" title="What is actually in the repository">
        <p>
          NutriDeliver ships <code>accordion</code>, <code>alert-dialog</code>,{" "}
          <code>avatar</code>, <code>badge</code>, <code>button</code>,{" "}
          <code>card</code>, <code>checkbox</code>, <code>dialog</code>,{" "}
          <code>dropdown-menu</code>, <code>hover-card</code>,{" "}
          <code>input</code>, <code>label</code>, <code>pagination</code>,{" "}
          <code>popover</code>, <code>progress</code>, <code>radio-group</code>,{" "}
          <code>scroll-area</code>, <code>select</code>, <code>separator</code>,{" "}
          <code>skeleton</code>, <code>switch</code>, <code>table</code>,{" "}
          <code>tabs</code>, <code>textarea</code>, <code>toast</code>,{" "}
          <code>tooltip</code> — thirty components with the full Radix suite
          behind them.
        </p>
      </Callout>

      <h2>The cn() helper</h2>

      <p>
        Every shadcn component styles itself by merging a caller-supplied{" "}
        <code>className</code> over its defaults. Plain string concatenation
        produces conflicting Tailwind classes where both end up in the DOM and
        the winner is decided by stylesheet order, not intent.{" "}
        <code>tailwind-merge</code> resolves that properly by understanding
        which utilities conflict.
      </p>

      <CodeBlock
        language="ts"
        title="src/lib/utils.ts"
        code={`import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Without tailwind-merge, both classes survive and the one defined later in
// your stylesheet wins — regardless of which was passed as the override.
//   cn('px-4 py-2', 'px-6')   →  'px-6 py-2'   (correct)
//   'px-4 px-6'               →  'px-4 px-6'   (undefined behaviour)`}
      />

      <h2>Theme tokens</h2>

      <p>
        Colour is defined once as CSS custom properties on a semantic scale.
        Components reference the semantic name, never a raw value, which makes
        dark mode a single class toggle rather than a theme system you maintain.
      </p>

      <CodeBlock
        language="css"
        title="src/index.css — semantic tokens in oklch"
        code={`:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card:      oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover:   oklch(1 0 0);
  --primary:   oklch(0.55 0.15 155);
  --primary-foreground: oklch(0.985 0 0);
  --muted:     oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border:    oklch(0.922 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --success:   oklch(0.627 0.17 149.2);
  --warning:   oklch(0.769 0.188 70.08);
  --radius:    0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary:   oklch(0.70 0.15 155);
  --muted:     oklch(0.269 0 0);
  --border:    oklch(1 0 0 / 12%);
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}`}
      />

      <Callout
        variant="tip"
        title="Semantic status colours earn their keep here"
      >
        <p>
          Order status badges are used on every table, every detail panel, and
          every notification. Define <code>success</code>, <code>warning</code>,
          and <code>destructive</code> once and map the order state machine onto
          them. Adding a new state then becomes a one-line change in the badge
          component rather than an audit of every screen.
        </p>
      </Callout>

      <h3>Dark mode</h3>

      <p>
        <code>next-themes</code> adds a class to{" "}
        <code>document.documentElement</code> and persists the choice. Three
        states — light, dark, system — and no flash on load, because the class
        is applied before React mounts.
      </p>

      <h2>Folder structure</h2>

      <p>
        Features are grouped by domain, not by component type. A feature folder
        owns its API client, its types, its components, and its pages. Adding a
        domain means adding one folder, which is the property you want.
      </p>

      <CodeBlock
        language="text"
        title="src/ — the layout NutriDeliver uses"
        code={`src/
├── main.tsx               Router + providers
├── App.tsx
│
├── components/
│   ├── ui/                shadcn primitives — owned, editable
│   ├── layout/            Sidebar, Header, Breadcrumb, PageShell
│   ├── common/            DataTable, StatusBadge, EmptyState, ConfirmDialog
│   └── form/              FormField wrappers around Label + Input + error
│
├── features/              One folder per domain
│   ├── auth/              Login page, ProtectedRoute, session helpers
│   ├── dashboard/         KPI tiles, charts, recent activity
│   ├── users/             Users table, user detail, suspend action
│   ├── restaurants/       List, detail, verification queue
│   ├── riders/            List, detail, verification, performance
│   ├── orders/            Orders table, detail, intervention, refund
│   ├── food/              Food items, categories
│   ├── categories/
│   ├── offers/
│   ├── payments/          Payment history, refund queue
│   ├── notifications/
│   ├── settings/          Platform settings form
│   └── admins/
│
├── services/
│   ├── api.ts             axios instance, interceptors, envelope unwrapping
│   ├── tokenStorage.ts    Token persistence
│   └── api/               One module per domain: auth.ts, orders.ts, …
│
├── store/
│   ├── index.ts           configureStore + root reducer
│   ├── hooks.ts           useAppDispatch / useAppSelector
│   ├── persistence.ts     localStorage rehydration
│   └── slices/            authSlice.ts, uiSlice.ts, …
│
├── types/                 Shared TypeScript interfaces
├── hooks/                 useToast and other cross-cutting hooks
└── lib/utils.ts           cn()`}
      />

      <h2>The API client</h2>

      <p>
        One axios instance, three interceptors, and a single unwrapping point.
        The response envelope is uniform across the API, so it should be
        unwrapped once rather than in every component.
      </p>

      <CodeBlock
        language="ts"
        title="src/services/api/client.ts"
        code={`import axios from 'axios'
import { getToken, clearToken } from '../tokenStorage'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20_000,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = \`Bearer \${token}\`
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // A 401 anywhere means the session is gone. Clearing it and hard-
    // navigating avoids a dashboard full of broken tables.
    if (error.response?.status === 401) {
      clearToken()
      window.location.assign('/login')
    }
    return Promise.reject(normaliseError(error))
  },
)

// One envelope shape, unwrapped once.
export const unwrap = <T>(res: ApiSuccess<T>): T => res.data`}
      />

      <h2>The layout shell</h2>

      <p>
        Four pieces: a collapsible sidebar, a sticky header with search and the
        user menu, a breadcrumb derived from the route, and a command palette.
        All four are presentational — they take state from the router and a UI
        slice, and know nothing about the domain.
      </p>

      <CodeBlock
        language="tsx"
        title="src/components/layout/AppShell.tsx"
        code={`export function AppShell() {
  const [collapsed, setCollapsed] = useAppSelector((s) => s.ui.sidebarCollapsed)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => dispatch(toggleSidebar())}
        items={NAV_ITEMS}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-6 py-6">
            <Breadcrumb />
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}`}
      />

      <p>
        The sidebar collapses to icons below a width, and the state persists in
        the UI slice. Operators who use this tool eight hours a day will
        rearrange it once and never again — persistence is worth more than any
        layout cleverness.
      </p>

      <h3>Command palette</h3>

      <p>
        Built on <code>cmdk</code> and bound to <code>cmd+k</code>. In a
        dashboard with a dozen tables, the fastest path is usually not through
        the sidebar at all: type &ldquo;restaurants&rdquo;, hit enter, land
        there. This is a small feature that operators adopt immediately and
        never give up.
      </p>

      <CodeBlock
        language="tsx"
        title="src/components/layout/CommandPalette.tsx"
        code={`import { Command } from 'cmdk'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // Registered once, works from anywhere, including inside table inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const run = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0">
        <Command>
          <Command.Input placeholder="Jump to…" />
          <Command.List>
            <Command.Empty>No results.</Command.Empty>
            <Command.Group heading="Navigate">
              {NAV_ITEMS.map((item) => (
                <Command.Item key={item.href} onSelect={() => run(item.href)}>
                  {item.title}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}`}
      />

      <h2>Routing</h2>

      <p>
        React Router 7 with <code>createBrowserRouter</code>. Route guards are
        layout routes, not scattered checks, so a new screen cannot accidentally
        ship unprotected.
      </p>

      <CodeBlock
        language="tsx"
        title="src/main.tsx — guarded route tree"
        code={`const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'users',         element: <UsersPage /> },
          { path: 'users/:id',     element: <UserDetailPage /> },
          { path: 'restaurants',   element: <RestaurantsPage /> },
          { path: 'restaurants/:id', element: <RestaurantDetailPage /> },
          { path: 'riders',        element: <RidersPage /> },
          { path: 'orders',        element: <OrdersPage /> },
          { path: 'orders/:id',    element: <OrderDetailPage /> },
          { path: 'offers',        element: <OffersPage /> },
          { path: 'categories',    element: <CategoriesPage /> },
          { path: 'settings',      element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: 'login', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
])`}
      />

      <CodeBlock
        language="tsx"
        title="src/features/auth/RequireAuth.tsx"
        code={`export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth)
  const location = useLocation()

  // Render nothing while the session is being validated. Redirecting here
  // is what causes the login screen to flash on every hard refresh.
  if (isLoading) return <FullPageSpinner />

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}`}
      />

      <Callout variant="warning" title="The host must rewrite unknown paths">
        <p>
          <code>createBrowserRouter</code> uses history URLs. A request for{" "}
          <code>/orders/abc123</code> hits the static host as a file, which does
          not exist, and the user gets a 404 instead of the app. Every
          deployment needs a rewrite to <code>index.html</code>. See{" "}
          <a href="/docs/production/deployment">Deployment</a>.
        </p>
      </Callout>

      <h2>TypeScript configuration</h2>

      <p>
        TypeScript 6 with strict mode and the path alias wired into both the
        compiler and the bundler. The alias is not cosmetic:{" "}
        <code>@/features/orders</code> survives a file move that{" "}
        <code>../../features/orders</code> does not.
      </p>

      <CodeBlock
        language="json"
        title="tsconfig.app.json — the parts that matter"
        code={`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}`}
      />

      <CodeBlock
        language="ts"
        title="vite.config.ts — the alias must be declared twice"
        code={`import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // tsconfig handles the type checker; Vite handles the bundler.
      // Declaring it in only one place produces a wall of
      // "cannot find module" errors that look like TS problems.
      '@': path.resolve(__dirname, './src'),
    },
  },
})`}
      />

      <p>
        <code>npm run build</code> runs <code>tsc -b</code> before{" "}
        <code>vite build</code>, so a type error fails the build rather than
        shipping. Keep it that way — the build gate is the only thing standing
        between a refactor and a runtime crash in an internal tool.
      </p>

      <Callout variant="note" title="What to verify before moving on">
        <p>
          Build once and open the dist output through a static server with the
          rewrite configured. A dev server will not catch the SPA routing
          problem, and discovering it at deployment time is a bad use of
          everyone&rsquo;s afternoon.
        </p>
      </Callout>
    </>
  );
}

export function AdminState() {
  return (
    <>
      <p>
        Redux Toolkit is in the admin panel for client state — who is signed in,
        which table is sorted how, whether the sidebar is collapsed — and for
        server state via thunks. The second use is where discipline matters.
        Getting it wrong produces a store that duplicates the database and is
        subtly wrong three hours later.
      </p>

      <h2>configureStore and typed hooks</h2>

      <p>
        Two rules, applied without exception: no <code>useSelector</code> or{" "}
        <code>useDispatch</code> directly from <code>react-redux</code>, and no
        untyped store access from components. The typed hooks are three lines
        and they are what make refactoring possible.
      </p>

      <CodeBlock
        language="ts"
        title="src/store/index.ts"
        code={`import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        // FormData and File objects for the document upload forms are not
        // serialisable and do not need to be. Everything else stays checked.
        ignoredActionPaths: ['meta.arg.formData'],
      },
    }),
  devTools: import.meta.env.DEV,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch`}
      />

      <CodeBlock
        language="ts"
        title="src/store/hooks.ts"
        code={`import { useDispatch, useSelector, useStore } from 'react-redux'
import type { AppDispatch, RootState } from './index'

// Components import these, never the react-redux originals. Without them,
// state.users is 'any' and a renamed slice fails silently.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<typeof store>()`}
      />

      <h2>The auth slice</h2>

      <p>
        Auth is the one slice where persistence is non-negotiable, and it is
        also the one with a subtle correctness requirement: a network failure
        during session restore must not log the operator out.
      </p>

      <CodeBlock
        language="ts"
        title="src/store/slices/authSlice.ts"
        code={`import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authApi } from '@/services/api/auth'
import { clearToken, getToken, setToken } from '@/services/tokenStorage'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// Validates the persisted token against /auth/me on every app boot. The
// token might have been revoked, the operator might have been suspended, or
// the access token might have expired — none of which local state can tell you.
export const restoreSession = createAsyncThunk('auth/restore', async () => {
  if (!getToken()) return null

  try {
    const res = await authApi.getMe()
    if (!res.success) {
      clearToken()
      return null
    }
    return (res.data.user ?? res.data) as User
  } catch {
    // Deliberately swallows the error. A laptop that woke up without wifi
    // must not eject the operator mid-task; the token is still valid and
    // the next request will succeed or trigger the 401 interceptor.
    return null
  }
})

export const login = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  const res = await authApi.login(credentials.email, credentials.password)

  if (!res.success || !res.data?.token) {
    return rejectWithValue(res.message ?? 'Invalid credentials')
  }

  setToken(res.data.token)
  return res.data.user as User
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } catch {
    // Best effort — the local session is cleared either way.
  }
  clearToken()
  return null
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Called by the axios 401 interceptor path.
    clearSession: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
    },
  },
  extraReducers: (b) => {
    b.addCase(restoreSession.pending, (state) => {
      state.isLoading = true
    })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
        } else if (!getToken()) {
          state.user = null
          state.isAuthenticated = false
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isLoading = false
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.error = action.payload ?? 'Login failed'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
  },
})

export const { clearError, clearSession } = authSlice.actions
export default authSlice.reducer`}
      />

      <Callout variant="note" title="Thunks own side effects, slices own state">
        <p>
          Every network call lives in a thunk. Reducers stay pure, which means
          they are trivially testable and safe to replay in Redux DevTools. A
          reducer that calls <code>axios</code> is a reducer you cannot test
          without a network mock.
        </p>
      </Callout>

      <h3>Persisting the session</h3>

      <p>
        A small subscribe listener writes the user to <code>localStorage</code>{" "}
        so the header renders its avatar on the first paint rather than after{" "}
        <code>/auth/me</code> resolves. The token is stored separately and never
        in the persisted slice.
      </p>

      <CodeBlock
        language="ts"
        title="src/store/persistence.ts"
        code={`const PERSIST_KEY = 'nutrideliver.admin.auth'
const UI_KEY = 'nutrideliver.admin.ui'

export function loadPersistedAuth(): Partial<AuthState> | undefined {
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY) ?? 'null') ?? undefined
  } catch {
    return undefined
  }
}

export function persistAuth(state: RootState) {
  // Only non-sensitive display data. The token lives in tokenStorage and
  // never enters Redux state, so it cannot be serialised into a backup
  // or a DevTools export.
  localStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({ user: state.auth.user }),
  )
}`}
      />

      <h2>Fetching server data</h2>

      <p>
        For the admin panel, <code>createAsyncThunk</code> is the right tool
        rather than RTK Query. RTK Query is excellent, but the admin surface is
        a long tail of endpoints used by exactly one screen each, and wrapping
        dozens of one-off endpoints in API slices is more ceremony than it
        saves.
      </p>

      <CodeBlock
        language="ts"
        title="src/features/orders/ordersThunks.ts"
        code={`import { createAsyncThunk } from '@reduxjs/toolkit'
import { ordersApi } from '@/services/api/orders'

export const fetchOrders = createAsyncThunk<
  { orders: Order[]; pagination: Pagination },
  OrdersQuery,
  { rejectValue: string }
>('orders/fetch', async (query, { rejectWithValue }) => {
  try {
    const res = await ordersApi.list(query)
    if (!res.success) return rejectWithValue(res.message)
    return res.data
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load orders',
    )
  }
})

// Mutations invalidate rather than patch. A refund changes money, a status
// changes, and the agent's local copy is now worse than a fresh fetch.
export const refundOrder = createAsyncThunk<
  Order,
  { orderId: string; amount: number; reason: string },
  { rejectValue: string }
>('orders/refund', async (payload, { rejectWithValue, dispatch }) => {
  const res = await ordersApi.refund(payload.orderId, payload)
  if (!res.success) return rejectWithValue(res.message)

  await dispatch(fetchOrders(currentQueryFromState))  // re-read the page
  return res.data.order
})`}
      />

      <PropertyTable
        headers={["Slice field", "Type", "Purpose"]}
        rows={[
          ["items", "Record<string, T> or T[]", "The current page of rows."],
          [
            "ids",
            "EntityId[]",
            "Adapter-managed ordering; drives row rendering.",
          ],
          [
            "status",
            "'idle' | 'loading' | 'succeeded' | 'failed'",
            "Drives skeleton, table, or error state.",
          ],
          [
            "error",
            "string | null",
            "Server message, safe to show to an operator.",
          ],
          [
            "query",
            "OrdersQuery",
            "Current filters, sort, page — the request parameters.",
          ],
          [
            "pagination",
            "Pagination",
            "page, limit, total, totalPages from the server.",
          ],
        ]}
      />

      <h2>Normalised entity state</h2>

      <p>
        This is the single most important structural decision in the admin
        store. Without normalisation, a table of twenty orders rendered with a
        populated restaurant on each row stores twenty copies of the same
        restaurant object. Change one and you have to find all twenty.
      </p>

      <CodeBlock
        language="ts"
        title="src/features/orders/ordersSlice.ts — createEntityAdapter"
        code={`import {
  createEntityAdapter,
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit'

export const ordersAdapter = createEntityAdapter<Order>({
  // Must match the API's sort, or row order diverges from the server's.
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
  selectId: (order) => order._id,
})

// Exported so components get typed selectors for free.
export const ordersSelectors = ordersAdapter.getSelectors<RootState>(
  (state) => state.orders,
)

// Which restaurants are already in the store? Only fetch those.
const missingRestaurantIds = createSelector(
  (ids: EntityId[]) => ids,
  (state: RootState) => state.restaurants.entities,
  (ids, entities) => ids.filter((id) => !entities[id as string]),
)

const initialState = ordersAdapter.getInitialState({
  status: 'idle' as RequestStatus,
  error: null as string | null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } as Pagination,
  query: { page: 1, limit: 20, sortBy: 'createdAt', order: 'desc' } as OrdersQuery,
})

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<Partial<OrdersQuery>>) => {
      // Any filter change resets to page 1. Leaving the operator on page 7
      // of a result set that now has two pages is a classic bug.
      state.query = { ...state.query, ...action.payload, page: 1 }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchOrders.pending, (state) => {
      state.status = 'loading'
      state.error = null
    })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // upsertMany, not setAll: other screens may hold rows that are
        // not in this page's result set, and replacing them all would
        // empty a table the operator is looking at.
        ordersAdapter.upsertMany(state, action.payload.orders)
        state.pagination = action.payload.pagination
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Something went wrong'
      })
  },
})

export const { setQuery, clearError } = ordersSlice.actions
export default ordersSlice.reducer`}
      />

      <Callout variant="warning" title="upsertMany, never setAll">
        <p>
          <code>setAll</code> replaces the entire collection with the current
          page. Open the order detail drawer on page 1, navigate to page 2, and
          the drawer's data vanishes — because it is no longer in the store. Use{" "}
          <code>upsertMany</code> for paginated fetches and <code>setAll</code>{" "}
          only for a full unfiltered list.
        </p>
      </Callout>

      <h3>Why normalisation matters concretely</h3>

      <Split
        left={{
          title: "Denormalised",
          children: (
            <ul>
              <li>
                20 orders, each with a populated restaurant → 20 restaurant
                objects.
              </li>
              <li>
                Suspending a restaurant requires updating every row that
                references it.
              </li>
              <li>Memory grows with page size for no reason.</li>
              <li>Two rows can disagree, and one will be stale.</li>
            </ul>
          ),
        }}
        right={{
          title: "Normalised",
          children: (
            <ul>
              <li>
                One restaurant object; 20 order rows hold a string reference.
              </li>
              <li>A single update to the entity fixes every view.</li>
              <li>
                Adding a detail drawer is free — the data is already there.
              </li>
              <li>Server-side driven invalidation touches one entity.</li>
            </ul>
          ),
        }}
      />

      <h2>Pagination state per screen</h2>

      <p>
        Each table owns its own query and pagination state. Sharing one global
        page number across every table means sorting the orders table changes
        the users table, which is baffling to an operator.
      </p>

      <CodeBlock
        language="ts"
        title="useOrdersTable — sorting, filtering, pagination in one hook"
        code={`export function useOrdersTable() {
  const dispatch = useAppDispatch()
  const query = useAppSelector((s) => s.orders.query)
  const pagination = useAppSelector((s) => s.orders.pagination)
  const status = useAppSelector((s) => s.orders.status)
  const error = useAppSelector((s) => s.orders.error)

  const { data, isFetching } = useQuery({
    queryKey: ['admin-orders', query],
    queryFn: () => ordersApi.list(query).then((r) => r.data),
    // Operator tables are not a real-time product. A short stale time plus
    // explicit refresh is the right trade.
    staleTime: 15_000,
    placeholderData: keepPreviousData,   // no spinner on page change
  })

  const columns = useMemo(
    () =>
      createOrderColumns({
        sortBy: query.sortBy,
        order: query.order,
        onSort: (sortBy) => dispatch(setQuery({ sortBy })),
      }),
    [dispatch, query.sortBy, query.order],
  )

  return { columns, data, pagination, status, error, isFetching, dispatch }
}`}
      />

      <p>
        Sorting and filtering are always server-side. A 50,000-row table that
        sorts in the browser works fine until it does not, and the fix at that
        point is a rewrite rather than an optimisation.
      </p>

      <h2>Where not to put server data</h2>

      <Callout variant="danger" title="Redux is not a database">
        <p>
          Anything that arrives from the API on its own schedule — a dashboard
          total, an unread notification count, a table page — belongs in a query
          cache, not in a Redux slice. Redux holds state the application owns.
          The moment a value is only ever copied from a server response and
          never modified by a user action, it does not belong in the store.
        </p>
      </Callout>

      <PropertyTable
        headers={["State", "Where it goes", "Why"]}
        rows={[
          [
            "Current operator and permissions",
            "Redux auth slice, persisted",
            "Read by nearly every screen; survives refresh.",
          ],
          [
            "Sidebar collapsed, theme, table density",
            "Redux ui slice, persisted",
            "Pure client preference, no server involvement.",
          ],
          [
            "Table sort/filter/page",
            "Redux feature slice",
            "Must survive navigation away and back.",
          ],
          [
            "Dashboard KPI totals",
            "Query cache",
            "Fetched, displayed, discarded. Never mutated.",
          ],
          [
            "Unread notification count",
            "Query cache, polled",
            "Changes on a schedule the app does not control.",
          ],
          [
            "Entity collections (users, orders)",
            "Redux with createEntityAdapter",
            "Shared across screens, mutated by actions.",
          ],
          [
            "Form field values",
            "Local state or react-hook-form",
            "Scoped to one component lifecycle.",
          ],
          [
            "Modal open/closed, row selection",
            "Local component state",
            "Nothing else observes it.",
          ],
        ]}
      />

      <p>
        A practical test: if reloading the page would be an acceptable way to
        clear it, and no component outside the one that set it reads it, it
        belongs in local state. The Redux store should be the smallest store
        that makes the application correct.
      </p>

      <h2>Registering the slices</h2>

      <CodeBlock
        language="ts"
        title="src/store/index.ts — the full reducer map"
        code={`import { combineReducers } from '@reduxjs/toolkit'

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  users: usersReducer,
  restaurants: restaurantsReducer,
  riders: ridersReducer,
  orders: ordersReducer,
  payments: paymentsReducer,
  offers: offersReducer,
  categories: categoriesReducer,
  notifications: notificationsReducer,
  settings: settingsReducer,
  admins: adminsReducer,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { ignoredActionPaths: ['meta.arg.formData'] } }),
})`}
      />

      <Callout variant="tip" title="DevTools is not a luxury">
        <p>
          With normalized state and thunks, you can replay any action, step
          through a reducer, and see exactly which state transition broke a
          table. Leave <code>devTools</code> on in development — it is the
          fastest debugging tool in the panel and it costs nothing.
        </p>
      </Callout>
    </>
  );
}

export function AdminDashboard() {
  return (
    <>
      <p>
        The dashboard is the admin panel&rsquo;s reputation. If an operator
        opens it once and trusts it, every other screen gets used. If it shows
        numbers that do not reconcile with the orders table, they will use
        nothing.
      </p>

      <p>
        Everything on it is driven by{" "}
        <code>GET /api/admin/analytics/platform</code>,{" "}
        <code>/api/admin/analytics/sales</code>, and{" "}
        <code>/api/admin/analytics/users</code> — aggregation pipelines
        described in <a href="/docs/backend/analytics">Analytics Endpoints</a>.
      </p>

      <h2>The shell, in full</h2>

      <p>
        Before breaking it down, here is the whole thing assembled: a persistent
        sidebar of fourteen destinations, a global search, and a content area
        that changes per route. Note that the navigation is role-appropriate —
        every item here is an admin capability, and a restaurant owner logging
        into the same panel sees a visibly smaller list.
      </p>

      <Screenshot
        src={dashboardImage}
        alt="The NutriDeliver admin dashboard showing a left sidebar of fourteen sections including Dashboard, Users, Restaurants, Food Items, Categories, Orders, Payments, Offers, Notifications, Riders, Admins, Analytics and Settings. The main area shows six KPI cards for Total Users, Total Restaurants, Total Riders, Total Orders, Total Revenue and Pending Payments, above empty Recent Orders, Top Restaurants, Sales Overview and Order Status panels."
        caption="The admin dashboard. Six KPI cards across the top, each with a contextual sub-line — “4 new in last 30 days”, “1 active · 0 verified” — so a number is never shown without the context that makes it mean something."
      />

      <Callout variant="note" title="The empty states are doing work">
        <p>
          Every panel below the KPIs renders a specific empty state — &ldquo;No
          orders yet&rdquo;, &ldquo;No sales recorded in this period&rdquo; —
          rather than a blank card or a spinner that never resolves. An operator
          seeing an empty panel learns that the feature exists and is simply
          unused; an empty box teaches nothing.
        </p>
      </Callout>

      <h2>KPI cards</h2>

      <p>
        Four tiles across the top: total users, active restaurants, orders, and
        revenue. Each shows a value, a delta against the previous period, and a
        one-line trend sparkline. The delta matters more than the number — a
        revenue figure without context is not actionable.
      </p>

      <CodeBlock
        language="tsx"
        title="src/features/dashboard/KpiCard.tsx"
        code={`interface KpiCardProps {
  label: string
  value: string
  delta: number          // 0.12 = +12% vs previous period
  series: number[]       // for the sparkline
  loading?: boolean
}

export function KpiCard({ label, value, delta, series, loading }: KpiCardProps) {
  const positive = delta >= 0

  return (
    <Card className="p-5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <>
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  positive ? 'text-success' : 'text-destructive',
                )}
              >
                {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {positive ? '+' : ''}
                {(delta * 100).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
            <Sparkline data={series} className="mt-3 h-8" />
          </>
        )}
      </CardContent>
    </Card>
  )
}`}
      />

      <Callout variant="tip" title="Tabular numerals for every currency">
        <p>
          Without <code>tabular-nums</code>, digits have varying widths and the
          column jitters as values update. On a dashboard that refreshes, the
          constant horizontal movement is genuinely distracting.
        </p>
      </Callout>

      <h2>Charts</h2>

      <p>
        Use Recharts. The reasoning is not that hand-rolled SVG is impossible —
        it is that a charting library handles axes, ticks, responsive resizing,
        tooltips, legends, and animation correctness, and none of those are
        where your product differentiation lives.
      </p>

      <Split
        left={{
          title: "What Recharts gives you",
          children: (
            <ul>
              <li>Responsive containers that survive a sidebar collapse.</li>
              <li>
                Formatters, so currency renders consistently across charts.
              </li>
              <li>
                Tooltips with hit-testing you would otherwise write by hand.
              </li>
              <li>
                Bar, line, area, and pie from one coherent visual language.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Where it costs you",
          children: (
            <ul>
              <li>
                Roughly 400 KB gzipped — lazy-load it, do not bundle it eagerly.
              </li>
              <li>Bundle size grows with every chart type you import.</li>
              <li>Deeply custom visualisations eventually outgrow it.</li>
              <li>
                Animations cost frames on a large dataset; disable them past
                ~500 points.
              </li>
            </ul>
          ),
        }}
      />

      <CodeBlock
        language="tsx"
        title="src/features/dashboard/SalesChart.tsx"
        code={`import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'

export function SalesChart({ period }: { period: Period }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sales', period],
    queryFn: () => analyticsApi.sales(period).then((r) => r.data),
    staleTime: 300_000,   // aggregates; five minutes is invisible
  })

  if (isLoading) return <ChartSkeleton />

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data?.salesOverTime ?? []} margin={{ top: 8, right: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis
          dataKey="_id"
          tickFormatter={(v: string) => format(new Date(v), 'MMM d')}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => compactCurrency(v)}
          width={56}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip formatter={currency} />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Legend />
        <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}`}
      />

      <p>
        Dual axes for orders and revenue invite the reader to compare quantities
        of different things. If you do need it, two separate charts communicate
        better than one chart with two scales.
      </p>

      <h3>Charts worth having</h3>

      <PropertyTable
        headers={["Chart", "Endpoint", "The question it answers"]}
        rows={[
          [
            "Orders and revenue over time",
            "/analytics/sales?period=",
            "Are we growing, and is growth profitable?",
          ],
          [
            "Order status distribution",
            "/analytics/platform → orders.byStatus",
            "Where are orders getting stuck?",
          ],
          [
            "User growth by role",
            "/analytics/users",
            "Which role is growing, and is it the right one?",
          ],
          [
            "Average order value by role",
            "/analytics/users",
            "Are we attracting high-value or low-value users?",
          ],
          [
            "Top restaurants",
            "/analytics/sales → topRestaurants",
            "Who is doing the work?",
          ],
          [
            "Popular items",
            "/analytics/sales → popularItems",
            "What should we be merchandising?",
          ],
        ]}
      />

      <p>
        The status distribution chart is the most operationally useful one on
        the page. A spike in <code>ready_for_pickup</code> means no riders are
        online; a spike in <code>confirmed</code> means restaurants are slow to
        start cooking.
      </p>

      <h2>Data tables</h2>

      <p>
        The workhorse of this panel. Sorting, filtering, and pagination all
        happen on the server — the client sends a query and renders rows.
      </p>

      <Diagram caption="One table component, driven by a query object">
        {`
  ┌────────────────────────────────────────────────────────┐
  │ search │ role filter │ status filter │ date range     │
  ├────────────────────────────────────────────────────────┤
  │ Name ↑ │ Role │ Status │ Orders │ Revenue │ actions   │
  ├────────────────────────────────────────────────────────┤
  │ …                                                    │
  ├────────────────────────────────────────────────────────┤
  │  Showing 21–40 of 3,412        [‹] 1 2 3 … 86 [›]    │
  └────────────────────────────────────────────────────────┘
        │                    │                  │
        └── every control ───┴──────────────────┘
                writes one field of state.query
                        │
                        ▼
              GET /api/admin/orders
                ?page=2&limit=20
                &role=restaurant&status=pending
                &sortBy=createdAt&order=desc
                &search=green

   Server sorts and paginates. The client never holds more
   than one page, which is why the table stays fast at
   100,000 rows.
`}
      </Diagram>

      <CodeBlock
        language="tsx"
        title="src/components/common/DataTable.tsx"
        code={`export function DataTable<T>({
  columns, data, pagination, query, onQueryChange, isLoading, emptyState,
}: DataTableProps<T>) {
  const onSort = (column: string) => {
    const sameColumn = query.sortBy === column
    onQueryChange({
      sortBy: column,
      order: sameColumn && query.order === 'desc' ? 'asc' : 'desc',
    })
  }

  if (isLoading && data.length === 0) return <TableSkeleton rows={12} />
  if (!isLoading && data.length === 0) return emptyState

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.id}>
                {col.sortable ? (
                  <button
                    onClick={() => onSort(col.id)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    {col.header}
                    <SortIcon
                      active={query.sortBy === col.id}
                      dir={query.order}
                      className="size-3.5 opacity-60"
                    />
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row) => (
            <TableRow key={row._id} onClick={() => onRowClick(row)}>
              {columns.map((col) => (
                <TableCell key={col.id}>{col.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination {...pagination} onChange={(page) => onQueryChange({ page })} />
    </div>
  )
}`}
      />

      <Callout variant="warning" title="Debounce the search box, not the sort">
        <p>
          Typing in a search field should debounce 300&nbsp;ms before it hits
          the API. Clicking a column header should fire immediately — the user
          expects instant feedback for a discrete action, and a spinner on every
          sort is slower than the sort.
        </p>
      </Callout>

      <h3>Status badges</h3>

      <p>
        Order status, restaurant verification, and rider availability all render
        as badges. One component, one mapping table, one place to add a new
        state.
      </p>

      <CodeBlock
        language="ts"
        title="src/components/common/StatusBadge.tsx"
        code={`import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral:  'bg-muted text-muted-foreground',
        info:     'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        warning:  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        success:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        danger:   'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

// The single mapping for the whole panel. Adding an order state is a
// one-line change here instead of an audit of every table.
const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  pending:          'warning',
  confirmed:        'info',
  preparing:        'info',
  ready_for_pickup: 'info',
  pickedup:         'info',
  out_for_delivery: 'info',
  delivered:        'success',
  cancelled:        'danger',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={badgeVariants({ tone: ORDER_TONE[status] })}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}`}
      />

      <h2>The four core tables</h2>

      <PropertyTable
        headers={["Table", "Columns", "Row action"]}
        rows={[
          [
            "Users",
            "Name, email, role, status, joined, order count",
            "View detail, suspend, activate, delete.",
          ],
          [
            "Orders",
            "ID, customer, restaurant, rider, total, status, placed",
            "View, intervene, refund, cancel.",
          ],
          [
            "Restaurants",
            "Name, owner, cuisine, status, verification, rating",
            "View, verify, suspend, set commission.",
          ],
          [
            "Riders",
            "Name, phone, vehicle, availability, verification, rating",
            "View, verify, suspend, performance.",
          ],
        ]}
      />

      <h2>Order intervention and refunds</h2>

      <p>
        Three actions an operator can take on an order they did not create:
        cancel it, refund it, or reassign the rider. All three are destructive,
        all three affect money, and all three must be deliberate.
      </p>

      <Diagram caption="What each intervention actually does on the server">
        {`
  CANCEL
    status ──▶ cancelled, reason recorded in statusHistory
    Refund issued if the PaymentIntent was captured
    Customer + restaurant notified
    Auto-cancel jobs skip terminal orders from then on

  REFUND
    POST /api/payments/refund   { orderId, amount, reason }
    Partial or full, amount capped at amountCaptured − amountRefunded
    Customer notified by email and push
    Earning record marked reversed if the rider had a payout

  REASSIGN RIDER
    Clears deliveryDetails.riderId
    Order returns to ready_for_pickup and is offered again
    Rider is notified that the job was withdrawn
`}
      </Diagram>

      <CodeBlock
        language="tsx"
        title="src/features/orders/OrderInterventionDialog.tsx"
        code={`export function OrderInterventionDialog({ order }: { order: Order }) {
  const [action, setAction] = useState<'cancel' | 'refund' | null>(null)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const [doCancel, { isLoading: cancelling }] = useMutation(cancelOrder)
  const [doRefund, { isLoading: refunding }] = useMutation(refundOrder)

  const requiresTypedConfirmation =
    action === 'refund' && order.grandTotal > REFUND_CONFIRM_THRESHOLD

  const submit = async () => {
    try {
      if (action === 'cancel') {
        await cancelOrder({ orderId: order._id, reason }).unwrap()
      } else {
        await refundOrder({
          orderId: order._id,
          amount: order.grandTotal,
          reason,
        }).unwrap()
      }
      toast.success(\`Order \${order.orderId} \${action === 'cancel' ? 'cancelled' : 'refunded'}\`)
      onOpenChange(false)
    } catch (err) {
      // Show the server's message verbatim. These strings distinguish
      // "payment already refunded" from "order is already cancelled",
      // which are different problems with different fixes.
      toast.error((err as ApiError).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order {order.orderId}</DialogTitle>
        </DialogHeader>

        <OrderSummary order={order} />

        {action === null ? (
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setAction('cancel')}>
              Cancel order
            </Button>
            <Button variant="outline" onClick={() => setAction('refund')}>
              Refund
            </Button>
          </div>
        ) : (
          <>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Shown to the customer in the notification"
            />

            {requiresTypedConfirmation && (
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={\`Type REFUND to confirm \${currency(order.grandTotal)}\`}
              />
            )}

            <Button
              variant="destructive"
              onClick={submit}
              disabled={
                !reason ||
                (requiresTypedConfirmation && confirmText !== 'REFUND')
              }
            >
              {cancelling || refunding ? 'Working…' : \`Confirm \${action}\`}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}`}
      />

      <Callout
        variant="danger"
        title="Every refund needs a reason the customer sees"
      >
        <p>
          A refund with no explanation generates a support ticket every time.
          The reason string goes into the customer&rsquo;s notification and the
          order&rsquo;s audit trail, so it must be written for them — not for
          the operator. And the typed-confirmation gate above is not ceremony:
          it exists because a refund is irreversible.
        </p>
      </Callout>

      <h2>Platform settings</h2>

      <p>
        Settings is where the platform&rsquo;s economic parameters live, which
        makes it the most consequential form in the panel: a mistaken tax rate
        or delivery radius here silently affects every subsequent order. It is
        built as a tabbed single-purpose form rather than a settings page of
        forty mixed inputs, so each tab has one owner and one save action.
      </p>

      <Screenshot
        src={settingsImage}
        alt="The NutriDeliver admin Settings screen on the General tab. Fields shown are Platform Name set to NutriDeliver, Support Email set to support@nutrideliver.com, Default Delivery Fee of 3.99 dollars, Tax Rate of 8.5 percent, and Max Delivery Radius of 15 kilometres. A Save Changes button sits at the top right, and tabs for General, Notifications, Security, Delivery, Payments and Restaurants run across the top."
        caption="Platform settings. Each of these fields is read by live order logic — the tax rate and default delivery fee are applied at checkout, and the radius bounds which restaurants a customer can order from at all."
      />

      <Callout variant="warning" title="These values are read on every order">
        <p>
          Changing the tax rate does not retroactively change settled orders;
          order totals are snapshots. But it does apply to every order created
          from the moment it is saved, so a typo here is a live bug affecting
          real customers within seconds. Guard these writes behind a typed
          confirmation the way refunds are, and log every change with the
          operator&rsquo;s identity — platform economics should have an audit
          trail as surely as payments do.
        </p>
      </Callout>

      <Callout
        variant="tip"
        title="Validate against the data, not just the type"
      >
        <p>
          A tax rate field that accepts <code>abc</code> is a type problem; one
          that accepts <code>85</code> is a business-logic problem. Bound the
          field to a sensible range on the client <em>and</em> in the Joi
          schema, and remember that Joi is the only check that cannot be
          bypassed — a client-side bound is a courtesy to the operator, not a
          control.
        </p>
      </Callout>

      <h2>Empty, loading, and error states</h2>

      <p>
        These three states are most of what separates a dashboard that feels
        trustworthy from one that feels broken. Each needs a distinct treatment,
        not a shared spinner.
      </p>

      <CodeBlock
        language="tsx"
        title="src/components/common/TableStates.tsx"
        code={`export function TableStates<T>({
  status, error, rows, isFetching, onRetry, emptyState, children,
}: TableStatesProps<T>) {
  // Only show the empty state when the request SUCCEEDED with no rows.
  // Showing "no orders" while a request is in flight is a lie, and it is
  // the most common state bug in admin panels.
  if (status === 'loading') return <TableSkeleton rows={12} />
  if (status === 'failed')   return <ErrorState message={error} onRetry={onRetry} />
  if (rows.length === 0)     return emptyState ?? (
    <EmptyState
      title="Nothing here yet"
      description="Adjust the filters, or check back later."
      icon={<Inbox className="size-8 text-muted-foreground" />}
    />
  )

  return (
    <>
      {/* A quiet progress bar for background refetches: visible enough to
          explain a layout shift, quiet enough to ignore. */}
      {isFetching && <ProgressBar className="h-0.5 animate-pulse" />}
      {children}
    </>
  )
}`}
      />

      <CodeBlock
        language="tsx"
        title="A good error state names the problem and offers a next step"
        code={`export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <TriangleAlert className="size-8 text-destructive" />
      <div>
        <p className="font-medium">Could not load this data</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* Surface the server's message — an operator can act on
              "Payment service unreachable"; they cannot act on "Error". */}
          {message}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}`}
      />

      <h3>Distinguishing the empty cases</h3>

      <PropertyTable
        headers={["Situation", "Message", "Action"]}
        rows={[
          [
            "No filters applied, table empty",
            "No orders yet",
            "Link to documentation, nothing else.",
          ],
          [
            "Filters applied, no matches",
            "No orders match these filters",
            'A "Clear filters" button.',
          ],
          [
            "Search returned nothing",
            'No results for "green"',
            "Suggest widening the search or removing a filter.",
          ],
          [
            "Pending verification queue empty",
            "Nothing waiting for review",
            "Positive confirmation, not an error.",
          ],
          [
            "Request failed",
            "Could not load this data",
            "Retry button plus the server message.",
          ],
        ]}
      />

      <p>
        That third column is the whole point. &ldquo;No orders match these
        filters&rdquo; with a clear-filters button and &ldquo;no orders
        exist&rdquo; with a documentation link are different messages for
        completely different situations, and collapsing them into one empty
        state sends operators hunting through filters for something that was
        never there.
      </p>

      <h3>Skeleton over spinner</h3>

      <p>
        A skeleton shaped like the content that is coming is measurably better
        than a centred spinner: it sets the final layout before the data
        arrives, so nothing jumps. Build the skeleton from the same column
        definitions the table uses and the two cannot drift.
      </p>

      <CodeBlock
        language="tsx"
        title="src/components/common/TableSkeleton.tsx"
        code={`export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  // Same column count as the real table, so the layout does not shift
  // when data lands. 24px matches the default table cell height.
  return (
    <div className="rounded-lg border border-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-border px-4 py-3"
        >
          {Array.from({ length: 6 }).map((__, j) => (
            <Skeleton
              key={j}
              className={cn(
                'h-4',
                // First column is a name — wider. Others are values.
                j === 0 ? 'w-48' : 'flex-1',
              )}
              style={{ opacity: 1 - i * 0.06 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}`}
      />

      <h2>Aggregation queries, not client arithmetic</h2>

      <p>
        The dashboard reads from aggregation endpoints. Do not pull orders into
        the browser and compute totals there: it ships the whole order history
        over the wire to save one server-side <code>$group</code>, and the
        number will eventually differ from the orders table because the two
        computed it differently.
      </p>

      <CodeBlock
        language="js"
        title="Backend: orders by status over a period"
        code={`export const orderStatusBreakdown = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 864e5)

  const [byStatus, revenue] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.grandTotal' } } },
    ]),
  ])

  res.json({
    success: true,
    data: { byStatus, totalRevenue: revenue[0]?.total ?? 0 },
  })
})`}
      />

      <p>
        The index that makes this cheap is{" "}
        <code>{"{ createdAt: 1, status: 1 }"}</code> — the filter on{" "}
        <code>createdAt</code> narrows to thirty days, and <code>status</code>{" "}
        is covered by the same index so the <code>$group</code> never scans the
        discarded documents. See{" "}
        <a href="/docs/production/scaling">Scaling &amp; Performance</a>.
      </p>

      <Callout
        variant="tip"
        title="A dashboard is read constantly and written rarely"
      >
        <p>
          Aggregate endpoints are the most expensive queries on the platform and
          almost the least time-sensitive. Five-minute <code>staleTime</code> on
          the client, plus a pre-computed nightly snapshot for anything
          historical, removes almost all of that load. Nobody has ever
          complained that yesterday&rsquo;s revenue total was four hours stale.
        </p>
      </Callout>

      <h2>Refreshing the dashboard</h2>

      <p>
        Auto-refresh, manual refresh, and live updates are different features
        with different costs. Pick deliberately.
      </p>

      <PropertyTable
        headers={["Approach", "Cost", "Verdict"]}
        rows={[
          [
            "Polling every 10 s",
            "Six aggregation pipelines every 10 s per open tab",
            "Wasteful and noisy. Avoid.",
          ],
          [
            "Polling every 60 s",
            "One pipeline per minute per operator",
            "Acceptable at small scale, unnecessary at large.",
          ],
          [
            "Manual refresh button",
            "Zero background cost",
            "Correct default. Operators expect it.",
          ],
          [
            "Socket push on order:new",
            "Cheap — a counter the server already increments",
            "Worth it. Only the order count needs to be live.",
          ],
          [
            "Precomputed snapshot table",
            "Near zero per read",
            "The right answer for anything older than today.",
          ],
        ]}
      />

      <p>
        The pragmatic combination: a five-minute stale cache, a manual refresh
        button, and a live &ldquo;orders in the last hour&rdquo; counter pushed
        over the <code>admin</code> Socket.IO room. That gives operators the
        immediacy they want without turning a dashboard into a load generator.
      </p>

      <Callout variant="note" title="Build it against real data shapes">
        <p>
          Every number on this page comes from{" "}
          <code>/api/admin/analytics/*</code>, which are aggregation pipelines
          with real cost. Build the dashboard against those responses, not
          against mock data with nicer round numbers — the differences are where
          the bugs are.
        </p>
      </Callout>
    </>
  );
}
