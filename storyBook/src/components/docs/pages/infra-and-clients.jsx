import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import { Diagram, PropertyTable, Split, Step, Steps } from "../primitives";

/**
 * Backend infrastructure chapters plus the shared mobile client foundation.
 *
 * Realtime, background work, analytics, testing, and documentation make up the
 * parts of the API that are not a single request-response handler. The final
 * two components cover the foundation all three Expo apps build on.
 */

export function BackendRealtime() {
  return (
    <>
      <p>
        Half the perceived quality of a delivery app is how fast it tells you
        something happened. A customer who watches a rider move across the map
        believes the platform is working; the same customer refreshing a screen
        every ten seconds believes it is broken. Getting this right requires a
        push channel, and Socket.IO is the one we use.
      </p>

      <h2>Why not polling</h2>

      <p>
        Polling is the obvious first implementation and the wrong one. If two
        hundred customers each poll <code>GET /api/orders/:id</code> every five
        seconds, that is forty requests per second generated entirely by client
        idleness — on a read path that touches the database every time. Worse,
        polling is only ever as fresh as its interval, and its load scales with
        how many people are looking rather than with how much is happening. A
        socket inverts both: cost tracks the number of events, and delivery
        happens the instant the write commits.
      </p>

      <Callout
        variant="note"
        title="WebSockets are for events, not for commands"
      >
        <p>
          A status change is still written through a REST call — a rider marks
          an order picked up with <code>PATCH /api/orders/:id/status</code>, and
          the server broadcasts the result. The socket never carries a command
          that mutates state. This keeps one code path for every write, which
          means one set of validation, one authorisation check, and one place
          where bugs can hide.
        </p>
      </Callout>

      <h2>Attaching the server</h2>

      <p>
        Socket.IO attaches to the HTTP server rather than owning a port of its
        own. This matters for tests and for deployment: the same Express process
        serves REST and WebSocket traffic, so <code>server.js</code> exports one
        object and Supertest can drive HTTP without opening a socket.
      </p>

      <CodeBlock
        language="js"
        title="server.js — Socket.IO bootstrap"
        code={`import { Server } from 'socket.io'
import app from './app.js'          // your Express app, exported separately
import { config } from './config/env.js'

const server = app.listen(config.port)

export const io = new Server(server, {
  cors: {
    origin: config.clientUrls,      // same allow-list the REST API uses
    methods: ['GET', 'POST'],
  },
  // Keep heartbeats light; mobile networks drop idle sockets quickly.
  pingInterval: 25000,
  pingTimeout: 20000,
})

io.use(verifyHandshake)             // auth middleware, runs before connection
registerSocketHandlers(io)          // connection + event handlers

export { server }`}
      />

      <h2>Authenticating the handshake</h2>

      <p>
        A WebSocket connection carries no <code>Authorization</code> header,
        because the browser and the native HTTP clients control those headers
        and neither will set them on a socket upgrade. Socket.IO therefore gives
        you an <code>auth</code> object during the handshake, and the client
        sends the access token there. If that token is missing or expired, the
        connection is refused outright — an unauthenticated socket is not a
        degraded session, it is a hole in the authorisation model.
      </p>

      <CodeBlock
        language="js"
        title="socket/auth.js — handshake middleware"
        code={`import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { config } from '../config/env.js'

/**
 * Runs for every incoming connection, before 'connection' fires. Returning an
 * error string rejects the handshake with that message; the client sees it on
 * its connect_error event, which makes it easy to distinguish "server down"
 * from "your token expired".
 */
export const verifyHandshake = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    // Same secret and same verification options as the REST middleware — one
    // rule for what a valid token is, not two.
    const payload = jwt.verify(token, config.jwt.accessSecret)

    const user = await User.findById(payload.id).select('role isActive')
    if (!user || !user.isActive) {
      return next(new Error('Account not found or deactivated'))
    }

    socket.userId = user.id
    socket.userRole = user.role

    // A restaurant user is scoped to exactly one restaurant. Resolving it once
    // here means every handler can trust socket.restaurantId.
    if (user.role === 'restaurant') {
      const restaurant = await Restaurant.findOne({ owner: user.id }).select('_id')
      socket.restaurantId = restaurant?._id ?? null
    }

    next()
  } catch (err) {
    next(new Error('Invalid or expired token'))
  }
}`}
      />

      <h2>Rooms: the unit of delivery</h2>

      <p>
        A room is a named broadcast group. Emitting to a room reaches every
        socket in it and nobody else, which is exactly the authorisation
        primitive this platform needs — a customer only ever subscribes to their
        own rooms, and the room name is derived from the verified token rather
        than anything the client supplies.
      </p>

      <PropertyTable
        headers={["Room", "Who joins", "What it receives"]}
        rows={[
          [
            "customer-{userId}",
            "A logged-in customer",
            "Status changes, rider location for their active order, delivery confirmations.",
          ],
          [
            "restaurant-{id}",
            "The owning restaurant user",
            "New orders, cancellations, order status changes for their orders.",
          ],
          [
            "rider-{id}",
            "A logged-in rider",
            "Order assignments, pickup and drop-off instructions, earnings updates.",
          ],
          [
            "admin",
            "Every admin user",
            "New signups, flagged orders, low rider availability, platform alerts.",
          ],
        ]}
      />

      <CodeBlock
        language="js"
        title="socket/rooms.js — joining and leaving"
        code={`export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Scope rooms from server-side state only. socket.userId came from a
    // verified token, so a client cannot ask to join someone else's room.
    const rooms = roomsForUser(socket)

    for (const room of rooms) {
      socket.join(room)
    }

    socket.emit('connected', {
      socketId: socket.id,
      rooms,
      serverTime: new Date().toISOString(),
    })

    // Riders additionally subscribe to a nearby-orders broadcast room so the
    // server can fan out a single job rather than iterating online riders.
    if (socket.userRole === 'rider') {
      socket.join('riders-online')
    }

    socket.on('disconnect', (reason) => {
      logger.info('socket disconnected', {
        userId: socket.userId,
        reason,
      })
    })
  })
}

export function roomsForUser(socket) {
  const rooms = [\`customer-\${socket.userId}\`]

  if (socket.userRole === 'restaurant' && socket.restaurantId) {
    rooms.push(\`restaurant-\${socket.restaurantId}\`)
  }

  if (socket.userRole === 'rider') {
    rooms.push(\`rider-\${socket.userId}\`)
  }

  if (socket.userRole === 'admin') {
    rooms.push('admin')
  }

  return rooms
}`}
      />

      <Callout
        variant="danger"
        title="Never build a room name from client input"
      >
        <p>
          A handler that reads <code>socket.handshake.query.room</code> and
          joins it verbatim lets any authenticated user subscribe to any other
          user&rsquo;s order stream. That is a horizontal privilege escalation,
          and it is invisible in review because the code looks like a normal
          join. Room names must be composed from <code>socket.userId</code> and
          <code>socket.restaurantId</code> only.
        </p>
      </Callout>

      <h2>Emitting</h2>

      <p>
        Two helpers cover every broadcast in the system. Keeping them in one
        module means room naming is defined once, and any future change — say, a
        tenant prefix — is a single edit rather than an audit of every
        controller.
      </p>

      <CodeBlock
        language="js"
        title="socket/emitter.js"
        code={`import { io } from '../server.js'

/** Push to every socket belonging to one user, across their rooms. */
export const emitToUser = (userId, event, payload) => {
  io.to(\`customer-\${userId}\`).emit(event, payload)
}

export const emitToRestaurant = (restaurantId, event, payload) => {
  io.to(\`restaurant-\${restaurantId}\`).emit(event, payload)
}

export const emitToRider = (riderId, event, payload) => {
  io.to(\`rider-\${riderId}\`).emit(event, payload)
}

export const emitToAdmins = (event, payload) => {
  io.to('admin').emit(event, payload)
}

/** Fan out to every connected room at once. */
export const broadcast = (event, payload) => {
  io.emit(event, payload)
}`}
      />

      <h3>The event vocabulary</h3>

      <PropertyTable
        headers={["Event", "Direction", "Payload", "Sent when"]}
        rows={[
          [
            "order:created",
            "server → customer",
            "Full order document",
            "Immediately after the order is persisted and the payment intent is created.",
          ],
          [
            "order:statusChanged",
            "server → customer, restaurant, rider",
            "orderId, previousStatus, status, updatedAt",
            "Any successful transition through the state machine.",
          ],
          [
            "order:new",
            "server → restaurant",
            "orderId, customerName, items, grandTotal, prepEta",
            "A new order is placed for that restaurant.",
          ],
          [
            "rider:orderAvailable",
            "server → nearby riders",
            "orderId, pickup, dropoff, distanceKm, payout",
            "A confirmed order has no rider and the customer is within range.",
          ],
          [
            "rider:locationUpdate",
            "server → customer, admin",
            "orderId, lat, lng, heading, speed",
            "A throttled position ping from a rider with an active delivery.",
          ],
          [
            "notification:new",
            "server → user",
            "title, body, data",
            "Any in-app notification is persisted.",
          ],
        ]}
      />

      <CodeBlock
        language="js"
        title="orderController.js — broadcast after a committed write"
        code={`import { emitToUser, emitToRestaurant, emitToRider } from '../socket/emitter.js'

// Inside the status update handler, after order.save() resolves. Emitting
// before the write commits means telling a client about something that then
// fails — the single worst failure mode in a realtime system.
await order.save()

const payload = {
  orderId: order._id,
  previousStatus,
  status: order.status,
  updatedAt: order.updatedAt,
}

emitToUser(order.user, 'order:statusChanged', payload)
emitToRestaurant(order.restaurantId, 'order:statusChanged', payload)
if (order.deliveryDetails?.riderId) {
  emitToRider(order.deliveryDetails.riderId, 'order:statusChanged', payload)
}`}
      />

      <h2>Throttling location pings</h2>

      <p>
        This is the most common performance mistake in a delivery app, so it is
        worth being precise. React Native&rsquo;s location APIs can fire several
        times per second — especially with <code>showsBackgroundLocation</code>
        enabled and the app foregrounded during a long delivery. Emitting every
        one of those ticks produces a continuous flood: one rider generates
        hundreds of broadcasts a minute, every connected customer socket
        receives them, and your WebSocket server spends more time on location
        than on orders.
      </p>

      <CodeBlock
        language="js"
        title="socket/location.js — throttled rider location"
        code={`import { Location } from 'expo-location'
import { socket } from '../../lib/socket'

// GPS reports position far faster than a human can usefully consume it, and
// faster than the network can carry it. Three seconds is the floor: it is
// smooth to watch and cheap to serve.
const THROTTLE_MS = 3000

let lastSentAt = 0
let lastPosition = null
let subscription = null

export const startLocationStreaming = async (orderId) => {
  const permission = await Location.requestForegroundPermissionsAsync()
  if (permission.status !== 'granted') {
    throw new Error('Location permission is required while on a delivery')
  }

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 25,      // metres — also filters jitter while parked
      timeInterval: THROTTLE_MS,
    },
    ({ coords }) => {
      const now = Date.now()
      lastPosition = coords

      if (now - lastSentAt < THROTTLE_MS) return
      lastSentAt = now

      // Send the last known position if the device has not produced a new fix
      // yet, so the marker keeps moving instead of freezing on stale data.
      socket.emit('rider:locationUpdate', {
        orderId,
        lat: coords.latitude,
        lng: coords.longitude,
        heading: coords.heading ?? 0,
        speed: coords.speed ?? 0,
        accuracy: coords.accuracy,
      })
    },
  )
}

export const stopLocationStreaming = () => {
  subscription?.remove()
  subscription = null
  lastSentAt = 0
}`}
      />

      <CodeBlock
        language="js"
        title="server — broadcast a throttled ping to the right rooms"
        code={`socket.on('rider:locationUpdate', async (payload) => {
  const order = await Order.findById(payload.orderId).select('user deliveryDetails.riderId')

  // Authorise the ping against the database, not against what the client sent.
  if (!order || String(order.deliveryDetails?.riderId) !== socket.userId) {
    return socket.emit('locationUpdate:rejected', { reason: 'Not your delivery' })
  }

  // Persist at low frequency. The history is for dispute resolution and ETA
  // display, not for a breadcrumb trail rendered at 60fps.
  if (Date.now() - (order.lastLocationAt?.getTime() ?? 0) > 15000) {
    order.lastLocationAt = new Date()
    order.riderLocation = {
      type: 'Point',
      coordinates: [payload.lng, payload.lat],
    }
    await order.save()
  }

  const event = {
    orderId: order._id,
    lat: payload.lat,
    lng: payload.lng,
    heading: payload.heading,
  }

  io.to(\`customer-\${order.user}\`).emit('rider:locationUpdate', event)
  io.to('admin').emit('rider:locationUpdate', event)
})`}
      />

      <Callout variant="tip" title="Throttle on both sides">
        <p>
          Throttling in the client keeps the socket quiet; throttling on the
          server keeps a misbehaving or compromised client from flooding every
          customer on the platform. Do both. The write-behind throttle above —
          persisting at most once every fifteen seconds while broadcasting every
          three — is the shape you want: smooth to watch, cheap to store.
        </p>
      </Callout>

      <h2>Reconnection</h2>

      <p>
        Mobile networks drop connections constantly — a tunnel, a lift, a screen
        that sleeps. Socket.IO reconnects on its own, but the default behaviour
        is not enough for an authenticated app: the server has discarded the
        socket and its rooms, so a naive reconnect leaves the client connected
        and receiving nothing.
      </p>

      <CodeBlock
        language="js"
        title="lib/socket.js — client setup"
        code={`import { io } from 'socket.io-client'
import { getAccessToken } from './tokenStorage'

let socket = null

export const connectSocket = () => {
  if (socket?.connected) return socket

  socket = io(process.env.EXPO_PUBLIC_API_URL, {
    transports: ['websocket'],   // skip the HTTP long-polling handshake
    auth: (cb) => {
      // Called on every connection attempt, so a refreshed token is picked up
      // automatically after a reconnect.
      cb({ token: getAccessToken() })
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect_error', (err) => {
    if (err.message.includes('token')) {
      // The refresh path lives in the API client; the socket retries on the
      // next backoff tick once a fresh token exists.
      console.warn('socket auth rejected:', err.message)
    }
  })

  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}`}
      />

      <Callout variant="note" title="Missed events during a gap">
        <p>
          A dropped socket means missed events, and no amount of reconnection
          logic changes that. The recovery is a refetch, not a replay buffer: on{" "}
          <code>connect</code>, the app re-pulls the active order from{" "}
          <code>GET /api/orders/active</code> and reconciles. Building an event
          log with sequence numbers is the right answer at a scale where that
          refetch is too expensive — for now, one fetch on reconnect is both
          simpler and correct.
        </p>
      </Callout>

      <h2>Scaling beyond one instance</h2>

      <p>
        With a single Node process, <code>io.to(...)</code> works because every
        socket lives in the same process as the emitter. Two instances break
        that assumption: a user connected to instance A will never receive an
        event emitted by code running on instance B. A customer watches a status
        change that the server definitely sent, and simply does not see it.
      </p>

      <Diagram caption="Two instances without a shared adapter — events never cross">
        {`
   Client (customer 9f2)                 Admin dashboard
          |                                    |
          v                                    v
   +--------------+                    +--------------+
   |  instance A  |                    |  instance B  |
   |  socket lives|                    |  socket lives|
   +--------------+                    +--------------+
          ^                                    ^
          |        emitToUser(customer-9f2)    |
          +----------- runs on B -------------+
                 B has no reference to A's socket.
                 The event is dropped. Nobody sees it.
 `}
      </Diagram>

      <Steps>
        <Step title="Add the Redis adapter">
          <p>
            The adapter relays every broadcast across instances through Redis
            pub/sub — a genuine one-file change once the server is exported as a
            module. <code>createClient</code> reconnects on its own, so a Redis
            outage degrades to single-instance broadcast rather than crashing.
          </p>
          <CodeBlock
            language="js"
            title="server.js — Redis adapter"
            code={`import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pubClient = createClient({ url: process.env.REDIS_URL })
const subClient = pubClient.duplicate()

await Promise.all([pubClient.connect(), subClient.connect()])

io.adapter(createAdapter(pubClient, subClient))`}
          />
        </Step>

        <Step title="Enable sticky sessions and reap idle sockets">
          <p>
            A WebSocket upgrade is one long-lived TCP connection, so the load
            balancer needs affinity — a hash on the socket id is enough. Echoing{" "}
            <code>X-Instance-Id</code> from the health endpoint is how you
            confirm which instance owns a socket.
          </p>
          <p>
            Scaling instances does not reduce the socket count; nothing does.
            The real levers are a ping timeout that closes dead connections, an
            idle disconnect for riders with no active delivery, and per-instance
            connection limits.
          </p>
          <CodeBlock
            language="js"
            title="Idle timeout for rider sockets"
            code={`socket.on('rider:orderAvailable', () => {
  // Riders only need a live socket while they are working. Dropping idle ones
  // is the cheapest capacity win available.
  socket.data.lastActivity = Date.now()
})

setInterval(async () => {
  const cutoff = Date.now() - 15 * 60 * 1000
  const sockets = await io.fetchSockets()
  for (const s of sockets) {
    if (s.data.lastActivity && s.data.lastActivity < cutoff) {
      s.disconnect(true)
    }
  }
}, 60 * 1000).unref()`}
          />
        </Step>
      </Steps>

      <PropertyTable
        headers={["Check", "Why it matters"]}
        rows={[
          [
            "Handshake rejects missing or invalid tokens",
            "An unauthenticated socket bypasses every REST guard.",
          ],
          [
            "Room names derived from the verified token",
            "Prevents cross-tenant data leaks.",
          ],
          [
            "Emits happen after the write commits",
            "Never announce something that then failed.",
          ],
          [
            "Location pings throttled to about 3s",
            "Prevents the single most common realtime load spike.",
          ],
          [
            "Reconnect triggers a refetch",
            "Covers events missed while disconnected.",
          ],
          [
            "Platform-wide admin events are rare",
            "Each one fans out to every connected operator.",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/background-jobs">Background Jobs</a> — the
        work that has to happen whether or not anybody is watching.
      </p>
    </>
  );
}

export function BackendBackgroundJobs() {
  return (
    <>
      <p>
        Some work has no user waiting on it. An order that nobody collects must
        be cancelled anyway; a restaurant&rsquo;s availability must follow its
        operating hours even if every operator has gone home; notifications the
        user never read will never be read. These are scheduled jobs, and
        getting them right is the difference between a platform that holds its
        promises and one that quietly breaks them overnight.
      </p>

      <h2>The three jobs NutriDeliver runs</h2>

      <PropertyTable
        headers={["Job", "Cadence", "Effect"]}
        rows={[
          [
            "autoCancelUnassignedOrders(10)",
            "Every 5 minutes",
            "Cancels ready_for_pickup orders with no rider after 10 minutes and records the reason.",
          ],
          [
            "updateRestaurantOpenStatus()",
            "Every 5 minutes",
            "Recomputes isOpen for every active, verified restaurant from its operating hours.",
          ],
          [
            "cleanupOldNotifications()",
            "Daily",
            "Deletes read notifications older than 30 days to bound collection growth.",
          ],
        ]}
      />

      <h3>Auto-cancelling unassigned orders</h3>

      <p>
        This is the one with a real user impact. A restaurant marks an order
        ready, no rider accepts, and the customer is left watching a plate of
        food that nobody will ever deliver. Ten minutes is the deadline we
        committed to in{" "}
        <a href="/docs/planning">Requirements &amp; Domain Modelling</a>, and
        this job is what makes that commitment true.
      </p>

      <CodeBlock
        language="js"
        title="models/Order.js — the query behind the job"
        code={`orderSchema.statics.autoCancelUnassignedOrders = async function (timeoutMinutes = 10) {
  const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000)

  const orders = await this.find({
    status: 'ready_for_pickup',
    'deliveryDetails.riderId': { $exists: false },
    createdAt: { $lt: cutoffTime },
  })

  const cancelledOrders = []

  for (const order of orders) {
    order.status = 'cancelled'
    order.specialInstructions = (
      \`\${order.specialInstructions || ''}\\n\\nAuto-cancelled: No rider accepted within \` +
      \`\${timeoutMinutes} minutes\`
    ).trim()
    await order.save()
    cancelledOrders.push(order)
  }

  return cancelledOrders
}`}
      />

      <Callout variant="warning" title="Cancellation is a refund event">
        <p>
          Cancelling an order that has been paid means refunding it. The job
          cannot silently flip a status and leave the customer&rsquo;s card
          holding money for food that was never delivered. In production this
          loops over the cancelled orders and calls the Stripe refund path — and
          it must emit <code>order:statusChanged</code> to the customer and
          restaurant rooms, or both parties will be told about the cancellation
          by support rather than by the app.
        </p>
      </Callout>

      <CodeBlock
        language="js"
        title="utils/backgroundJobs.js — the wrapper"
        code={`import Order from '../models/Order.js'
import { emitToUser, emitToRestaurant } from '../socket/emitter.js'
import { createRefund } from './stripe.js'
import logger from './logger.js'

export const autoCancelUnassignedOrders = async (timeoutMinutes = 10) => {
  try {
    const cancelledOrders = await Order.autoCancelUnassignedOrders(timeoutMinutes)

    for (const order of cancelledOrders) {
      logger.info('Order auto-cancelled', {
        orderId: order._id,
        timeoutMinutes,
      })

      if (order.payment?.paymentStatus === 'paid') {
        await createRefund({
          paymentIntentId: order.payment.paymentIntentId,
          amount: order.payment.amountPaid,
          reason: 'Restaurant or rider timeout',
        })
      }

      const payload = {
        orderId: order._id,
        previousStatus: 'ready_for_pickup',
        status: 'cancelled',
        reason: 'No rider accepted within the promised window',
        updatedAt: order.updatedAt,
      }

      emitToUser(order.user, 'order:statusChanged', payload)
      emitToRestaurant(order.restaurantId, 'order:statusChanged', payload)
    }

    return cancelledOrders
  } catch (error) {
    // Swallow and log. A thrown error here would kill the interval in a way
    // that is very hard to notice and very expensive to miss.
    logger.error('Auto-cancel job error', { error: error.message })
    return []
  }
}`}
      />

      <h3>Syncing restaurant availability</h3>

      <p>
        <code>isOpen</code> is a denormalised field. It exists because the
        customer-facing listing queries filter on it, and computing opening
        hours per document per query would mean reading every restaurant&rsquo;s
        schedule on every page load. The cost of that optimisation is that the
        field must be kept correct by something.
      </p>

      <CodeBlock
        language="js"
        title="utils/backgroundJobs.js — operating hours sync"
        code={`export const updateRestaurantOpenStatus = async () => {
  try {
    const Restaurant = (await import('../models/Restaurant.js')).default

    const now = new Date()
    const currentDay = now
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM

    const restaurants = await Restaurant.find({ isActive: true, isVerified: true })

    let updatedCount = 0

    for (const restaurant of restaurants) {
      const isOpenDay = restaurant.operatingHours.days.includes(currentDay)
      const isWithinHours =
        isOpenDay &&
        currentTime >= restaurant.operatingHours.opening &&
        currentTime <= restaurant.operatingHours.closing

      // Only write on an actual change. Saving unconditionally would touch
      // updatedAt on every restaurant every five minutes, which breaks every
      // "recently updated" sort and bloats the oplog.
      if (restaurant.isOpen !== isWithinHours) {
        restaurant.isOpen = isWithinHours
        await restaurant.save()
        updatedCount++
      }
    }

    if (updatedCount > 0) {
      logger.info('Restaurant open status updated', { updatedCount })
    }

    return updatedCount
  } catch (error) {
    logger.error('Update restaurant status job error', { error: error.message })
    return 0
  }
}`}
      />

      <Callout variant="note" title="The N+1 in this loop is deliberate">
        <p>
          Each restaurant is loaded, evaluated in application code, and saved
          individually. That is one write per changed document and would be
          hopeless as a bulk write. It is also bounded: only active, verified
          restaurants are loaded, and only changed ones are written. At the
          scale this platform targets, correctness beats cleverness. When the
          restaurant count makes this measurable, the fix is{" "}
          <code>bulkWrite</code> with the same per-document evaluation — not
          moving the schedule logic into an aggregation pipeline.
        </p>
      </Callout>

      <h3>Cleaning up notifications</h3>

      <CodeBlock
        language="js"
        title="utils/backgroundJobs.js — notification cleanup"
        code={`export const cleanupOldNotifications = async () => {
  try {
    const Notification = (await import('../models/notification.js')).default

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Only read notifications are removed. An unread notification is a
    // pending obligation to the user, whatever its age.
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true,
    })

    if (result.deletedCount > 0) {
      logger.info('Cleaned up old notifications', {
        deletedCount: result.deletedCount,
      })
    }

    return result.deletedCount
  } catch (error) {
    logger.error('Cleanup notifications job error', { error: error.message })
    return 0
  }
}`}
      />

      <h2>How they are scheduled</h2>

      <p>
        <code>server.js</code> starts each job on a <code>setInterval</code>{" "}
        after <code>listen()</code>. No scheduler dependency, no configuration,
        and every job is visible in one place at the bottom of the entry point.
      </p>

      <CodeBlock
        language="js"
        title="server.js — scheduling"
        code={`// Auto-cancel unassigned orders every 5 minutes
setInterval(
  () => {
    autoCancelUnassignedOrders(10).catch((err) =>
      console.error('Auto-cancel job error:', err),
    )
  },
  5 * 60 * 1000,
)

// Update restaurant open status based on operating hours every 5 minutes
setInterval(
  () => {
    updateRestaurantOpenStatus().catch((err) =>
      console.error('Restaurant status job error:', err),
    )
  },
  5 * 60 * 1000,
)

// Cleanup old notifications daily at midnight
setInterval(
  () => {
    const now = new Date()
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      cleanupOldNotifications().catch((err) =>
        console.error('Cleanup notifications job error:', err),
      )
    }
  },
  60 * 60 * 1000,
) // Check every hour`}
      />

      <Callout variant="danger" title="setInterval is not a scheduler">
        <p>
          It is a timer that fires, and it has four failure modes that matter.
          Learn them now rather than discovering them at 3am.
        </p>
      </Callout>

      <PropertyTable
        headers={["Failure", "Consequence", "Fix"]}
        rows={[
          [
            "No overlap guard",
            "If a run takes longer than the interval, a second run starts on top of the first. Two concurrent auto-cancel passes can double-cancel, double-refund, and double-notify.",
            "A running flag, or a real queue.",
          ],
          [
            "Dies on restart",
            "Every deploy resets the interval. A job scheduled for midnight never runs if the process restarts at 23:58, and nothing tells you.",
            "node-cron, or a platform scheduler.",
          ],
          [
            "Drifts",
            "setInterval counts from when you scheduled it, not from the last run. Combined with long GC pauses and a busy event loop, the five-minute job can become a seven-minute job.",
            "Schedule against a fixed boundary, not a relative delay.",
          ],
          [
            "Runs on every instance",
            "Two replicas means two auto-cancel passes, two refunds. The jobs are not idempotent under concurrency.",
            "A distributed lock, or exactly one worker.",
          ],
        ]}
      />

      <Diagram caption="The interval's behaviour over time, including the failure">
        {`
  t=0        t=5m        t=10m       t=15m       t=20m
  |----------|----------|----------|----------|
  run 1      run 2      run 3      run 4      run 5
                                 ^
                                 DEPLOY — process restarts
                                 the interval is gone.
                                 No job ever runs again
                                 until another restart.
 `}
      </Diagram>

      <h2>The production path</h2>

      <p>
        Two upgrades, in order of value. The first is a real scheduler that
        survives restarts and supports overlap guards. The second is a queue for
        work that should be retried and observed rather than merely scheduled.
      </p>

      <h3>Upgrade one — node-cron</h3>

      <CodeBlock
        language="bash"
        title="Install"
        code={`npm install node-cron`}
      />

      <CodeBlock
        language="js"
        title="jobs/scheduler.js"
        code={`import cron from 'node-cron'

export const startScheduler = () => {
  // Every five minutes. The 5th field is the minute, so this runs at :00, :05,
  // :10 — anchored to the wall clock rather than drifting from boot time.
  cron.schedule('*/5 * * * *', () => run('autoCancel', autoCancelUnassignedOrders), {
    timezone: process.env.APP_TIMEZONE ?? 'UTC',
    name: 'autoCancelUnassignedOrders',
  })

  cron.schedule('*/5 * * * *', () => run('openStatus', updateRestaurantOpenStatus), {
    timezone: process.env.APP_TIMEZONE ?? 'UTC',
    name: 'updateRestaurantOpenStatus',
  })

  // 03:17 rather than 03:00. Every deployment in the world targets midnight,
  // so midnight is the most contended minute on every shared database.
  cron.schedule('17 3 * * *', () => run('cleanup', cleanupOldNotifications), {
    timezone: process.env.APP_TIMEZONE ?? 'UTC',
    name: 'cleanupOldNotifications',
  })
}

// Overlap guard: a job that is still running is skipped, not queued behind
// itself. Skipping is correct here — the next run in five minutes will catch
// anything this one missed.
const inFlight = new Set()

async function run(name, job) {
  if (inFlight.has(name)) {
    logger.warn('Job skipped, previous run still going', { name })
    return
  }

  inFlight.add(name)
  const startedAt = Date.now()

  try {
    const result = await job()
    logger.info('Job finished', { name, durationMs: Date.now() - startedAt })
    return result
  } catch (error) {
    logger.error('Job failed', { name, error: error.message })
  } finally {
    inFlight.delete(name)
  }
}`}
      />

      <Callout variant="tip" title="Anchor schedules to odd minutes">
        <p>
          Running at <code>0 3 * * *</code> collides with every other
          application on the planet that does the same thing. <code>17 3</code>
          costs nothing and avoids a thundering herd against shared
          infrastructure.
        </p>
      </Callout>

      <h3>Upgrade two — BullMQ</h3>

      <p>
        When a job must not be lost, must be retried with backoff, or must be
        triggered by an event rather than a clock, a queue is the correct
        primitive. BullMQ gives durable jobs, delayed execution, retries, and a
        dashboard, at the cost of a Redis dependency.
      </p>

      <CodeBlock language="bash" title="Install" code={`npm install bullmq`} />

      <CodeBlock
        language="js"
        title="jobs/queues.js"
        code={`import { Queue, Worker } from 'bullmq'

const connection = { host: '127.0.0.1', port: 6379 }

export const orderQueue = new Queue('order-jobs', { connection })

// Delayed jobs survive a restart: the schedule lives in Redis, not in a timer
// inside a Node process. This is the difference between "usually runs" and
// "runs".
export const scheduleAutoCancel = async () => {
  await orderQueue.add(
    'autoCancelUnassigned',
    { timeoutMinutes: 10 },
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: 'autoCancelUnassigned',
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  )
}

export const startWorkers = () => {
  new Worker(
    'order-jobs',
    async (job) => {
      switch (job.name) {
        case 'autoCancelUnassigned':
          return autoCancelUnassignedOrders(job.data.timeoutMinutes)
        case 'notifyRider':
          return notifyRiderOfAssignment(job.data)
        default:
          throw new Error(\`Unknown job: \${job.name}\`)
      }
    },
    {
      connection,
      // At most one job at a time, and at most one worker processes them. Both
      // are load-bearing: together they make the auto-cancel job safe to run
      // on any number of API instances.
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    },
  )
}`}
      />

      <h3>Making jobs idempotent</h3>

      <p>
        Retries mean the same job can run twice, and two instances mean two
        workers. Every job therefore has to be safe to repeat. This is the
        single most important property of any scheduled work, and it is achieved
        with a conditional write rather than a read-then-write.
      </p>

      <CodeBlock
        language="js"
        title="The idempotent auto-cancel"
        code={`// Bad: read, decide, save. Two workers can both read, both decide,
// and both save — producing two refunds.
const order = await Order.findById(id)
if (order.status === 'ready_for_pickup') {
  order.status = 'cancelled'
  await order.save()
}

// Good: the filter and the update are one atomic operation. Whoever gets
// matchedCount === 1 owns the cancellation; everyone else gets 0 and moves on.
const result = await Order.updateOne(
  {
    _id: id,
    status: 'ready_for_pickup',
    'deliveryDetails.riderId': { $exists: false },
  },
  {
    $set: { status: 'cancelled', cancelledAt: new Date() },
    $push: {
      statusHistory: {
        status: 'cancelled',
        actor: 'system',
        at: new Date(),
        reason: 'No rider accepted within 10 minutes',
      },
    },
  },
)

if (result.modifiedCount === 1) {
  await createRefund(...)   // exactly once
}`}
      />

      <h2>Observability</h2>

      <p>
        A job that fails silently is worse than no job, because it produces
        confidence where there is none. Log a start and an end for every run
        with a duration, alert on consecutive failures, and keep a heartbeat.
      </p>

      <PropertyTable
        headers={["Signal", "Threshold", "Meaning"]}
        rows={[
          [
            "Job duration",
            "Above 2x the interval",
            "Overlap is likely imminent — the database or an external API is degraded.",
          ],
          [
            "Consecutive failures",
            "3 in a row",
            "Page someone. The order auto-cancel path is customer-visible.",
          ],
          [
            "No run recorded",
            "2x the expected interval",
            "The scheduler is dead — usually a restart that lost its timers.",
          ],
          [
            "Cancelled order count",
            "Spike above baseline",
            "Either a supply problem (no riders online) or a bug in assignment.",
          ],
        ]}
      />

      <Callout variant="note" title="Test the jobs like everything else">
        <p>
          The auto-cancel job is the easiest thing in the system to test and the
          easiest thing to break silently. Seed an order at{" "}
          <code>ready_for_pickup</code> with a <code>createdAt</code> eleven
          minutes in the past, run the job, and assert it is cancelled with a
          status history entry. That test is covered in{" "}
          <a href="/docs/backend/testing">Testing the Backend</a>.
        </p>
      </Callout>

      <p>
        Next: <a href="/docs/backend/analytics">Analytics Endpoints</a> —
        turning the same order documents into numbers people act on.
      </p>
    </>
  );
}

export function BackendAnalytics() {
  return (
    <>
      <p>
        Every order placed is a record of a transaction, and a sufficient number
        of them is a business. Analytics in NutriDeliver is not a reporting tool
        bolted on afterwards — it is a set of MongoDB aggregation pipelines that
        run against the same collections the rest of the API writes to, with no
        replica to maintain and no ETL pipeline to keep in sync.
      </p>

      <h2>What gets reported</h2>

      <PropertyTable
        headers={["Endpoint", "Audience", "Returns"]}
        rows={[
          [
            "GET /api/restaurants/analytics",
            "Restaurant",
            "Total orders, revenue, 30-day order count, top five items by quantity.",
          ],
          [
            "GET /api/riders/earnings",
            "Rider",
            "Total and average delivery fees, delivery count, weekly breakdown, live balance.",
          ],
          [
            "GET /api/riders/stats",
            "Rider",
            "Completed, cancelled, and active counts, completion rate, average rating.",
          ],
          [
            "GET /api/admin/analytics/platform",
            "Admin",
            "User totals and growth by role, restaurant counts, orders by status, revenue totals.",
          ],
          [
            "GET /api/admin/analytics/sales",
            "Admin",
            "Daily sales series, top ten restaurants, most popular items, average order value.",
          ],
        ]}
      />

      <h2>Pipeline fundamentals</h2>

      <p>
        An aggregation pipeline is a list of stages applied left to right. Three
        rules govern how they should be written, and every pipeline in this
        codebase follows them.
      </p>

      <Steps>
        <Step title="Match first, always">
          <p>
            A leading <code>$match</code> is what lets the query planner use an
            index and stream matching documents from disk rather than loading
            the collection and filtering in memory. A <code>$group</code> before
            a <code>$match</code> forces a full collection scan every time. Put
            the filter first, no matter how it reads.
          </p>
        </Step>

        <Step title="Filter, then expand, then aggregate">
          <p>
            <code>$unwind</code> multiplies documents — an order with four items
            becomes four documents — so it belongs after <code>$match</code> and
            before <code>$group</code>. The order is: discard what you do not
            need, expand what you need to count, then aggregate.
          </p>
        </Step>

        <Step title="Sort and limit at the end">
          <p>
            A <code>$limit</code> that precedes the <code>$sort</code> does not
            save work; it just returns an arbitrary ten rows. Every ranking
            pipeline in this codebase groups, sorts by the computed value, then
            limits.
          </p>
        </Step>
      </Steps>

      <h2>Revenue over time</h2>

      <p>
        The daily sales series is the canonical example: match on payment state
        and date range, group by a truncated date string, sort, and return. The
        <code>$dateToString</code> grouping is what turns a stream of timestamps
        into chart buckets.
      </p>

      <CodeBlock
        language="js"
        title="adminController.js — daily sales series"
        code={`const salesOverTime = await Order.aggregate([
  // 1. Match first — indexed on paymentStatus + createdAt, and it is the only
  //    thing that makes this pipeline affordable.
  {
    $match: {
      paymentStatus: 'paid',
      status: { $ne: 'cancelled' },
      createdAt: { $gte: startDate },
    },
  },

  // 2. Group into daily buckets. "%Y-%m-%d" is sortable as text, which is
  //    exactly what the chart library needs — no date parsing on the client.
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      dailySales: { $sum: '$grandTotal' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$grandTotal' },
    },
  },

  // 3. Sort, then limit. Both at the end.
  { $sort: { _id: 1 } },
  { $limit: 365 },
])`}
      />

      <Callout
        variant="note"
        title="Cancelled orders are excluded, and that is a choice"
      >
        <p>
          The <code>status</code> clause excluding <code>cancelled</code> keeps
          refunded orders out of the revenue figure. If your finance team wants
          gross order value including cancellations, drop the clause and add a
          separate refund total — but decide deliberately, because a revenue
          number that silently counts refunded orders is worse than no number.
        </p>
      </Callout>

      <h2>Top selling items</h2>

      <p>
        Menu items are embedded inside an order as snapshots, so counting what
        sold is an <code>$unwind</code> followed by a <code>$group</code>. This
        is the shape MongoDB was designed for: no join, no application loop.
      </p>

      <CodeBlock
        language="js"
        title="restaurantController.js — popular items for one restaurant"
        code={`const popularItems = await Order.aggregate([
  // Scope to one restaurant AND one time window. Both predicates are indexed.
  {
    $match: {
      restaurantId: restaurant._id,
      createdAt: { $gte: thirtyDaysAgo },
      status: { $ne: 'cancelled' },
    },
  },

  // Expand the embedded item array into one document per item.
  { $unwind: '$items' },

  {
    $group: {
      _id: '$items.foodItemId',
      totalQuantity: { $sum: '$items.quantity' },
      // Revenue has to be computed, not summed — the stored price is per unit.
      totalRevenue: {
        $sum: { $multiply: ['$items.quantity', '$items.price'] },
      },
    },
  },

  { $sort: { totalQuantity: -1 } },
  { $limit: 5 },

  // Hydrate the name. $lookup is the aggregation equivalent of populate() and
  // costs one extra pass over a tiny, indexed collection.
  {
    $lookup: {
      from: 'fooditems',
      localField: '_id',
      foreignField: '_id',
      as: 'foodItem',
    },
  },
  { $unwind: '$foodItem' },

  {
    $project: {
      _id: 0,
      name: '$foodItem.name',
      image: '$foodItem.image',
      totalQuantity: 1,
      totalRevenue: 1,
    },
  },
])`}
      />

      <Callout variant="warning" title="Group by the id, not the snapshot name">
        <p>
          The order embeds <code>items[].name</code> as a snapshot, precisely so
          that renaming a dish tomorrow does not rewrite history. That means{" "}
          <code>items[].name</code> is not unique — the same dish can appear
          under two names, and the same name under two ids. Group by{" "}
          <code>foodItemId</code> and join the current name for display. The
          numbers stay correct even after a menu rename.
        </p>
      </Callout>

      <h2>Rider earnings</h2>

      <p>
        A rider&rsquo;s earnings are the sum of delivery fees on orders they
        completed. The filter must be on the delivery timestamp, not the order
        creation timestamp — an order placed Sunday and delivered Monday belongs
        to Monday&rsquo;s earnings.
      </p>

      <CodeBlock
        language="js"
        title="riderController.js — earnings with a weekly breakdown"
        code={`const earningsData = await Order.aggregate([
  {
    $match: {
      'deliveryDetails.riderId': req.user.id,
      status: 'delivered',
      'deliveryDetails.deliveredAt': { $gte: startDate },
    },
  },
  {
    $group: {
      _id: null,                              // null collapses to a single doc
      totalEarnings: { $sum: '$deliveryFee' },
      totalDeliveries: { $sum: 1 },
      averageEarning: { $avg: '$deliveryFee' },
    },
  },
])

// $week truncates to the start of the ISO week, so it groups correctly and
// returns a real Date rather than a string the client must parse.
const weeklyBreakdown = await Order.aggregate([
  {
    $match: {
      'deliveryDetails.riderId': req.user.id,
      status: 'delivered',
      'deliveryDetails.deliveredAt': {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  },
  {
    $group: {
      _id: { $week: '$deliveryDetails.deliveredAt' },
      weeklyEarnings: { $sum: '$deliveryFee' },
      deliveries: { $sum: 1 },
    },
  },
  { $sort: { '_id': 1 } },
])

res.json({
  success: true,
  data: {
    // $group with _id: null returns [] for an empty match set. Always fall back
    // or the rider's dashboard renders undefined on their first delivery.
    earnings: earningsData[0] ?? {
      totalEarnings: 0,
      totalDeliveries: 0,
      averageEarning: 0,
    },
    weeklyBreakdown,
    currentBalance: rider.riderProfile.earnings,
  },
})`}
      />

      <Callout variant="note" title="_id null is a scalar, not a missing key">
        <p>
          Grouping on <code>_id: null</code> produces exactly one document
          holding all the totals — the standard Mongo idiom for a single
          aggregate row. If the match returns nothing, the array is empty, not{" "}
          <code>[null]</code>, which is why the fallback above is not optional
          polish; it is a crash waiting for a rider&rsquo;s first week.
        </p>
      </Callout>

      <h2>Platform KPIs in fewer round trips</h2>

      <p>
        The admin dashboard needs a total count and a page of matching
        documents. Two queries means the collection is scanned twice and the two
        results can disagree. <code>$facet</code> splits one pipeline into
        parallel branches that all read the same input set, so count and data
        are always consistent with each other.
      </p>

      <CodeBlock
        language="js"
        title="adminController.js — one pass, count and data"
        code={`const result = await Order.aggregate([
  { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },

  {
    $facet: {
      // Branch A: the total, for the pagination footer.
      metadata: [{ $count: 'total' }],

      // Branch B: the page, sorted before the facet sees it because $sort sits
      // above $facet and therefore applies to every branch.
      orders: [
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: 'restaurants',
            localField: 'restaurantId',
            foreignField: '_id',
            as: 'restaurant',
          },
        },
        { $unwind: '$restaurant' },
        {
          $project: {
            _id: 1,
            grandTotal: 1,
            status: 1,
            createdAt: 1,
            'restaurant.name': 1,
          },
        },
      ],

      // Branch C: aggregates for the header cards, from the same documents.
      summary: [
        {
          $group: {
            _id: null,
            revenue: { $sum: '$grandTotal' },
            averageOrderValue: { $avg: '$grandTotal' },
          },
        },
      ],
    },
  },
])

const orders = result[0].orders
const total = result[0].metadata[0]?.total ?? 0
const summary = result[0].summary[0] ?? { revenue: 0, averageOrderValue: 0 }`}
      />

      <Diagram caption="Where each stage runs in a pipeline with $facet">
        {`
  $match   ──► narrowed to 4,182 documents
                │
                ▼
  $facet   ──┬──► metadata : $count           → 4,182
             ├──► orders   : $sort $skip $lim  → 20 rows
             └──► summary  : $group           → 1 row
                │
                ▼
  one round trip, three results, guaranteed consistent
  because all three branches read the same input.
 `}
      </Diagram>

      <h2>Why you materialise rather than compute live</h2>

      <p>
        The pipelines above run live against the orders collection, which is
        correct up to a point and wrong past it. A year of orders is millions of
        documents; the daily sales pipeline scans thirty days of them every time
        an operator opens a dashboard, and it does so whether or not anyone is
        looking. Materialising breaks that loop.
      </p>

      <CodeBlock
        language="js"
        title="The nightly rollup that replaces a live scan"
        code={`// Run once daily. The dashboard then reads a collection with one
// document per day instead of scanning an order history.
export const materialiseDailySales = async () => {
  const yesterday = new Date()
  yesterday.setHours(0, 0, 0, 0)
  yesterday.setDate(yesterday.getDate() - 1)

  const rows = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' },
        createdAt: {
          $gte: yesterday,
          $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          restaurantId: '$restaurantId',
        },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
        itemsSold: { $sum: { $sum: '$items.quantity' } },
      },
    },
    { $merge: { into: 'daily_sales', on: '_id', whenMatched: 'replace' } },
  ])

  return rows.length
}`}
      />

      <Callout variant="tip" title="$merge makes rollups idempotent">
        <p>
          <code>$merge</code> writes the result into another collection,
          matching on the group key. Re-running the job updates rows instead of
          duplicating them, so a retry after a failure is safe — the same
          property that makes background jobs safe to repeat.
        </p>
      </Callout>

      <Split
        left={{
          title: "Live pipelines",
          children: (
            <ul>
              <li>Always correct, even down to the second.</li>
              <li>No secondary collection to keep correct.</li>
              <li>Fine for per-restaurant and per-rider scopes.</li>
              <li>Cost grows linearly with history.</li>
            </ul>
          ),
        }}
        right={{
          title: "Materialised rollups",
          children: (
            <ul>
              <li>Constant cost per dashboard load, regardless of history.</li>
              <li>Enables indexes tuned for the exact read pattern.</li>
              <li>Needs a second collection and a job that maintains it.</li>
              <li>Up to one day stale — unacceptable for a live counter.</li>
            </ul>
          ),
        }}
      />

      <p>
        The rule that falls out: materialise anything a dashboard reads on every
        page load, keep pipelines live for anything a user checks once. A
        restaurant&rsquo;s own earnings should always be current because they
        are checking their balance. Platform revenue by month does not need to
        be current and should not be paid for.
      </p>

      <h2>Indexing the pipelines</h2>

      <PropertyTable
        headers={["Pipeline", "Index", "Serves"]}
        rows={[
          [
            "Daily sales",
            "{ paymentStatus: 1, createdAt: -1 }",
            "The $match that narrows every revenue query.",
          ],
          [
            "Popular items",
            "{ restaurantId: 1, createdAt: -1 }",
            "Per-restaurant item counts over a window.",
          ],
          [
            "Rider earnings",
            "{ 'deliveryDetails.riderId': 1, 'deliveryDetails.deliveredAt': -1 }",
            "Earnings and stats for one rider.",
          ],
          [
            "Admin order list",
            "{ createdAt: -1, status: 1 }",
            "The dashboard listing and its $facet count.",
          ],
          [
            "Available riders",
            "{ 'riderLocation': '2dsphere' }",
            "Near-me queries for rider assignment.",
          ],
        ]}
      />

      <Callout variant="warning" title="Check the plan before you optimise">
        <p>
          Run the pipeline with <code>explain: 'executionStats'</code> and read{" "}
          <code>nReturned</code> against <code>totalDocsExamined</code>. If they
          are close, the index is doing its job. If examined is many times
          returned, the <code>$match</code> is not reaching an index — usually
          because of a missing compound field or a negation that cannot use one.
        </p>
      </Callout>

      <h2>Common mistakes</h2>

      <PropertyTable
        headers={["Mistake", "Symptom", "Correction"]}
        rows={[
          [
            "No $match, or $match last",
            "Dashboard takes seconds, then minutes",
            "Move the filter to position zero.",
          ],
          [
            "$limit before $sort",
            "“Top 10” is arbitrary",
            "Group, sort by the computed value, then limit.",
          ],
          [
            "$group on an unbounded window",
            "Memory blow-up on large collections",
            "Always bound by createdAt or deliveredAt.",
          ],
          [
            "Grouping by a snapshot name",
            "Counts split after a rename",
            "Group by the id, join the current name.",
          ],
          [
            "$unwind without preserveNullAndEmptyArrays",
            "Orders with no items vanish silently",
            "Set the option, or you lose revenue rows.",
          ],
          [
            "Rounding after summing",
            "Totals disagree by a cent",
            "Round once, at the end, in the controller.",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/testing">Testing the Backend</a> — because
        a pipeline that is subtly wrong is the hardest kind of bug to notice.
      </p>
    </>
  );
}

export function BackendTesting() {
  return (
    <>
      <p>
        A food delivery platform fails in ways that are embarrassing rather than
        catastrophic: a discount applied twice, an order that skips a state, a
        cancelled order nobody was told about. None of these throw an error.
        They are wrong in ways only a test that exercises the real code path can
        catch, which is why the testing strategy here is deliberately
        integration-first rather than unit-first.
      </p>

      <h2>The stack</h2>

      <PropertyTable
        headers={["Tool", "Role", "Why"]}
        rows={[
          [
            "Vitest",
            "Test runner",
            "Fast, ESM-native, works with the same module resolution the app uses.",
          ],
          [
            "Supertest",
            "HTTP client for the API",
            "Drives the real Express app without binding a port.",
          ],
          [
            "mongodb-memory-server",
            "In-memory MongoDB",
            "Runs a genuine mongod binary, so queries and indexes behave as they do in production.",
          ],
          [
            "supertest + mongoose",
            "Under test",
            "No mocks between your controller and the database.",
          ],
        ]}
      />

      <Callout variant="note" title="No mocks of the database">
        <p>
          Mocks of Mongoose are the most common testing mistake in a MongoDB
          codebase. They pass while your real queries fail, because a mock does
          not enforce schema paths, does not apply indexes, and does not reject
          an invalid operator. A real in-memory server costs about two seconds
          of startup and removes the entire category of tests that lie to you.
        </p>
      </Callout>

      <h2>Test file structure</h2>

      <CodeBlock
        language="bash"
        title="Install and configure"
        code={`npm install -D vitest supertest mongodb-memory-server

# package.json scripts
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"`}
      />

      <p>
        Every integration test file sets up the same lifecycle. Extract it once
        rather than repeating the boilerplate, or a fourth test file will get it
        subtly different.
      </p>

      <CodeBlock
        language="js"
        title="tests/setup.js"
        code={`import { beforeAll, afterEach, afterAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer

beforeAll(async () => {
  // A real mongod, started once for the whole run and shared by every file in
  // the worker. First run downloads the binary; subsequent runs are instant.
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri('nutrideliver_test'))

  // Build the indexes. Without this, uniqueness constraints do not exist and
  // tests pass that production would reject.
  const { default: User } = await import('../models/User.js')
  await User.syncIndexes()
})

afterEach(async () => {
  // Clear documents, not the database. Dropping and recreating the database
  // for every test is slow and invalidates every index each time.
  const { collections } = mongoose.connection

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  )
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
})`}
      />

      <Callout
        variant="warning"
        title="Call syncIndexes, or forget a real rule"
      >
        <p>
          Mongoose builds indexes asynchronously in the background. A test that
          runs before they finish will not see a unique constraint on email, and
          a duplicate-registration test will fail for the wrong reason — or,
          worse, pass. <code>syncIndexes()</code> in <code>beforeAll</code>{" "}
          makes index behaviour deterministic.
        </p>
      </Callout>

      <h2>A full integration test</h2>

      <p>
        This is the test that matters most in the entire suite. It walks the
        real path a customer takes — register, log in, open a restaurant, create
        an order — and asserts the server computed the price rather than
        accepting the client&rsquo;s.
      </p>

      <CodeBlock
        language="js"
        title="tests/integration/orderFlow.test.js"
        code={`import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../../server.js'
import User from '../../models/User.js'
import Restaurant from '../../models/Restaurant.js'
import FoodItem from '../../models/FoodItem.js'
import Order from '../../models/Order.js'

let customerToken
let restaurantToken
let adminToken
let restaurant
let foodItem

const registerAndLogin = async (payload) => {
  await request(app).post('/api/auth/register').send(payload).expect(201)

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password })
    .expect(200)

  return res.body.data.accessToken
}

describe('order flow: register -> restaurant -> order', () => {
  beforeAll(async () => {
    customerToken = await registerAndLogin({
      name: 'Priya Customer',
      email: 'priya@example.com',
      password: 'Str0ng!Passw0rd',
      phone: '+919000000001',
      role: 'user',
    })

    restaurantToken = await registerAndLogin({
      name: 'Vine Kitchen',
      email: 'orders@vinekitchen.test',
      password: 'Str0ng!Passw0rd',
      phone: '+919000000002',
      role: 'restaurant',
    })

    // Admin approves the listing, exactly as the real workflow requires.
    const admin = await registerAndLogin({
      name: 'Ops Admin',
      email: 'admin@example.com',
      password: 'Str0ng!Passw0rd',
      phone: '+919000000003',
      role: 'admin',
    })
    adminToken = admin

    restaurant = await Restaurant.create({
      owner: (await User.findOne({ email: 'orders@vinekitchen.test' }))._id,
      name: 'Vine Kitchen',
      cuisine: 'Healthy',
      isActive: true,
      isVerified: false,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      minOrderAmount: 200,
      deliveryFee: 40,
    })

    await request(app)
      .patch(\`/api/admin/restaurants/\${restaurant._id}/verify\`)
      .set('Authorization', \`Bearer \${adminToken}\`)
      .send({ status: 'approved' })
      .expect(200)

    foodItem = await FoodItem.create({
      restaurant: restaurant._id,
      name: 'Quinoa Power Bowl',
      description: 'Quinoa, chickpeas, avocado, lemon dressing.',
      price: 320,
      isAvailable: true,
      nutrition: { calories: 540, protein: 18, carbs: 62, fat: 21 },
    })
  })

  it('rejects a duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Impostor',
        email: 'priya@example.com',
        password: 'Str0ng!Passw0rd',
        role: 'user',
      })
      .expect(409)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/already exists/i)
  })

  it('refuses an unauthenticated order', async () => {
    await request(app)
      .post('/api/orders')
      .send({ restaurantId: restaurant._id, items: [{ foodItemId: foodItem._id, quantity: 1 }] })
      .expect(401)
  })

  it('creates an order and computes the total server-side', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', \`Bearer \${customerToken}\`)
      .send({
        restaurantId: restaurant._id,
        // A hostile client claims the bowl costs 1 rupee.
        items: [{ foodItemId: foodItem._id, quantity: 2, price: 1 }],
        deliveryAddress: {
          label: 'Home',
          coordinates: { lat: 12.9716, lng: 77.5946 },
          addressLine: '42 MG Road, Bengaluru',
        },
      })
      .expect(201)

    const { order } = res.body.data

    // The snapshot price comes from the database, not the request body.
    expect(order.items[0].price).toBe(320)
    expect(order.items[0].name).toBe('Quinoa Power Bowl')
    expect(order.itemsTotal).toBe(640)
    expect(order.deliveryFee).toBe(40)
    expect(order.grandTotal).toBe(680)

    // statusHistory proves the state machine ran, not just that a status field
    // was set to a default.
    expect(order.status).toBe('pending')
    expect(order.statusHistory).toHaveLength(1)
    expect(order.statusHistory[0]).toMatchObject({
      status: 'pending',
      actor: customerToken ? expect.any(String) : expect.anything(),
    })

    const persisted = await Order.findById(order._id)
    expect(persisted).not.toBeNull()
  })

  it('rejects an illegal status transition', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', \`Bearer \${customerToken}\`)
      .send({
        restaurantId: restaurant._id,
        items: [{ foodItemId: foodItem._id, quantity: 1 }],
        deliveryAddress: {
          label: 'Home',
          coordinates: { lat: 12.9716, lng: 77.5946 },
          addressLine: '42 MG Road, Bengaluru',
        },
      })
      .expect(201)

    // A customer cannot mark their own food delivered.
    const res = await request(app)
      .patch(\`/api/orders/\${created.body.data.order._id}/status\`)
      .set('Authorization', \`Bearer \${customerToken}\`)
      .send({ status: 'delivered' })
      .expect(400)

    expect(res.body.message).toMatch(/cannot move an order/i)

    const unchanged = await Order.findById(created.body.data.order._id)
    expect(unchanged.status).toBe('pending')
  })

  it('auto-cancels an unassigned order after the timeout', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', \`Bearer \${customerToken}\`)
      .send({
        restaurantId: restaurant._id,
        items: [{ foodItemId: foodItem._id, quantity: 1 }],
        deliveryAddress: {
          label: 'Home',
          coordinates: { lat: 12.9716, lng: 77.5946 },
          addressLine: '42 MG Road, Bengaluru',
        },
      })
      .expect(201)

    const orderId = created.body.data.order._id

    // Backdate the order past the ten-minute window rather than waiting.
    await Order.updateOne(
      { _id: orderId },
      { $set: { createdAt: new Date(Date.now() - 11 * 60 * 1000) } },
    )

    const cancelled = await Order.autoCancelUnassignedOrders(10)
    expect(cancelled).toHaveLength(1)

    const after = await Order.findById(orderId)
    expect(after.status).toBe('cancelled')
    expect(after.specialInstructions).toMatch(/auto-cancelled/i)
  })
})`}
      />

      <Callout variant="tip" title="Backdate instead of sleeping">
        <p>
          Time-dependent behaviour should be tested by moving the data, not by
          waiting for it. <code>$set</code> on <code>createdAt</code> makes a
          ten-minute job testable in ten milliseconds, and it does not make the
          test suite flaky under load the way <code>setTimeout</code> does.
        </p>
      </Callout>

      <h2>Unit tests for pure logic</h2>

      <p>
        The functions worth unit testing are the ones with no I/O: the state
        machine, pricing, discounts, and distance. They run in microseconds,
        need no database, and cover an enormous number of cases for very little
        code. Every one uses arrange-act-assert with a single behavioural claim
        per test.
      </p>

      <CodeBlock
        language="js"
        title="tests/unit/orderStateMachine.test.js"
        code={`import { describe, it, expect } from 'vitest'
import { canTransition } from '../../utils/orderStatus.js'

describe('canTransition', () => {
  // Arrange — a valid, ordinary transition.
  // Act — the one function under test.
  // Assert — the single claim this test exists to make.

  it('allows pending -> confirmed', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true)
  })

  it('forbids pending -> delivered', () => {
    expect(canTransition('pending', 'delivered')).toBe(false)
  })

  it('treats delivered as terminal', () => {
    expect(canTransition('delivered', 'cancelled')).toBe(false)
  })

  it('allows cancellation from every non-terminal state', () => {
    const nonTerminal = [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'pickedup',
      'out_for_delivery',
    ]

    for (const state of nonTerminal) {
      expect(canTransition(state, 'cancelled')).toBe(true)
    }
  })

  it('returns false for an unknown state rather than throwing', () => {
    expect(canTransition('teleported', 'delivered')).toBe(false)
  })
})`}
      />

      <CodeBlock
        language="js"
        title="tests/unit/calculateDiscount.test.js"
        code={`import { describe, it, expect } from 'vitest'
import { calculateDiscount } from '../../utils/pricing.js'

const order = (itemsTotal, opts = {}) => ({
  itemsTotal,
  deliveryFee: opts.deliveryFee ?? 40,
  appliedOffer: opts.appliedOffer ?? null,
})

describe('calculateDiscount', () => {
  it('returns zero with no offer applied', () => {
    expect(calculateDiscount(order(500))).toEqual({ discount: 0, offerId: null })
  })

  it('applies a percentage offer', () => {
    const result = calculateDiscount(
      order(500, { appliedOffer: { _id: 'o1', type: 'percentage', value: 20 } }),
    )
    expect(result.discount).toBe(100)
  })

  it('caps a percentage offer at the order maximum', () => {
    const result = calculateDiscount(
      order(1000, {
        appliedOffer: { _id: 'o1', type: 'percentage', value: 50, maxDiscount: 300 },
      }),
    )
    expect(result.discount).toBe(300)
  })

  it('applies a flat amount offer', () => {
    const result = calculateDiscount(
      order(500, { appliedOffer: { _id: 'o2', type: 'flat', value: 75 } }),
    )
    expect(result.discount).toBe(75)
  })

  it('never discounts below zero', () => {
    const result = calculateDiscount(
      order(40, { appliedOffer: { _id: 'o2', type: 'flat', value: 500 } }),
    )
    expect(result.discount).toBe(40)
  })

  it('refuses an offer below its minimum order value', () => {
    const result = calculateDiscount(
      order(150, {
        appliedOffer: {
          _id: 'o3',
          type: 'flat',
          value: 100,
          minOrder: 300,
        },
      }),
    )
    expect(result.discount).toBe(0)
  })

  it('rejects an expired offer', () => {
    const result = calculateDiscount(
      order(500, {
        appliedOffer: {
          _id: 'o4',
          type: 'percentage',
          value: 25,
          expiresAt: new Date(Date.now() - 1000),
        },
      }),
    )
    expect(result.discount).toBe(0)
  })
})`}
      />

      <CodeBlock
        language="js"
        title="tests/unit/distance.test.js"
        code={`import { describe, it, expect } from 'vitest'
import { haversineDistance, isRiderInRange } from '../../utils/geo.js'

describe('haversineDistance', () => {
  it('returns zero for identical points', () => {
    expect(haversineDistance(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0)
  })

  it('matches the known Bengaluru airport-to-Majestic distance', () => {
    // Kengeri (77.4465, 12.9081) to Majestic (77.5587, 12.9767): ~15.3 km.
    const km = haversineDistance(12.9081, 77.4465, 12.9767, 77.5587)
    expect(km).toBeGreaterThan(15)
    expect(km).toBeLessThan(15.5)
  })

  it('is symmetric', () => {
    const ab = haversineDistance(12.9716, 77.5946, 13.0827, 77.5784)
    const ba = haversineDistance(13.0827, 77.5784, 12.9716, 77.5946)
    expect(ab).toBeCloseTo(ba, 10)
  })
})

describe('isRiderInRange', () => {
  const restaurant = { lat: 12.9716, lng: 77.5946 }

  it('accepts a rider inside the radius', () => {
    expect(isRiderInRange(restaurant, { lat: 12.975, lng: 77.6 }, 5)).toBe(true)
  })

  it('rejects a rider outside the radius', () => {
    expect(isRiderInRange(restaurant, { lat: 13.08, lng: 77.58 }, 5)).toBe(false)
  })

  it('uses the larger of the restaurant and platform radius', () => {
    expect(isRiderInRange(restaurant, { lat: 13.02, lng: 77.6 }, 5, 10)).toBe(true)
  })
})`}
      />

      <h2>What not to unit test</h2>

      <p>
        This is the part most codebases get wrong. A unit test on a controller
        verifies that your mock returned what you configured it to return — it
        tells you nothing about whether the endpoint works.
      </p>

      <PropertyTable
        headers={["Target", "Test it?", "Instead"]}
        rows={[
          [
            "canTransition, calculateDiscount, haversineDistance",
            "Yes — exhaustively, cheaply",
            "Pure functions with many edge cases.",
          ],
          [
            "Validation schemas",
            "Yes, one per schema",
            "Fast, and a schema regression is a real outage.",
          ],
          [
            "Controllers",
            "No",
            "Integration tests through Supertest. A mocked controller test proves nothing.",
          ],
          [
            "Mongoose models",
            "No",
            "The integration suite already exercises them against a real database.",
          ],
          [
            "Express middleware",
            "No",
            "Covered by every integration test that passes through it.",
          ],
          [
            "Third-party SDKs (Stripe, Cloudinary, FCM)",
            "No",
            "Assert on your adapter&rsquo;s behaviour, not the vendor&rsquo;s.",
          ],
        ]}
      />

      <Callout
        variant="danger"
        title="A test you have to mock heavily is telling you something"
      >
        <p>
          If a unit test needs five mocks before it can call the function under
          test, the unit is not a unit — it is a controller wearing a disguise.
          That is not a reason to write the mock; it is a reason to move the
          logic out of the controller into a pure function and test that
          instead.
        </p>
      </Callout>

      <h2>Test data factories</h2>

      <p>
        Hard-coded documents drift out of sync with the schema the moment it
        changes. Factories produce valid data by default and take overrides, so
        a test states only the one field it cares about.
      </p>

      <CodeBlock
        language="js"
        title="tests/factories.js"
        code={`import User from '../models/User.js'
import Restaurant from '../models/Restaurant.js'
import FoodItem from '../models/FoodItem.js'

let seq = 0
const uniq = () => \`\${Date.now().toString(36)}\${(seq += 1)}\`

export const buildUser = (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: \`user-\${uniq()}@example.com\`,
    password: 'Str0ng!Passw0rd',
    phone: '+91900000000',
    role: 'user',
    isActive: true,
    isVerified: true,
    ...overrides,
  })

export const buildRestaurant = async (overrides = {}) => {
  const owner = overrides.owner ?? (await buildUser({ role: 'restaurant' }))

  return Restaurant.create({
    owner: owner._id,
    name: \`Restaurant \${uniq()}\`,
    cuisine: 'Healthy',
    isActive: true,
    isVerified: true,
    isOpen: true,
    location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    minOrderAmount: 200,
    deliveryFee: 40,
    ...overrides,
  })
}

export const buildFoodItem = async (restaurant, overrides = {}) =>
  FoodItem.create({
    restaurant: restaurant._id,
    name: \`Item \${uniq()}\`,
    description: 'A test dish.',
    price: 250,
    isAvailable: true,
    category: undefined,
    nutrition: { calories: 400, protein: 20, carbs: 45, fat: 12 },
    ...overrides,
  })`}
      />

      <h2>Running the suite</h2>

      <CodeBlock
        language="bash"
        title="Test commands"
        code={`npm test                 # single run, exits non-zero on failure
npm run test:watch       # re-runs on change during development
npm run test:coverage    # with v8 coverage

# Watch a single file while iterating on a failing test
npx vitest watch tests/unit/calculateDiscount.test.js

# First run downloads the mongod binary; subsequent runs reuse it
# in the OS temp directory. Pre-warm in CI to avoid a race between workers.`}
      />

      <PropertyTable
        headers={["Suite", "Location", "Runtime", "Frequency"]}
        rows={[
          [
            "Integration — order flow",
            "tests/integration/orderFlow.test.js",
            "~1s",
            "Every commit.",
          ],
          [
            "Integration — auth and RBAC",
            "tests/integration/auth.test.js",
            "~0.5s",
            "Every commit.",
          ],
          [
            "Unit — pricing and state machine",
            "tests/unit/",
            "~50ms",
            "Every commit.",
          ],
          [
            "Smoke — health, docs, key listings",
            "tests/smoke/",
            "~200ms",
            "Every deploy.",
          ],
          ["Load — concurrent ordering", "tests/load/", "Minutes", "Nightly."],
        ]}
      />

      <Callout variant="note" title="Wire coverage into CI, not into a report">
        <p>
          A coverage number nobody looks at is theatre. Set a threshold — 80
          lines on <code>utils/</code>, where the business rules live — and let
          CI fail the build when it drops. Controllers legitimately sit lower
          because the integration suite covers them honestly.
        </p>
      </Callout>

      <p>
        Next: <a href="/docs/backend/docs">API Documentation</a> — making the
        contract visible to everyone who has to build against it.
      </p>
    </>
  );
}

export function BackendDocs() {
  return (
    <>
      <p>
        An API that only its author understands is not finished. Four clients
        and three separate mobile apps are built against this surface, and they
        will be developed by people who did not write it — including you, six
        months from now, at 6pm the day before a deadline. Documentation is not
        a deliverable at the end of the project. It is the mechanism that makes
        the rest of the project maintainable.
      </p>

      <h2>swagger-jsdoc</h2>

      <p>
        The spec is generated from JSDoc annotations that already sit above
        every controller function. This is the entire reason to prefer
        comments-in-code over a separate document: the documentation lives where
        the implementation does, so it is updated by whoever makes the change
        rather than by whoever remembers to.
      </p>

      <CodeBlock
        language="js"
        title="orderController.js — annotated handler"
        code={`/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id/status
 * @access  Private (Restaurant, Rider, Admin)
 *
 * @param {string} id.params - Order ID
 * @param {string} status.body.required - Target status.
 *   Must be a legal transition from the current status.
 * @param {string} [reason.body] - Recorded in statusHistory when cancelling.
 *
 * @query   {string} [notify=true] - Send a push notification on change.
 *
 * @example  Request:
 *          curl -X PATCH http://localhost:5000/api/orders/66f1/status \\
 *            -H "Authorization: Bearer <token>" \\
 *            -H "Content-Type: application/json" \\
 *            -d '{"status":"ready_for_pickup"}'
 *
 * @example  Response 200:
 *          {
 *            "success": true,
 *            "message": "Order status updated",
 *            "data": {
 *              "order": {
 *                "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
 *                "status": "ready_for_pickup",
 *                "previousStatus": "preparing",
 *                "statusHistory": [
 *                  {
 *                    "status": "preparing",
 *                    "actor": "66a1b2c3d4e5f6a7b8c9d0e1",
 *                    "at": "2026-01-14T09:12:33.481Z",
 *                    "note": null
 *                  }
 *                ]
 *              }
 *            }
 *          }
 *
 * @returns {object} 200 - Updated order
 * @returns {object} 400 - Illegal status transition
 * @returns {object} 401 - Not authenticated
 * @returns {object} 403 - Role not permitted to make this transition
 * @returns {object} 404 - Order not found
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  // …implementation
})`}
      />

      <p>
        The annotation vocabulary is small, and using all of it is what
        separates useful docs from decorative ones:
      </p>

      <PropertyTable
        headers={["Tag", "Purpose", "Example value"]}
        rows={[
          [
            "@desc",
            "One sentence on what the endpoint does.",
            "Update order status",
          ],
          [
            "@route",
            "Method and full path, including the mount prefix.",
            "PATCH /api/orders/:id/status",
          ],
          [
            "@access",
            "Who may call it — enforced by middleware, not by this comment.",
            "Private (Restaurant, Rider, Admin)",
          ],
          [
            "@param",
            "One per path, query, or body field, with type and required marker.",
            "status.body.required",
          ],
          [
            "@returns",
            "One per possible status code with its shape.",
            "400 - Illegal status transition",
          ],
          [
            "@example",
            "A runnable request and a realistic response.",
            "Request / Response 200",
          ],
        ]}
      />

      <Callout variant="note" title="Param paths follow the OpenAPI convention">
        <p>
          <code>id.params</code>, <code>status.body</code>, and{" "}
          <code>notify.query</code> are how swagger-jsdoc knows where a value
          belongs. Using a path like <code>@param status</code> without the
          location silently drops the parameter from the spec — no error, just a
          UI that never mentions the field.
        </p>
      </Callout>

      <h2>Assembling the spec</h2>

      <p>
        <code>config/swagger.js</code> combines three things: the definition
        metadata, the JSDoc scan of the route and controller files, and a
        components section that every <code>$ref</code> in the codebase points
        at.
      </p>

      <CodeBlock
        language="js"
        title="config/swagger.js"
        code={`import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NutriDeliver API',
      version: '1.0.0',
      description: \`
        NutriDeliver is a healthy food delivery platform with four roles:
        - **Customers**: browse, order, and track deliveries
        - **Restaurants**: manage menus, orders, and analytics
        - **Riders**: accept and deliver orders
        - **Admins**: platform management and analytics
      \`,
      contact: { name: 'NutriDeliver Team', email: 'support@nutrideliver.com' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development server' },
      { url: 'https://api.nutrideliver.com/api', description: 'Production server' },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the accessToken returned by POST /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Order not found' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['user', 'restaurant', 'rider', 'admin'],
            },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                phone: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
          },
        },
        Restaurant: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Vine Kitchen' },
            cuisine: { type: 'string', example: 'Healthy' },
            rating: { type: 'number', example: 4.6 },
            isOpen: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'Point' },
                coordinates: {
                  type: 'array',
                  items: { type: 'number' },
                  example: [77.5946, 12.9716],
                },
              },
            },
          },
        },
        FoodItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Quinoa Power Bowl' },
            price: { type: 'number', example: 320 },
            isAvailable: { type: 'boolean' },
            dietaryTags: { type: 'array', items: { type: 'string' } },
            nutrition: {
              type: 'object',
              properties: {
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            restaurantId: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'pending',
                'confirmed',
                'preparing',
                'ready_for_pickup',
                'pickedup',
                'out_for_delivery',
                'delivered',
                'cancelled',
              ],
            },
            itemsTotal: { type: 'number', example: 640 },
            discount: { type: 'number', example: 0 },
            deliveryFee: { type: 'number', example: 40 },
            tax: { type: 'number', example: 0 },
            grandTotal: { type: 'number', example: 680 },
            items: { type: 'array', items: { type: 'object' } },
            statusHistory: { type: 'array', items: { type: 'object' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            current: { type: 'number', example: 1 },
            pages: { type: 'number', example: 12 },
            total: { type: 'number', example: 234 },
          },
        },
      },
    },

    // Default to authenticated. Public endpoints override this with
    // security: [] so Swagger UI does not send a token to /api/restaurants.
    security: [{ bearerAuth: [] }],

    tags: [
      { name: 'Authentication', description: 'User authentication and tokens' },
      { name: 'Users', description: 'User profile and preferences' },
      { name: 'Restaurants', description: 'Restaurant management and operations' },
      { name: 'Food', description: 'Food items and categories' },
      { name: 'Cart', description: 'Shopping cart operations' },
      { name: 'Orders', description: 'Order management and delivery tracking' },
      { name: 'Payments', description: 'Payment processing and history' },
      { name: 'Offers', description: 'Promotions and discount codes' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Riders', description: 'Delivery rider operations' },
      { name: 'Admin', description: 'Platform management and analytics' },
    ],
  },

  // Both globs are required. Scanning only controllers loses the router-level
  // definitions; scanning only routes loses the @param and @example detail
  // that lives on the handlers.
  apis: ['./routes/*.js', './controllers/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

export { swaggerSpec, swaggerUi }`}
      />

      <Callout variant="warning" title="Glob paths are relative to the process">
        <p>
          <code>./controllers/*.js</code> is resolved from the working
          directory, not from the file containing the config. The API works from
          the <code>backend/</code> directory and mysteriously documents nothing
          when started from the repository root. If the spec comes back empty,
          check the working directory before anything else.
        </p>
      </Callout>

      <h2>Serving it</h2>

      <CodeBlock
        language="js"
        title="server.js — mount the UI and expose the raw spec"
        code={`import { swaggerSpec, swaggerUi } from './config/swagger.js'

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'NutriDeliver API Reference',
  swaggerOptions: {
    persistAuthorization: true,     // keep the token across page reloads
    docExpansion: 'list',
    filter: true,                   // search box — essential past ~60 endpoints
    tryItOutEnabled: true,          // call the real API from the browser
  },
}))

// The machine-readable spec. Frontend codegen, contract tests, and Postman
// all consume this rather than scraping the HTML.
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})`}
      />

      <Steps>
        <Step title="Verify the spec parses">
          <p>
            Open <code>/api-docs</code> and confirm every tag in the sidebar has
            operations under it. An empty tag means the glob matched nothing, or
            the JSDoc block is not immediately above the export.
          </p>
        </Step>

        <Step title="Authenticate once, then try calls">
          <p>
            <code>POST /api/auth/login</code>, copy the <code>accessToken</code>
            , click Authorize at the top of the page and paste it. With{" "}
            <code>persistAuthorization</code> on, every later request in that
            session carries it.
          </p>
        </Step>

        <Step title="Exercise a write end to end">
          <p>
            Use <code>POST /api/orders</code> with the example body from the
            annotation. It is the fastest way to discover that your documented
            example no longer matches the validation schema.
          </p>
        </Step>

        <Step title="Check the JSON is valid">
          <p>
            <code>
              curl -s localhost:5000/api-docs.json | jq '.paths | keys | length'
            </code>
            should return a number in the high dozens. Zero means the scan
            produced nothing; an unusually low number means most handlers are
            missing annotations.
          </p>
        </Step>
      </Steps>

      <Callout variant="tip" title="Generate clients from the spec">
        <p>
          Once <code>/api-docs.json</code> is served, the mobile apps can have
          typed models generated rather than hand-written — openapi-typescript
          for the Expo apps, an axios client for the admin panel. It also means
          a breaking field rename shows up as a compile error rather than as{" "}
          <code>undefined</code> in production.
        </p>
      </Callout>

      <h2>Keeping the docs honest</h2>

      <p>
        Generated documentation has one failure mode: it is accurate about the
        code and silent about everything the code does not tell you. The
        discipline is what makes it useful.
      </p>

      <Steps>
        <Step title="Document the contract, not the implementation">
          <p>
            Write <code>@param</code> lines for what a caller may send, not for
            what the controller happens to read. If a field is required by the
            Joi schema it is required in the docs; if it is silently ignored,
            delete the field rather than documenting a no-op.
          </p>
        </Step>

        <Step title="Make examples runnable">
          <p>
            Copy real response bodies out of your integration tests. An example
            that a developer can paste into curl without editing is worth ten
            lines of prose, and it fails loudly the day the shape changes.
          </p>
        </Step>

        <Step title="Document every failure you actually return">
          <p>
            The 401 and 404 lines are obvious. The ones that matter are the
            domain failures — 400 for an illegal transition, 409 for a duplicate
            registration, 422 for a validation error. A developer who has seen
            the failure list can handle the error; one who has not will retry
            blindly.
          </p>
        </Step>

        <Step title="Treat a missing annotation as a review blocker">
          <p>
            In code review, an undocumented handler is an incomplete handler.
            This one rule does more for API documentation than any tooling.
          </p>
        </Step>

        <Step title="Version the spec with the API">
          <p>
            Once a field is in production and consumed by a shipped mobile
            build, changing it is a breaking change. Add a new field; do not
            repurpose an old one. The{" "}
            <a href="/docs/backend/api-design">API Design &amp; Routing</a>{" "}
            chapter covers the versioning strategy.
          </p>
        </Step>
      </Steps>

      <h2>Beyond the spec</h2>

      <p>
        An OpenAPI document explains the shapes. It does not explain the
        workflow, and for a platform with a seven-state order machine the
        workflow is the part that matters. Three short documents earn their
        keep:
      </p>

      <PropertyTable
        headers={["Document", "Audience", "Contents"]}
        rows={[
          [
            "README.md",
            "Anyone cloning the repo",
            "Setup, environment variables, seed data, how to run each client.",
          ],
          [
            "architectureDesign.MD",
            "New contributors",
            "Data sync requirements, realtime channels, the order lifecycle, and the reasoning behind each boundary.",
          ],
          [
            "api-list.md",
            "Frontend developers",
            "Every endpoint grouped by role, with request and response TypeScript types.",
          ],
        ]}
      />

      <Callout variant="note" title="Why the API lives next to the annotations">
        <p>
          The alternative — a documentation site maintained by hand — drifts
          within weeks, because there is no mechanism forcing it to stay
          correct. Annotations in the controller are the only version of this
          that survives contact with a deadline. Prose that cannot be generated
          belongs in a README, not in a second place.
        </p>
      </Callout>

      <p>
        The backend is complete. The next two chapters build the foundation all
        three Expo apps share: <a href="/docs/mobile/setup">Expo App Setup</a>{" "}
        and <a href="/docs/mobile/api-client">API Client &amp; State</a>.
      </p>
    </>
  );
}

export function MobileSetup() {
  return (
    <>
      <p>
        NutriDeliver ships three mobile apps — customer, restaurant, and rider —
        that share almost everything except the screens. A shared project
        template, an identical routing model, and the same networking layer mean
        a bug fixed in one app is fixed in all three. This chapter builds that
        foundation; the next one writes the client itself.
      </p>

      <h2>The stack</h2>

      <PropertyTable
        headers={["Package", "Version", "Role"]}
        rows={[
          [
            "expo",
            "~56.0.23",
            "The SDK. Owns the native runtime, the config schema, and the build pipeline.",
          ],
          [
            "expo-router",
            "~56.2.21",
            "File-based routing with nested layouts and typed routes.",
          ],
          [
            "react",
            "19.2.3",
            "Matches the admin panel, so React knowledge transfers.",
          ],
          [
            "react-native",
            "0.85.3",
            "The platform primitives. Pinned by the SDK — do not upgrade independently.",
          ],
          [
            "typescript",
            "~6.0.3",
            "Strict mode. The API types from the OpenAPI spec make this cheap.",
          ],
          [
            "expo-image",
            "~56.0.13",
            "Cached, progressive, memory-aware image component. Replaces React Native Image.",
          ],
          [
            "expo-secure-store",
            "~56.0.x",
            "Keychain and EncryptedSharedPreferences. Must be installed — see below.",
          ],
          [
            "expo-notifications",
            "~56.0.x",
            "Push registration and local notification handling.",
          ],
          [
            "expo-location",
            "~56.0.x",
            "Foreground and background GPS for rider tracking.",
          ],
          [
            "react-native-reanimated",
            "4.3.1",
            "UI-thread animations. Must sit above react-native-gesture-handler.",
          ],
          [
            "react-native-safe-area-context",
            "~5.7.0",
            "Notch and home-indicator insets.",
          ],
        ]}
      />

      <Callout
        variant="warning"
        title="expo-secure-store is not installed by default"
      >
        <p>
          The template ships without it, and the backend deliberately hands out
          long-lived refresh tokens that must never sit in AsyncStorage. Install
          it explicitly, along with the notification and location packages:
        </p>
      </Callout>

      <CodeBlock
        language="bash"
        title="Install the runtime dependencies"
        code={`npx create-expo-app@latest frontend/customer --template default

cd frontend/customer

# Token storage — Keychain on iOS, EncryptedSharedPreferences on Android.
npx expo install expo-secure-store

# Push notifications, including the device token the backend registers.
npx expo install expo-notifications expo-device expo-constants

# GPS for riders: watchPositionAsync, and background delivery tracking.
npx expo install expo-location

# Already in the template, listed here for completeness.
npx expo install expo-image expo-linking expo-router expo-status-bar`}
      />

      <Callout variant="tip" title="Always use npx expo install">
        <p>
          It resolves the version that matches your SDK.{" "}
          <code>npm install</code> picks the latest version on npm, which for a
          fast-moving SDK is frequently incompatible with the runtime you are
          on. The failure mode is a cryptic native-module error at launch.
        </p>
      </Callout>

      <h2>File-based routing</h2>

      <p>
        expo-router maps the <code>app/</code> directory to a URL tree. A file
        is a screen, a directory is a layout, and the navigation graph is
        literally the filesystem. This removes the largest category of React
        Native navigation boilerplate and makes deep linking work without
        configuration.
      </p>

      <CodeBlock
        language="text"
        title="app/ — the customer app's routes"
        code={`app/
├── _layout.tsx              # Root layout: providers, splash, auth gate
├── index.tsx                # "/"            → redirects by auth state
├── (auth)/                  # Group: unauthenticated only
│   ├── _layout.tsx          #   Stack with no header
│   ├── login.tsx            #   "/login"
│   └── register.tsx         #   "/register"
├── (tabs)/                  # Group: the authenticated shell
│   ├── _layout.tsx          #   Tab navigator
│   ├── index.tsx            #   "/"        → Home
│   ├── search.tsx           #   "/search"
│   ├── orders.tsx           #   "/orders"
│   └── profile.tsx          #   "/profile"
├── restaurant/
│   └── [id].tsx             # "/restaurant/66f1a2b3"  → menu
├── cart.tsx                 # "/cart"
├── checkout.tsx             # "/checkout"
├── order/
│   ├── [id].tsx             # "/order/66f1a2b3"      → tracking
│   └── [id]/
│       └── success.tsx      # "/order/66f1a2b3/success"
├── offers.tsx               # "/offers"
└── +not-found.tsx           # catch-all 404 screen`}
      />

      <Callout
        variant="note"
        title="Parenthesised folders are invisible in the URL"
      >
        <p>
          <code>(tabs)</code> and <code>(auth)</code> group screens without
          changing the path — <code>(tabs)/orders.tsx</code> is{" "}
          <code>/orders</code>, not <code>/(tabs)/orders</code>. This is what
          lets a tab navigator and an auth stack share the same top level
          without one being a child of the other.
        </p>
      </Callout>

      <h2>Layouts</h2>

      <p>
        A file prefixed with an underscore is a layout: it wraps every route in
        its directory. Layouts nest, so the root layout wraps everything, the
        auth group layout wraps only unauthenticated routes, and the tab layout
        wraps the four tabs. Providers belong here, and a provider that is
        mounted in the root layout lives for the whole app lifetime.
      </p>

      <CodeBlock
        language="ts"
        title="app/_layout.tsx"
        code={`import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Provider } from 'react-redux'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'

import { store } from '../store'
import { useAppDispatch, useAppSelector } from '../hooks'
import { restoreSession } from '../features/auth/authSlice'
import { registerForPushNotificationsAsync } from '../services/notifications'
import { connectSocket, disconnectSocket } from '../lib/socket'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isRestored } = useAppSelector((s) => s.auth)

  useEffect(() => {
    dispatch(restoreSession()).finally(() => SplashScreen.hideAsync())
  }, [dispatch])

  // Open the socket only when there is a session, and close it on logout.
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket()
      registerForPushNotificationsAsync()
    } else {
      disconnectSocket()
    }
  }, [isAuthenticated])

  if (!isRestored) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: true,
              headerBackTitle: 'Back',
              contentStyle: { backgroundColor: '#FFFFFF' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(auth)"
              options={{ headerShown: false, animation: 'fade' }}
            />
            <Stack.Screen
              name="restaurant/[id]"
              options={{ title: 'Menu' }}
            />
            <Stack.Screen
              name="order/[id]"
              options={{ title: 'Track order', headerBackVisible: false }}
            />
          </Stack>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  )
}`}
      />

      <CodeBlock
        language="ts"
        title="app/(tabs)/_layout.tsx"
        code={`import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#71717A',
        // Respect the home indicator on devices that have one.
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          borderTopColor: '#E4E4E7',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}`}
      />

      <h3>The auth gate</h3>

      <p>
        The most common routing bug in an authed Expo app is a flash of the
        login screen for a user who is already signed in, because the token
        restore is async and the navigator renders first. The fix is to hold the
        splash screen until <code>restoreSession</code> resolves, then let
        redirects do the work.
      </p>

      <CodeBlock
        language="ts"
        title="app/index.tsx — redirect by session state"
        code={`import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useAppSelector } from '../hooks'

export default function Index() {
  const { isAuthenticated, isVerified } = useAppSelector((s) => s.auth)

  useEffect(() => {
    // Nothing to do here. The redirect below is the whole implementation;
    // this effect exists only so a lint rule about conditional hooks is
    // satisfied by an explicit no-op.
  }, [])

  if (!isAuthenticated) return <Redirect href="/login" />
  if (!isVerified) return <Redirect href="/verify" />

  return <Redirect href="/(tabs)" />
}`}
      />

      <Callout variant="warning" title="Never gate on AsyncStorage">
        <p>
          Reading the refresh token from AsyncStorage and treating it as proof
          of a session is the standard mistake. AsyncStorage is a plain file
          inside the app sandbox — readable from a rooted device, included in
          unencrypted backups, and not protected by the Keychain. It holds UI
          preferences. SecureStore holds credentials. See{" "}
          <a href="/docs/mobile/api-client">API Client &amp; State</a>.
        </p>
      </Callout>

      <h2>Dynamic routes</h2>

      <p>
        Bracketed segments are parameters. The customer app&rsquo;s{" "}
        <code>app/restaurant/[id].tsx</code> reads the identifier with{" "}
        <code>useLocalSearchParams</code>, which returns strings — so every
        value arriving from a URL needs validating before it reaches an API
        call.
      </p>

      <CodeBlock
        language="tsx"
        title="app/restaurant/[id].tsx"
        code={`import { useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { Image } from 'expo-image'
import { View, Text, ActivityIndicator } from 'react-native'

import { useAppDispatch, useAppSelector } from '../../hooks'
import { fetchRestaurant } from '../../features/restaurants/restaurantsSlice'

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const dispatch = useAppDispatch()

  const { current, status, error } = useAppSelector((s) => s.restaurants)
  const loading = status === 'loading'

  useEffect(() => {
    // A route parameter is untrusted input. A malformed ObjectId produces a
    // CastError deep in the driver; validating here keeps the failure legible.
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return
    dispatch(fetchRestaurant(id))
  }, [id, dispatch])

  if (loading && !current) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base text-destructive">{error}</Text>
      </View>
    )
  }

  if (!current) return null

  return (
    <View className="flex-1 bg-background">
      <Image
        source={current.coverImage}
        style={{ width: '100%', height: 220 }}
        contentFit="cover"
        transition={200}
        // expo-image caches on disk. Without a cache key the same URL is
        // re-fetched on every mount, which is visible on a slow connection.
        cachePolicy="memory-disk"
        placeholder={{ blurhash: current.coverBlurhash }}
      />
      <View className="p-4">
        <Text className="text-2xl font-bold">{current.name}</Text>
        <Text className="text-muted-foreground">
          {current.cuisine} · {current.rating} ★ ({current.totalReviews})
        </Text>
      </View>
    </View>
  )
}`}
      />

      <h2>Running it</h2>

      <CodeBlock
        language="bash"
        title="Development commands"
        code={`npx expo start                  # dev server, press i / a / w
npx expo start --clear           # reset the Metro cache
npx expo start --tunnel          # for physical devices on a restricted network

# Expo Go — no native build needed
# Install Expo Go on the phone, then scan the QR code from the terminal.

# Development build — required for any custom native module
npx expo install expo-dev-client
npx expo run:ios                 # builds and installs on a simulator
npx expo run:android

# Type check and lint
npx tsc --noEmit
npx expo lint`}
      />

      <Split
        left={{
          title: "Expo Go",
          children: (
            <ul>
              <li>
                Zero build time — change native config and relaunch instantly.
              </li>
              <li>Covers the whole SDK out of the box.</li>
              <li>Cannot load custom native modules.</li>
              <li>Fine until you need a dev client, then you move.</li>
            </ul>
          ),
        }}
        right={{
          title: "Development build",
          children: (
            <ul>
              <li>Supports every native module, including third-party ones.</li>
              <li>Build takes minutes — native code is actually compiled.</li>
              <li>Built once, then behaves like Expo Go with fast refresh.</li>
              <li>
                Unlocks SecureStore, notifications, background location, and
                maps.
              </li>
            </ul>
          ),
        }}
      />

      <Callout variant="note" title="Expo Go is enough for the first week">
        <p>
          Routing, components, and every screen that hits the API run perfectly
          in Expo Go. Switch to a development build when you first need to read
          a token from the Keychain, and stay there — the build is reusable, and
          fast refresh still applies.
        </p>
      </Callout>

      <h2>App configuration</h2>

      <p>
        <code>app.json</code> holds static config: name, icons, splash screen,
        permissions strings, and per-platform settings. Anything that differs
        between environments or depends on an environment variable belongs in{" "}
        <code>app.config.ts</code>, which is a function that receives the
        context and returns the same object.
      </p>

      <CodeBlock
        language="json"
        title="app.json — static configuration"
        code={`{
  "expo": {
    "name": "NutriDeliver",
    "slug": "nutrideliver-customer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "nutrideliver",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFFFFF"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.nutrideliver.customer",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription":
          "NutriDeliver uses your location to find restaurants near you and to show your rider's position during a delivery.",
        "NSLocationAlwaysAndWhenInUseUsageDescription":
          "NutriDeliver uses your location in the background to keep your delivery accurate while the screen is off.",
        "UIBackgroundModes": ["location", "remote-notification"]
      }
    },
    "android": {
      "package": "com.nutrideliver.customer",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "POST_NOTIFICATIONS",
        "VIBRATE"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "NutriDeliver needs access to your photos to upload a profile picture."
        }
      ],
      [
        "expo-notifications",
        {
          "color": "#16A34A"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}`}
      />

      <Callout
        variant="danger"
        title="Permission strings are shown to the user"
      >
        <p>
          The usage descriptions above are read by the OS permission dialog and
          are the only thing standing between your prompt and an app-wide
          rejection. &ldquo;This app needs location access&rdquo; gets denied.
          Write the actual reason, mention the feature, and never leave the
          default.
        </p>
      </Callout>

      <h2>Environment variables</h2>

      <p>
        Expo inlines any variable prefixed <code>EXPO_PUBLIC_</code> into the
        JavaScript bundle at build time. That is convenient and it is the reason
        the prefix carries a warning: those variables are readable by anyone who
        has the app.
      </p>

      <CodeBlock
        language="ts"
        title="app.config.ts — dynamic configuration"
        code={`import type { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NutriDeliver',
  slug: 'nutrideliver-customer',

  extra: {
    // Values reached at runtime through expo-constants. Anything here is
    // readable by a user who unzips the app bundle.
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000/api',
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://10.0.2.2:5000',
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    mapStyleUrl: process.env.EXPO_PUBLIC_MAP_STYLE_URL,
  },
})`}
      />

      <CodeBlock
        language="bash"
        title="Environment files"
        code={`# .env — committed, no secrets, development defaults
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:5000

# .env.local — gitignored, per-developer overrides
EXPO_PUBLIC_API_URL=http://192.168.1.42:5000/api

# .env.production — injected by EAS at build time
EXPO_PUBLIC_API_URL=https://api.nutrideliver.com/api`}
      />

      <Callout variant="danger" title="Never put a secret behind EXPO_PUBLIC_">
        <p>
          The prefix does exactly what it says: the value is inlined into the
          bundle. There is no encryption, no runtime fetch, no protection
          whatsoever — <code>EXPO_PUBLIC_STRIPE_SECRET_KEY</code> would be
          readable by anyone who downloads the app and greps the JavaScript. The
          public prefix is for URLs and public identifiers. Everything secret
          stays on the server and is reached through an authenticated endpoint.
        </p>
      </Callout>

      <CodeBlock
        language="ts"
        title="Reading config at runtime"
        code={`import Constants from 'expo-constants'

type AppExtra = {
  apiUrl: string
  socketUrl: string
  easProjectId?: string
  mapStyleUrl?: string
}

export const config = Constants.expoConfig?.extra as AppExtra

export const API_URL = config.apiUrl
export const SOCKET_URL = config.socketUrl`}
      />

      <Callout variant="note" title="10.0.2.2 is the Android emulator's host">
        <p>
          From an Android emulator, <code>localhost</code> is the emulator
          itself. The host machine is <code>10.0.2.2</code>. An iOS simulator
          shares your Mac&rsquo;s network, so <code>localhost</code> works
          there. A physical device needs your LAN address, which changes with
          your network — put it in <code>.env.local</code> rather than editing
          config.
        </p>
      </Callout>

      <h2>expo-image</h2>

      <p>
        A food delivery app is an image-heavy app, and the default{" "}
        <code>Image</code> component from React Native is not adequate. It does
        not cache to disk, decodes on the JS thread, and shows nothing while
        loading. <code>expo-image</code> fixes all three and is the single
        biggest perceived-performance upgrade available in a client.
      </p>

      <CodeBlock
        language="tsx"
        title="components/FoodImage.tsx"
        code={`import { Image } from 'expo-image'
import { View } from 'react-native'
import type { ImageSource } from 'expo-image'

type Props = {
  uri?: string
  blurhash?: string
  width?: number | string
  height: number
  rounded?: boolean
}

export function FoodImage({ uri, blurhash, width = '100%', height, rounded }: Props) {
  if (!uri) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: '#F4F4F5',
          borderRadius: rounded ? 12 : 0,
        }}
      />
    )
  }

  return (
    <Image
      source={{ uri } as ImageSource}
      style={{ width, height, borderRadius: rounded ? 12 : 0 }}
      // Disk cache keyed by URL, so scrolling back does not re-download.
      cachePolicy="memory-disk"
      // BlurHash renders immediately from ~30 bytes while the full image
      // decodes in the background. This is why lists do not flash empty.
      placeholder={blurhash ? { blurhash } : undefined}
      // Fade in only on a genuine network load, never on a cache hit.
      transition={blurhash ? 0 : 250}
      contentFit="cover"
      recyclingKey={uri}
    />
  )
}`}
      />

      <h2>Notifications and location</h2>

      <p>
        These two packages carry native configuration that has to be right in{" "}
        <code>app.json</code>, not just in code. A push token that never arrives
        and a location that never updates are both symptoms of a permission
        string or a background mode that is missing from the config file.
      </p>

      <CodeBlock
        language="ts"
        title="services/notifications.ts"
        code={`import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

import { apiClient } from '../lib/apiClient'
import { registerDeviceToken } from '../features/auth/authSlice'

// Show a banner even when the app is in the foreground — for a delivery app,
// "your rider is five minutes away" matters whether or not you are looking.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null

  if (Platform.OS === 'android') {
    // Required from Android 13. Request it explicitly or it is denied silently.
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }

  if (status !== 'granted') return null

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.easProjectId,
  })

  // The backend stores this against the user and passes it to FCM when the
  // order status changes.
  await apiClient.post('/notifications/register-device', { token })
  return token
}`}
      />

      <Callout
        variant="warning"
        title="Background location needs a physical review"
      >
        <p>
          <code>ACCESS_BACKGROUND_LOCATION</code> on Android and{" "}
          <code>UIBackgroundModes: location</code> on iOS are both reviewed by
          the app stores, and a delivery justification is required. It is also
          the correct thing to build: a rider who locks their screen
          mid-delivery must still be tracked. Ship it with a foreground-service
          notification so the user knows tracking is active.
        </p>
      </Callout>

      <h2>Sharing the foundation across three apps</h2>

      <p>
        The three apps differ in screens and roles, not in architecture. Keep
        everything that is not role-specific in a folder you copy forward, and
        change nothing else when you create the next one.
      </p>

      <PropertyTable
        headers={["Shared", "Role-specific", "Never shared"]}
        rows={[
          [
            "lib/apiClient, lib/socket, lib/tokenStorage",
            "store/, features/auth, features/orders",
            "Nothing — copy the folder forward and edit.",
          ],
          [
            "components/ (shared UI), hooks/, utils/format.ts",
            "app/ routes and every screen",
            "Environment-specific config; each app has its own bundle id.",
          ],
          [
            "assets/, app.config.ts structure, tsconfig.json",
            "constants/theme.ts per brand",
            "Navigation flows — the three apps genuinely differ here.",
          ],
        ]}
      />

      <Callout
        variant="tip"
        title="A real shared package beats copy-paste, eventually"
      >
        <p>
          At some point this duplication should become a workspace package. Not
          at the start: three apps is below the threshold where the build
          tooling costs more than it saves. When it hurts — a bug fixed in one
          app and not the others — extract{" "}
          <code>packages/nutrideliver-core</code> and leave the screens alone.
        </p>
      </Callout>

      <h2>Before moving on</h2>

      <PropertyTable
        headers={["Check", "How"]}
        rows={[
          [
            "App launches on a simulator",
            "`npx expo start` then press i or a.",
          ],
          [
            "Routes resolve",
            "Tab bar switches between Home, Search, Orders, Profile.",
          ],
          [
            "SecureStore reads and writes",
            "Log a value from the Keychain on a physical device.",
          ],
          ["Type check is clean", "`npx tsc --noEmit` produces no output."],
          [
            "Deep links resolve",
            "`npx uri-scheme open nutrideliver://restaurant/66f1a2b3…`",
          ],
          [
            "Permissions prompt correctly",
            "Reset permissions in Settings and relaunch.",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/mobile/api-client">API Client &amp; State</a> — the
        networking layer all three apps share, including the refresh logic that
        is easy to get subtly wrong.
      </p>
    </>
  );
}

export function MobileApiClient() {
  return (
    <>
      <p>
        Every screen in every mobile app talks to the same API, and every one of
        those calls needs an access token, a timeout, JSON parsing, and error
        handling. Written inline, that is four hundred lines of duplication per
        app and four hundred opportunities to handle a 401 differently. One
        typed client, shared by all three apps, is the highest-leverage piece of
        code in the client.
      </p>

      <h2>Token storage</h2>

      <p>
        Before the client can be written, tokens need somewhere to live. On
        mobile that means the platform&rsquo;s secure storage, and the choice is
        not really a choice at all.
      </p>

      <Split
        left={{
          title: "SecureStore — for credentials",
          children: (
            <ul>
              <li>Keychain on iOS, EncryptedSharedPreferences on Android.</li>
              <li>Hardware-backed where the device supports it.</li>
              <li>Excluded from unencrypted backups on Android.</li>
              <li>
                Synchronous reads for values under a few kilobytes, which is all
                a JWT is.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "AsyncStorage — for everything else",
          children: (
            <ul>
              <li>A plain file in the app sandbox.</li>
              <li>Readable from a rooted or jailbroken device.</li>
              <li>Included in iCloud and Google backups by default.</li>
              <li>Correct for theme, sort order, and cached search filters.</li>
            </ul>
          ),
        }}
      />

      <CodeBlock
        language="ts"
        title="lib/tokenStorage.ts"
        code={`import * as SecureStore from 'expo-secure-store'
import type { TokenPair } from '../types/auth'

const ACCESS_KEY = 'nd_access_token'
const REFRESH_KEY = 'nd_refresh_token'

export const tokenStorage = {
  save: (pair: TokenPair) =>
    Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, pair.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, pair.refreshToken),
    ]),

  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),

  clear: () =>
    Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]),
}

// A module-level mirror avoids an await on the hot path of every request.
// SecureStore's own synchronous read is not reliable across platforms.
let accessTokenCache: string | null = null
let refreshTokenCache: string | null = null

export const getAccessToken = (): string | null => accessTokenCache
export const getRefreshToken = (): string | null => refreshTokenCache

export const hydrateTokenCache = async (): Promise<void> => {
  const [access, refresh] = await Promise.all([
    tokenStorage.getAccessToken(),
    tokenStorage.getRefreshToken(),
  ])
  accessTokenCache = access
  refreshTokenCache = refresh
}

export const setTokenCache = (pair: TokenPair): void => {
  accessTokenCache = pair.accessToken
  refreshTokenCache = pair.refreshToken
}`}
      />

      <Callout variant="danger" title="Never AsyncStorage a refresh token">
        <p>
          A refresh token is a seven-day credential that mints access tokens on
          demand. In AsyncStorage it is a plaintext file that a backup restore,
          a compromised device, or a careless <code>console.log</code> can
          exfiltrate. The backend will not notice, because by design refresh
          tokens are not revocable one-by-one without a denylist. SecureStore is
          not a hardening measure here; it is the control.
        </p>
      </Callout>

      <h2>ApiError</h2>

      <p>
        Errors need a type before they can be handled coherently. A raw fetch
        rejects with a <code>TypeError</code>; a raw JSON parse rejects with a{" "}
        <code>SyntaxError</code>; an HTTP failure has neither. Normalising all
        three into one class is what lets a caller write a single{" "}
        <code>catch</code> and branch on a real field.
      </p>

      <CodeBlock
        language="ts"
        title="lib/apiError.ts"
        code={`export type FieldError = { field: string; message: string }

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  readonly fieldErrors: FieldError[]
  readonly isNetworkError: boolean

  constructor(
    status: number,
    message: string,
    body: unknown = null,
    fieldErrors: FieldError[] = [],
    isNetworkError = false,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.fieldErrors = fieldErrors
    this.isNetworkError = isNetworkError
  }

  /** True when the session is gone and the user must log in again. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403
  }

  get isValidationError(): boolean {
    return this.status === 422 || this.status === 400
  }

  /** A message safe to render directly in a toast or an inline error. */
  get displayMessage(): string {
    if (this.isNetworkError) {
      return 'Cannot reach the server. Check your connection and try again.'
    }
    if (this.fieldErrors.length > 0) {
      return this.fieldErrors[0].message
    }
    return this.message
  }
}`}
      />

      <h2>The refresh guard</h2>

      <p>
        This is the single most important piece of logic in the client, and the
        failure is specific enough to describe precisely.
      </p>

      <Diagram caption="Concurrent 401s without a single-flight guard">
        {`
  Screen A          Screen B          Screen C
     |                 |                 |
  GET /orders       GET /cart        GET /profile
     | 401             | 401             | 401
     |                 |                 |
  POST /auth/refresh (three simultaneous refresh calls)
     |                 |                 |
  refresh #1          refresh #2       refresh #3
     |                   |                 |
  +---------------------------+
  | The backend rotates the    |
  | refresh token on every     |
  | use. Three parallel calls  |
  | invalidate each other.     |
  | Two of them get a token     |
  | that is already dead, and  |
  | the final stored token is  |
  | the one that failed.       |
  +---------------------------+
     |
     v
  User is logged out for no reason.
 `}
      </Diagram>

      <p>
        The access token expires every fifteen minutes. In a session where a
        customer has the orders screen, the cart badge, and a websocket-driven
        tracking view open, several requests can hit an expired token within the
        same second. Without coordination, each one fires its own refresh, the
        backend rotates the refresh token on every use, and the last write to
        SecureStore is whichever stale token lost the race. The user is then
        logged out in the middle of a checkout, with no error they can act on.
      </p>

      <p>
        The fix is a single-flight promise: the first caller starts the refresh
        and everyone else awaits that same promise.
      </p>

      <CodeBlock
        language="ts"
        title="lib/apiClient.ts — the client"
        code={`import Constants from 'expo-constants'
import {
  getAccessToken,
  getRefreshToken,
  setTokenCache,
  tokenStorage,
} from './tokenStorage'
import { ApiError } from './apiError'

type Extra = { apiUrl: string }
const { apiUrl } = Constants.expoConfig?.extra as Extra

const BASE_URL = apiUrl.replace(/\\/+$/, '')
const TIMEOUT_MS = 20000

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Internal: set when this call is itself the refresh request. */
  skipAuth?: boolean
  timeoutMs?: number
}

type Envelope<T> = {
  success: boolean
  message?: string
  data?: T
  errors?: { field?: string; message: string }[]
}

// ---------------------------------------------------------------------------
// Single-flight refresh.
//
// One promise is shared by every concurrent caller. The second request that
// hits a 401 receives the same promise and does not start its own refresh.
// ---------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    // Deliberately a bare fetch: calling apiClient here would recurse into the
    // 401 handler that called us.
    const response = await fetch(\`\${BASE_URL}/auth/refresh\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      // The refresh token is expired or revoked. Clear the session and let the
      // caller surface a re-authentication.
      await tokenStorage.clear()
      setTokenCache({ accessToken: '', refreshToken: '' })
      return null
    }

    const payload = (await response.json()) as Envelope<{
      accessToken: string
      refreshToken: string
    }>

    const pair = payload.data!
    setTokenCache(pair)
    await tokenStorage.save(pair)
    return pair.accessToken
  } catch {
    return null
  }
}

function getFreshAccessToken(): Promise<string | null> {
  // If a refresh is already in flight, join it instead of starting another.
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    skipAuth = false,
    timeoutMs = TIMEOUT_MS,
  } = options

  // Build the URL, dropping undefined query values rather than sending "undefined".
  let url = \`\${BASE_URL}\${path}\`
  if (query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.append(key, String(value))
    }
    const qs = params.toString()
    if (qs) url += \`?\${qs}\`
  }

  // A timeout is not optional. Without it, a dropped connection on a captive
  // portal or a tunnel leaves a spinner on screen indefinitely.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (!skipAuth) {
    const token = getAccessToken()
    if (token) headers.Authorization = \`Bearer \${token}\`
  }

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    clearTimeout(timeoutId)

    const aborted = error instanceof Error && error.name === 'AbortError'
    throw new ApiError(
      0,
      aborted ? 'Request timed out' : 'Network request failed',
      null,
      [],
      true,
    )
  } finally {
    clearTimeout(timeoutId)
  }

  // 204 has no body. Calling .json() on it throws and turns a successful
  // delete into an error.
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let parsed: unknown = null

  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      // A proxy or an unhandled crash returned HTML. Surface the status rather
      // than a parse error that tells the user nothing.
      if (!response.ok) {
        throw new ApiError(response.status, 'Unexpected server response')
      }
      return undefined as T
    }
  }

  if (!response.ok) {
    const envelope = parsed as Envelope<T> | null
    throw new ApiError(
      response.status,
      envelope?.message ?? \`Request failed with status \${response.status}\`,
      parsed,
      (envelope?.errors ?? []).map((e) => ({
        field: e.field ?? '',
        message: e.message,
      })),
    )
  }

  // Unwrap the standard envelope. Callers get the payload, not the wrapper.
  return (parsed as Envelope<T>)?.data as T
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    request<T>(path, { query }),

  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Public entry point: the layer that handles 401 and retries once.
// ---------------------------------------------------------------------------

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/refresh')

  try {
    return await request<T>(path, {
      ...options,
      skipAuth: isAuthEndpoint,
    })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
    if (isAuthEndpoint) throw error
    if (options.skipAuth) throw error

    // One refresh, shared across every concurrent caller, then one retry.
    const freshToken = await getFreshAccessToken()
    if (!freshToken) {
      // The session is unrecoverable. Let the auth slice route to login.
      throw new ApiError(401, 'Session expired. Please sign in again.')
    }

    return request<T>(path, { ...options, skipAuth: false })
  }
}`}
      />

      <Diagram caption="The request lifecycle, and where the guard sits">
        {`
  api(path, opts)
        |
        v
  request(path) --- 200 ---> return data
        |
        +--------> 401
                    |
                    v
            getFreshAccessToken()
                    |
        +-----------+-----------+
        |                       |
   already refreshing?    no refresh yet
        |                       |
        +--> await the          start refresh,
             existing promise   store the promise
        |                       |
        +-----------+-----------+
                    |
             new token?
              /        \\
           no            yes
           |              |
     ApiError 401   request(path) once more
     sign the user       |
     out                 +--> 200 --> return data
                         +--> 401 --> throw. Never loop.
 `}
      </Diagram>

      <Callout variant="warning" title="Retry once, never in a loop">
        <p>
          The retry is unconditional and there is exactly one of it. If the
          retried request also returns 401, it throws. A naive implementation
          that loops until the request succeeds will hammer the refresh endpoint
          indefinitely on a genuinely revoked token — the exact opposite of what
          the guard was built to prevent.
        </p>
      </Callout>

      <Callout variant="note" title="Why the refresh call is a bare fetch">
        <p>
          If <code>refreshAccessToken</code> called <code>apiClient</code>, its
          own 401 would enter the handler, which would call the refresh again,
          which would enter the handler. The recursion is infinite and it fails
          as an unhandled rejection rather than a readable error. The refresh
          path is the one place that talks to <code>fetch</code> directly,
          precisely because it is below the layer that handles auth failures.
        </p>
      </Callout>

      <h2>Typed endpoints</h2>

      <p>
        A typed client is only useful if the types come from somewhere real. The
        backend serves a machine-readable OpenAPI spec at{" "}
        <code>/api-docs.json</code> (see{" "}
        <a href="/docs/backend/docs">API Documentation</a>), so the honest
        answer is to generate them rather than hand-maintain them. Every
        endpoint then lives behind a named function in a service module, which
        gives the thunk a single place to import and a single place to change.
      </p>

      <CodeBlock
        language="ts"
        title="services/orders.ts"
        code={`import { api } from '../lib/apiClient'
import type { Order, OrderStatus, Paginated } from '../types/api'

export const ordersApi = {
  listActive: () => api<Order[]>('/orders/active'),

  getById: (id: string) => api<Order>(\`/orders/\${id}\`),

  list: (params: { page?: number; limit?: number; status?: OrderStatus }) =>
    api<Paginated<Order>>('/orders', { query: params }),

  create: (input: {
    restaurantId: string
    items: { foodItemId: string; quantity: number }[]
    addressId: string
    offerCode?: string
  }) =>
    api<{ order: Order; paymentClientSecret: string }>('/orders', {
      method: 'POST',
      body: input,
    }),

  updateStatus: (id: string, status: OrderStatus, reason?: string) =>
    api<Order>(\`/orders/\${id}/status\`, {
      method: 'PATCH',
      body: { status, reason },
    }),
}`}
      />

      <Callout variant="tip" title="Why generation beats hand-written types">
        <p>
          The benefit is not the saved typing. It is that renaming a field on
          the server becomes a compile error in the app instead of{" "}
          <code>undefined</code> in production — the failure moves from a
          customer&rsquo;s screen to your terminal, where it costs seconds.
        </p>
      </Callout>

      <h2>Redux Toolkit</h2>

      <p>
        Redux in these apps holds client state and the results of API calls.
        Before the store, the distinction that makes it coherent:
      </p>

      <Split
        left={{
          title: "Server state",
          children: (
            <ul>
              <li>
                Owned by the database. The API is the only source of truth.
              </li>
              <li>
                Order status, restaurant menus, rider assignments, earnings.
              </li>
              <li>
                Cacheable, and eventually stale. Re-fetchable at any time.
              </li>
              <li>Never derived in a reducer — a reducer cannot fetch.</li>
            </ul>
          ),
        }}
        right={{
          title: "Client state",
          children: (
            <ul>
              <li>Owned by this device. Nothing else knows it exists.</li>
              <li>
                Cart contents, selected address, sort order, draft filters.
              </li>
              <li>
                Meaningful while the app is open, and only while it is open.
              </li>
              <li>The only kind that belongs in persisted storage.</li>
            </ul>
          ),
        }}
      />

      <p>
        Mixing the two is how caches drift. If a reducer computed an order total
        from a cached menu, and the restaurant updated a price between the fetch
        and the calculation, the client would display a number the server would
        never charge. Totals are computed on the server and returned; the client
        renders them.
      </p>

      <CodeBlock
        language="ts"
        title="store/index.ts"
        code={`import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import cartReducer from '../features/cart/cartSlice'
import restaurantsReducer from '../features/restaurants/restaurantsSlice'
import ordersReducer from '../features/orders/ordersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    restaurants: restaurantsReducer,
    orders: ordersReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        // Socket payloads and location fixes carry Dates and objects the
        // default check rejects. Restrict rather than disable wholesale.
        ignoredActionPaths: ['meta.arg', 'payload.updatedAt'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch`}
      />

      <CodeBlock
        language="ts"
        title="hooks.ts — typed accessors"
        code={`import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()`}
      />

      <h3>Slices and async thunks</h3>

      <p>
        Every network call becomes a <code>createAsyncThunk</code>, and every
        thunk has exactly four states to handle: idle, pending, fulfilled, and
        rejected. The <code>extraReducers</code> builder is the right place for
        them, because it lets the case be keyed to the thunk&rsquo;s own type
        rather than to a string you have to keep in sync.
      </p>

      <CodeBlock
        language="ts"
        title="features/orders/ordersSlice.ts"
        code={`import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import { ordersApi } from '../../services/orders'
import type { Order, OrderStatus } from '../../types/api'
import type { RootState } from '../../store'
import { ApiError } from '../../lib/apiError'

type Status = 'idle' | 'loading' | 'succeeded' | 'failed'

type OrdersState = {
  active: Order | null
  history: Order[]
  status: Status
  error: string | null
}

// Arg shape is the thunk's only input. Everything else comes from the store.
export const fetchActiveOrder = createAsyncThunk<Order | null, void, { rejectValue: string }>(
  'orders/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      return await ordersApi.listActive().then((list) => list[0] ?? null)
    } catch (error) {
      return rejectWithValue(
        error instanceof ApiError ? error.displayMessage : 'Could not load your order',
      )
    }
  },
)

export const updateOrderStatus = createAsyncThunk<
  Order,
  { id: string; status: OrderStatus },
  { rejectValue: string }
>(
  'orders/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await ordersApi.updateStatus(id, status)
    } catch (error) {
      // A 401 here means the single-flight guard already failed to recover, so
      // the message is about the session rather than about the order.
      if (error instanceof ApiError && error.isAuthError) {
        return rejectWithValue('Session expired. Please sign in again.')
      }
      return rejectWithValue(
        error instanceof ApiError ? error.displayMessage : 'Could not update the order',
      )
    }
  },
)

const initialState: OrdersState = {
  active: null,
  history: [],
  status: 'idle',
  error: null,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Socket events land here. A websocket message is server state arriving
    // out of band, so it replaces the local copy rather than merging into it.
    statusReceived(state, action: PayloadAction<Order>) {
      if (state.active && state.active._id === action.payload._id) {
        state.active = action.payload
      }
      state.error = null
    },

    locationReceived(
      state,
      action: PayloadAction<{ lat: number; lng: number; heading: number }>,
    ) {
      if (state.active) state.active.riderLocation = action.payload
    },

    clearError(state) {
      state.error = null
    },

    reset() {
      return initialState
    },
  },

  extraReducers: (builder) => {
    builder
      // pending — the only place loading state is set, so no component can
      // forget it.
      .addCase(fetchActiveOrder.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })

      // fulfilled
      .addCase(fetchActiveOrder.fulfilled, (state, action: PayloadAction<Order | null>) => {
        state.status = 'succeeded'
        state.active = action.payload
      })

      // rejected — payload is the rejectValue, which is already a sentence
      // written for a human rather than a raw error object.
      .addCase(fetchActiveOrder.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? action.error.message ?? 'Something went wrong'
      })

      // The optimistic path. Set the new status on tap so the UI responds
      // immediately; the server response then replaces it authoritatively.
      .addCase(updateOrderStatus.pending, (state, action) => {
        const { id, status } = action.meta.arg
        if (state.active && state.active._id === id) {
          state.active.status = status
        }
        state.error = null
      })

      .addCase(updateOrderStatus.fulfilled, (state, action: PayloadAction<Order>) => {
        state.active = action.payload
        state.status = 'succeeded'
      })

      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Could not update the order'
      })
  },
})

export const { statusReceived, locationReceived, clearError, reset } = ordersSlice.actions

// Selectors keep components free of store-shape knowledge.
export const selectActiveOrder = (state: RootState) => state.orders.active
export const selectOrdersStatus = (state: RootState) => state.orders.status
export const selectOrdersError = (state: RootState) => state.orders.error

export default ordersSlice.reducer`}
      />

      <Callout variant="note" title="Selector-first, always">
        <p>
          Components read through exported selectors rather than reaching into{" "}
          <code>state.orders.active</code>. When the shape changes, one file
          changes. It is also the natural home for derived data —{" "}
          <code>createSelector</code> over these is where a memoised cart total
          belongs, not in a component body where it recomputes on every render.
        </p>
      </Callout>

      <h3>Auth slice</h3>

      <p>
        The auth slice owns the token lifecycle, which is why it is the one
        slice that coordinates with the API client rather than sitting above it.
        Session restore runs before any screen renders.
      </p>

      <CodeBlock
        language="ts"
        title="features/auth/authSlice.ts"
        code={`export const login = createAsyncThunk<
  { user: User; accessToken: string; refreshToken: string },
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await api<{
        user: User
        accessToken: string
        refreshToken: string
      }>('/auth/login', { method: 'POST', body: credentials })

      // Persist to the Keychain before anything dispatches, so a crash in the
      // next line cannot leave an authenticated UI with no token behind it.
      setTokenCache(data)
      await tokenStorage.save(data)
      return data
    } catch (error) {
      return rejectWithValue(
        error instanceof ApiError ? error.displayMessage : 'Could not sign in',
      )
    }
  },
)

export const restoreSession = createAsyncThunk<boolean>(
  'auth/restore',
  async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const fresh = await getFreshAccessToken()
    if (!fresh) {
      await tokenStorage.clear()
      return false
    }

    try {
      const user = await api<User>('/auth/me')
      return Boolean(user)
    } catch {
      return false
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  // Best effort. The local session must be destroyed even if the server call
  // fails, or the user cannot sign out on a bad connection.
  try {
    await api<void>('/auth/logout', { method: 'POST' })
  } catch {
    // Deliberately ignored.
  }

  await tokenStorage.clear()
  setTokenCache({ accessToken: '', refreshToken: '' })
  dispatch(reset())          // clears cart, orders, restaurants
  disconnectSocket()
})`}
      />

      <Callout variant="tip" title="Reset every slice on logout">
        <p>
          Signing out must not leave the previous user&rsquo;s cart, orders, or
          cached restaurant data in memory. A root-level <code>reset()</code>{" "}
          action handled by each slice&rsquo;s <code>reset</code> reducer does
          it in one dispatch, and it is the difference between a clean sign-out
          and a data leak onto a shared device.
        </p>
      </Callout>

      <h3>Usage in a component</h3>

      <p>
        The four states map directly onto four render branches. The socket
        binding is set up once at module scope, so the effect below has nothing
        to clean up beyond the subscription.
      </p>

      <CodeBlock
        language="tsx"
        title="app/order/[id].tsx — the four states"
        code={`export default function OrderTrackingScreen() {
  const dispatch = useAppDispatch()
  const order = useAppSelector(selectActiveOrder)
  const status = useAppSelector(selectOrdersStatus)
  const error = useAppSelector(selectOrdersError)
  const [refreshing, setRefreshing] = useState(false)

  // idle -> loading. The socket is the source of truth for status; this fetch
  // is the recovery path for events missed while the app was backgrounded.
  useEffect(() => {
    dispatch(fetchActiveOrder())
  }, [dispatch])

  if (status === 'loading' && !order) return <OrderSkeleton />

  if (status === 'failed' && !order) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-base text-destructive">{error}</Text>
        <Button title="Try again" onPress={() => dispatch(fetchActiveOrder())} />
      </View>
    )
  }

  if (!order) return null

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true)
            await dispatch(fetchActiveOrder())
            setRefreshing(false)
          }}
        />
      }
    >
      <StatusTimeline status={order.status} history={order.statusHistory} />
      {order.rider && <RiderCard rider={order.rider} location={order.riderLocation} />}
    </ScrollView>
  )
}`}
      />

      <h2>What to persist, and what not to</h2>

      <PropertyTable
        headers={["Data", "Store in", "Reason"]}
        rows={[
          [
            "Access and refresh tokens",
            "SecureStore",
            "Credentials. Hardware-backed, excluded from backups.",
          ],
          [
            "Cart contents",
            "Redux + AsyncStorage mirror",
            "Client state that survives a restart. Never in the cart on the server alone.",
          ],
          [
            "Last selected address",
            "AsyncStorage",
            "Pure preference; harmless to lose.",
          ],
          [
            "Restaurant list cache",
            "Redux only",
            "Server state. Persisting it guarantees a stale first paint.",
          ],
          [
            "Order status",
            "Redux only",
            "Server state, and already pushed over the socket.",
          ],
          [
            "Search filters and sort",
            "AsyncStorage",
            "Preference that improves the next session.",
          ],
        ]}
      />

      <Callout variant="note" title="A cart in Redux is a draft, not a cart">
        <p>
          The server holds the authoritative cart for a signed-in user; the
          Redux cart is the optimistic local mirror that makes the UI instant.
          Merge on sign-in and discard on logout, exactly as you would for any
          other client state. If you persist the Redux cart across users, the
          next sign-in briefly shows someone else&rsquo;s items.
        </p>
      </Callout>

      <h2>Wiring the socket to the store</h2>

      <p>
        The socket and the store are the two places server state arrives from.
        They must converge on the same slice, or the UI disagrees with itself.
        Binding happens once, at module scope, so a screen can mount and unmount
        freely without re-registering listeners.
      </p>

      <CodeBlock
        language="ts"
        title="lib/socketBridge.ts"
        code={`import { store } from '../store'
import { statusReceived, locationReceived } from '../features/orders/ordersSlice'
import { connectSocket } from './socket'

let bound = false

export const bindSocketToStore = () => {
  if (bound) return
  bound = true

  const socket = connectSocket()

  socket.on('order:statusChanged', (payload) => {
    store.dispatch(statusReceived(payload))
  })

  socket.on('rider:locationUpdate', (payload) => {
    store.dispatch(locationReceived(payload))
  })

  socket.on('connect', () => {
    // Recovery after a gap: the socket missed events while it was down, so
    // refetch rather than trying to replay them.
    store.dispatch(fetchActiveOrder())
  })
}`}
      />

      <h2>Failure modes worth testing</h2>

      <PropertyTable
        headers={["Scenario", "Expected behaviour", "Where it is handled"]}
        rows={[
          [
            "Airplane mode at launch",
            "Session restore fails; app routes to login with a clear message.",
            "restoreSession rejects",
          ],
          [
            "Token expires mid-session",
            "One refresh, one retry, request succeeds. No logout.",
            "Single-flight guard",
          ],
          [
            "Refresh token revoked",
            "Session cleared; user routed to login.",
            "refreshAccessToken returns null",
          ],
          [
            "Server returns HTML (proxy error)",
            "ApiError with a readable message, not a JSON parse crash.",
            "request() parse guard",
          ],
          [
            "Request hangs past 20s",
            'AbortError normalised to "Request timed out".',
            "AbortController",
          ],
          [
            "DELETE returns 204",
            "Resolves undefined; no JSON parse attempt.",
            "204 short-circuit",
          ],
          [
            "Validation failure",
            "Field errors extracted and mapped to inputs.",
            "ApiError.fieldErrors",
          ],
          [
            "Socket drops mid-delivery",
            "Reconnect then refetch the active order.",
            "socket connect handler",
          ],
        ]}
      />

      <Callout
        variant="warning"
        title="Test the refresh path, not just the happy path"
      >
        <p>
          The concurrent-401 case is the one that reaches production, and it is
          the one nobody tests by hand. Write a test that fires five requests
          simultaneously with an expired access token and assert the refresh
          endpoint was called exactly once. That single assertion protects the
          most damaging bug in a mobile client.
        </p>
      </Callout>

      <h2>Where to go next</h2>

      <p>
        This foundation is complete. The next three chapters build on it
        unchanged: <a href="/docs/mobile/customer">Customer App</a> for
        discovery, checkout and live tracking;{" "}
        <a href="/docs/mobile/restaurant">Restaurant App</a> for order handling
        and menu management; and <a href="/docs/mobile/rider">Rider App</a> for
        going online, accepting jobs, and payouts. Each is the same architecture
        with different screens.
      </p>
    </>
  );
}
