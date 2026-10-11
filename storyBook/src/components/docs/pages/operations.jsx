import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import { Diagram, PropertyTable, Split, Step, Steps } from "../primitives";

export function AdminVerification() {
  return (
    <>
      <p>
        Verification is the gate between a stranger and your platform&rsquo;s
        reputation. A restaurant that serves food that makes customers ill, or a
        rider on a stolen scooter, is a liability that outlives any single bad
        order. This chapter is about making that gate fast enough that operators
        actually use it, and rigorous enough that it holds up when volume
        arrives.
      </p>

      <p>
        Two queues, one workflow: restaurants submit a food licence, GST
        registration, and food safety certificate; riders submit a driving
        licence, vehicle registration, insurance, and sometimes a selfie. Both
        land in <code>pending</code> and wait for an admin.
      </p>

      <h2>The status model</h2>

      <p>
        Three states, and the transitions between them are the whole workflow.
        Note that <code>rejected</code> is not terminal — an applicant whose
        licence photograph was unreadable should be able to resubmit, and a
        model that cannot represent that produces support tickets instead.
      </p>

      <Diagram caption="Verification states and who moves them">
        {`
              ┌─────────┐
              │ pending │  submitted, awaiting review
              └────┬────┘
                   │
        ┌──────────┴───────────┐
        │                      │
   approve                reject (with reason)
        │                      │
        ▼                      ▼
   ┌──────────┐          ┌──────────┐
   │ verified │          │ rejected │
   └────┬─────┘          └────┬─────┘
        │                     │
        │  documents        resubmit
        │  expire           (new upload)
        │                     │
        └───────► pending ◄────┘

   Suspend: verified ──▶ pending, with an audit entry.
   Every transition writes to verificationHistory with
   actorId, timestamp, from, to, and reason.
`}
      </Diagram>

      <PropertyTable
        headers={["Status", "Meaning", "Effect on the applicant"]}
        rows={[
          [
            "pending",
            "Submitted, not yet reviewed",
            "Account exists but cannot transact.",
          ],
          [
            "verified",
            "Documents accepted",
            "Restaurant is listed; rider can go online.",
          ],
          [
            "rejected",
            "Documents refused",
            "Cannot transact; can resubmit after fixing.",
          ],
        ]}
      />

      <Callout variant="note" title="A pending account still exists">
        <p>
          <code>POST /api/riders/register</code> returns{" "}
          <code>
            &ldquo;Rider registration submitted for verification&rdquo;
          </code>
          . The user is real, the login works, the documents are stored. What is
          withheld is permission — the availability toggle is disabled and{" "}
          <code>GET /api/riders/orders/available</code> returns nothing. This is
          better than blocking registration entirely, because the applicant can
          see exactly what state they are in.
        </p>
      </Callout>

      <h2>The review screen</h2>

      <p>
        A queue, not a table. Operators work top to bottom and need three things
        visible at once: the applicant, the documents, and the decision
        controls. A master-detail layout is the only arrangement that achieves
        this without a page change per applicant.
      </p>

      <CodeBlock
        language="tsx"
        title="src/features/restaurants/VerificationQueue.tsx"
        code={`export function VerificationQueue() {
  const [query, setQuery] = useState<VerificationQuery>({
    page: 1,
    limit: 20,
    status: 'pending',        // the queue defaults to pending
    sortBy: 'submittedAt',
    order: 'asc',             // oldest first — nobody gets stranded
  })

  const { data, isFetching } = useQuery({
    queryKey: ['verification-queue', query],
    queryFn: () => restaurantsApi.getVerificationQueue(query).then((r) => r.data),
    staleTime: 10_000,
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <QueueList
        items={data?.restaurants ?? []}
        onSelect={(id) => setSelected(id)}
      />
      {selected ? <DocumentReviewPanel restaurantId={selected} /> : (
        <EmptyState
          title="Select an applicant"
          description="Pick a restaurant from the queue to review its documents."
          icon={<FileSearch className="size-8 text-muted-foreground" />}
        />
      )}
    </div>
  )
}`}
      />

      <p>
        Oldest first is a deliberate default. Sorting newest-first quietly
        rewards whoever submitted most recently, and the applicants at the back
        of the queue are exactly the ones who never come back.
      </p>

      <h2>Document review</h2>

      <p>
        Documents open in a side-by-side viewer with the metadata beside them.
        The panel shows what was uploaded, when, at what resolution, and lets
        the operator zoom — a licence number is usually small in a phone photo.
      </p>

      <PropertyTable
        headers={[
          "Restaurant document",
          "What to check",
          "Common rejection reason",
        ]}
        rows={[
          [
            "FSSAI / food licence",
            "Number matches the restaurant name, valid through at least six months",
            "Expired, or name mismatch with the account",
          ],
          [
            "GST registration",
            "GSTIN well-formed, address matches the registered address",
            "Address differs from the listing",
          ],
          [
            "Food safety certificate",
            "Issued within the last two years",
            "Older than the accepted window",
          ],
          [
            "Shop / lease proof",
            "Premises matches the declared address",
            "Not supplied",
          ],
          [
            "Bank account",
            "Name matches the registered owner",
            "Third-party account",
          ],
        ]}
      />

      <PropertyTable
        headers={["Rider document", "What to check", "Common rejection reason"]}
        rows={[
          [
            "Driving licence",
            "Valid, correct class for the vehicle, legible",
            "Blurred or cropped",
          ],
          [
            "Vehicle registration (RC)",
            "Number plate matches the vehicle photo, not expired",
            "Number does not match",
          ],
          [
            "Insurance",
            "Third-party cover valid through the policy period",
            "Expired",
          ],
          [
            "Selfie / ID photo",
            "Face visible, matches the profile photo",
            "Too dark or obscured",
          ],
          ["Vehicle photo", "Number plate legible", "Unreadable plate"],
        ]}
      />

      <CodeBlock
        language="tsx"
        title="src/components/common/DocumentViewer.tsx"
        code={`export function DocumentViewer({ doc }: { doc: UploadedDocument }) {
  const [zoom, setZoom] = useState(false)

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div>
          <p className="text-sm font-medium">{DOCUMENT_LABELS[doc.type]}</p>
          <p className="text-xs text-muted-foreground">
            Uploaded {formatDistanceToNow(doc.uploadedAt)} ago ·{' '}
            {formatBytes(doc.bytes)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setZoom(true)}>
          <Maximize2 className="size-4" />
          Full size
        </Button>
      </div>

      <div className="bg-muted/40 p-4">
        <img
          src={doc.url}
          alt={DOCUMENT_LABELS[doc.type]}
          className="mx-auto max-h-80 rounded object-contain"
          // Operators review personal data constantly. Blocking external
          // references also stops a malicious upload URL phoning home.
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>
    </div>
  )
}`}
      />

      <Callout variant="warning" title="These URLs are personal data">
        <p>
          A restaurant licence and a rider&rsquo;s driving licence are documents
          containing government identifiers. They must be served over HTTPS from
          a private Cloudinary folder, never a public bucket, and access must be
          audited. The image URL should be signed and short-lived, not a
          permanent public asset. The same applies to the retention policy — see{" "}
          <a href="/docs/production/checklist">Launch Checklist</a>.
        </p>
      </Callout>

      <h2>Approve and reject</h2>

      <p>
        One button each, and rejection requires a reason chosen from a list
        rather than typed freehand. Typed reasons produce the string
        &ldquo;blurry&rdquo; on forty rejected applicants; a structured list
        lets you report which problem is most common and fix it at the source by
        improving the upload screen.
      </p>

      <CodeBlock
        language="tsx"
        title="src/features/restaurants/DecisionPanel.tsx"
        code={`const RESTAURANT_REJECTION_REASONS = [
  { value: 'unreadable_document', label: 'Document is unreadable' },
  { value: 'expired_document',   label: 'Document has expired' },
  { value: 'name_mismatch',      label: 'Name does not match the account' },
  { value: 'address_mismatch',   label: 'Address does not match the documents' },
  { value: 'invalid_document',   label: 'Document appears to be forged' },
  { value: 'incomplete',         label: 'Required documents missing' },
] as const

export function DecisionPanel({ restaurantId }: { restaurantId: string }) {
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState(false)

  const [decide, { isLoading }] = useMutation(verifyRestaurant)

  const reject = async () => {
    await decide({
      restaurantId,
      isVerified: false,
      rejectionReason: reason,
      // The free-text note is optional but strongly encouraged — the
      // rejection reason alone rarely tells the applicant what to fix.
      note,
    }).unwrap()

    toast.success('Application rejected. The applicant has been notified.')
    setConfirm(false)
  }

  return (
    <>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Reject this application?</AlertDialogTitle>
          <AlertDialogDescription>
            {reason && REASON_LABELS[reason]} — the applicant will receive this
            by email and push, and can resubmit after fixing it.
          </AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={reject} disabled={!reason || isLoading}>
            Reject application
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex gap-2">
        <Button onClick={() => approve(restaurantId)} disabled={isLoading}>
          Approve
        </Button>
        <Button variant="destructive" onClick={() => setConfirm(true)}>
          Reject
        </Button>
      </div>
    </>
  )
}`}
      />

      <Callout
        variant="danger"
        title="Approval is one click and irreversible-ish"
      >
        <p>
          Approving a restaurant puts it into public listings within seconds. A
          mis-click exposes a non-existent business to every customer browsing
          nearby. Put the approve button on the left, style it as the safe
          action, and — once you have more than one operator — require the
          applicant to have been in the queue rather than arrived via direct
          link.
        </p>
      </Callout>

      <h2>The audit trail</h2>

      <p>
        Every decision writes an entry that is append-only. Not optional: a
        rejected restaurant that later complains needs a record of who decided
        what, when, and why.
      </p>

      <CodeBlock
        language="js"
        title="Backend: verification controller"
        code={`export const verifyRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { isVerified, rejectionReason, note } = req.body

  const restaurant = await Restaurant.findByIdAndUpdate(
    id,
    {
      isVerified,
      verificationStatus: isVerified ? 'verified' : 'rejected',
      rejectionReason: isVerified ? undefined : rejectionReason,
      verifiedAt: isVerified ? new Date() : undefined,
      verifiedBy: req.user._id,          // who, not just what
    },
    { new: true },
  )

  if (!restaurant) {
    throw new ApiError(404, 'Restaurant not found')
  }

  // Append-only. Never updated, never deleted — a verification dispute is
  // resolved with evidence, and evidence needs a history.
  await VerificationLog.create({
    entityType: 'restaurant',
    entityId: restaurant._id,
    action: isVerified ? 'approved' : 'rejected',
    actorId: req.user._id,
    actorEmail: req.user.email,
    from: 'pending',
    to: restaurant.verificationStatus,
    reason: rejectionReason,
    note,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })

  // The applicant hears about it immediately, in the channel they are
  // most likely to open.
  await Notification.create({
    user: restaurant.ownerId,
    type: 'verification_result',
    title: isVerified
      ? 'Your restaurant has been approved'
      : 'Your application needs attention',
    body: isVerified
      ? \`\${restaurant.name} is now listed and accepting orders.\`
      : REJECTION_MESSAGES[rejectionReason],
    data: { restaurantId: restaurant._id },
  })

  await sendMail({
    to: restaurant.ownerId,
    template: isVerified ? 'restaurant-approved' : 'restaurant-rejected',
    vars: { name: restaurant.name, reason: note || REJECTION_LABELS[rejectionReason] },
  })

  res.json({ success: true, data: { restaurant } })
})`}
      />

      <PropertyTable
        headers={["Audit field", "Why it exists"]}
        rows={[
          [
            "actorId / actorEmail",
            "Who made the decision, even after the account changes.",
          ],
          [
            "action, from, to",
            "The transition itself, so history reads as a timeline.",
          ],
          [
            "reason / note",
            "Why — structured for reporting, free text for the applicant.",
          ],
          [
            "ip / userAgent",
            "Distinguishes a legitimate admin from a stolen session.",
          ],
          ["createdAt", "Timestamp; ordering is what makes the trail useful."],
        ]}
      />

      <h2>Bulk actions</h2>

      <p>
        Once the queue backs up — and it will, on launch day — reviewing one at
        a time stops working. Bulk approve is safe for obvious cases; bulk
        reject never is.
      </p>

      <CodeBlock
        language="tsx"
        title="Bulk approval, with a hard guard on bulk rejection"
        code={`export function BulkActions({ selected }: { selected: string[] }) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2">
      <span className="text-sm font-medium">{selected.length} selected</span>

      <Button
        size="sm"
        onClick={() => bulkApprove.mutate(selected)}
        disabled={selected.length === 0}
      >
        Approve selected
      </Button>

      {/* Bulk rejection is disabled by design. A wrong bulk reject sends
          forty applicants the same rejection email in one second and
          there is no way to un-send it. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button size="sm" variant="destructive" disabled>
              Reject selected
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Rejections must be reviewed one at a time.
        </TooltipContent>
      </Tooltip>
    </div>
  )
}`}
      />

      <Steps>
        <Step title="Queue discipline">
          <p>
            Work oldest-first, and add a &ldquo;claimed&rdquo; state so two
            operators do not review the same application. A claim is a soft lock
            with a 15-minute expiry, not a hard one — a hard lock held by
            someone who went home is worse than a duplicate review.
          </p>
        </Step>

        <Step title="Target the rejection reason at the source">
          <p>
            Group rejections by reason weekly. If 40% are{" "}
            <code>unreadable_document</code>, the fix is a better camera
            experience in the rider app, not more operator patience.
          </p>
        </Step>

        <Step title="Measure time-to-decision">
          <p>
            The median hours between submission and decision is the metric that
            predicts whether applicants stay on the platform. Applicants who
            wait a week for approval frequently never return.
          </p>
        </Step>

        <Step title="Escalate the genuinely ambiguous">
          <p>
            A document that might be forged needs a second opinion, not a coin
            flip. A &ldquo;needs senior review&rdquo; flag with a comment is
            cheap; a wrongful approval is not recoverable.
          </p>
        </Step>
      </Steps>

      <h2>Notification on decision</h2>

      <p>
        Both channels, always. Email is what a restaurant owner actually reads;
        push is what they see within seconds. The application screen also shows
        the current status, so neither is load-bearing.
      </p>

      <PropertyTable
        headers={["Outcome", "Email", "Push title", "App state after"]}
        rows={[
          [
            "Approved",
            "Restaurant approved template with next steps",
            "Your restaurant has been approved",
            "isOpen defaults on; listed publicly",
          ],
          [
            "Rejected",
            "Rejection template with reason and resubmit link",
            "Your application needs attention",
            "pending; can upload new documents",
          ],
          [
            "Documents expired",
            "Expiry notice 30 days ahead",
            "Your licence expires soon",
            "stays verified, flagged for review",
          ],
          [
            "Suspended",
            "Suspension notice with the reason",
            "Your account has been suspended",
            "isActive false; transactions blocked",
          ],
        ]}
      />

      <Callout variant="tip" title="Tell applicants what happens next">
        <p>
          A rejection that says &ldquo;documents rejected&rdquo; generates a
          support ticket. One that says &ldquo;the driving licence photo is too
          blurry to read the number — take it in daylight with a plain
          background and tap the document to capture it&rdquo; does not. You
          already know the reason; write it out.
        </p>
      </Callout>

      <h2>Wiring the endpoint into the UI</h2>

      <p>
        <code>PUT /api/admin/restaurants/:id/verify</code> and{" "}
        <code>PUT /api/admin/riders/:id/verify</code> share a shape, so the API
        client should too — with the reason and note fields added beyond the
        original boolean.
      </p>

      <CodeBlock
        language="ts"
        title="src/services/api/verification.ts"
        code={`import { apiClient, unwrap } from './client'

export const verificationApi = {
  verifyRestaurant: (restaurantId: string, body: VerificationDecision) =>
    apiClient
      .put(\`/admin/restaurants/\${restaurantId}/verify\`, body)
      .then((res) => unwrap<{ restaurant: Restaurant }>(res.data)),

  verifyRider: (riderId: string, body: VerificationDecision) =>
    apiClient
      .put(\`/admin/riders/\${riderId}/verify\`, body)
      .then((res) => unwrap<{ rider: User }>(res.data)),

  queue: (query: VerificationQuery) =>
    apiClient
      .get('/admin/restaurants', { params: { ...query, verificationStatus: 'pending' } })
      .then((res) => unwrap<{ restaurants: Restaurant[]; pagination: Pagination }>(res.data)),

  log: (entityId: string) =>
    apiClient
      .get(\`/admin/verification-log/\${entityId}\`)
      .then((res) => unwrap<VerificationLog[]>(res.data)),
}`}
      />

      <Callout variant="note" title="Verification is not moderation">
        <p>
          Approving a restaurant confirms it is a legal business. It does not
          confirm the food is any good. Menu moderation, banned ingredients, and
          quality enforcement are a separate problem with separate tools — keep
          the two concerns distinct, or the review queue becomes a place where
          everything arrives and nothing is a genuine approval decision.
        </p>
      </Callout>
    </>
  );
}

export function ProductionDeployment() {
  return (
    <>
      <p>
        Deployment is where a working system meets reality: immutable artifacts,
        secrets that are not in the repository, health checks that mean
        something, and store review queues. This chapter covers the backend, the
        admin panel, and the three mobile apps.
      </p>

      <h2>Containerising the backend</h2>

      <p>
        A multi-stage build that ends in a non-root user running only production
        dependencies. Each part of that sentence addresses a specific failure
        mode, and they are worth stating individually.
      </p>

      <CodeBlock
        language="text"
        title="backend/Dockerfile"
        code={`# ── Stage 1: install every dependency, including dev ──────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# ci, not install: it honours the lockfile exactly.
RUN npm ci

# ── Stage 2: build with dev deps present ───────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:swagger

# ── Stage 3: production dependencies only ──────────────────────────
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
# --omit=dev drops nodemon, eslint, the test stack. Typically halves
# the image and removes every one of them from the attack surface.
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 4: the runtime image ──────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Alpine's default has no curl. Adding it is what makes HEALTHCHECK work.
RUN apk add --no-cache curl && \\
    addgroup -g 1001 -S nodejs && \\
    adduser  -u 1001 -S nodejs -G nodejs

COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build      --chown=nodejs:nodejs /app/package.json  ./
COPY --chown=nodejs:nodejs . .

USER nodejs
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \\
  CMD curl -fsS http://localhost:5000/api/health || exit 1

# exec form so the container receives SIGTERM directly and drains
# in-flight requests before the orchestrator kills it.
CMD ["node", "server.js"]`}
      />

      <PropertyTable
        headers={["Decision", "Why it matters here"]}
        rows={[
          [
            "Multi-stage",
            "Build tools never reach the runtime image. Smaller, and fewer CVEs to patch.",
          ],
          [
            "npm ci --omit=dev",
            "Reproducible from the lockfile, and no dev dependency is deployed.",
          ],
          [
            "Non-root USER",
            "A container escape starts as uid 1001, not root. Non-negotiable.",
          ],
          [
            "curl in the runtime",
            "Required by HEALTHCHECK. Without it the check silently never runs.",
          ],
          [
            "--start-period",
            "Stops the container being killed for being slow to boot.",
          ],
          [
            "exec-form CMD",
            "PID 1 receives SIGTERM; in-flight requests drain rather than drop.",
          ],
          [
            "NODE_ENV=production",
            "Express skips dev-only middleware and enables error stack discipline.",
          ],
        ]}
      />

      <h3>Graceful shutdown</h3>

      <p>
        The last row above is not automatic. Without an explicit handler,{" "}
        <code>SIGTERM</code> kills the process mid-request and the customer sees
        a failed order.
      </p>

      <CodeBlock
        language="js"
        title="server.js — draining connections on SIGTERM"
        code={`const server = app.listen(config.port, () => {
  logger.info(\`Server listening on port \${config.port}\`)
})

let shuttingDown = false

async function shutdown(signal) {
  // A rolling deploy sends SIGTERM to several pods at once. Only the
  // first one should start draining; the rest exit immediately so the
  // rollout is not held up by pods that never took traffic.
  if (shuttingDown) return
  shuttingDown = true

  logger.info(\`\${signal} received — shutting down gracefully\`)

  // 1. Stop accepting new connections.
  server.close()

  // 2. Let in-flight requests finish. Ten seconds, then give up.
  const forced = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, 10_000)
  forced.unref()

  // 3. Close the database pool last, after queries in flight have resolved.
  try {
    await mongoose.connection.close()
    logger.info('MongoDB connection closed')
  } catch (err) {
    logger.error('Error closing MongoDB', { error: err.message })
  }

  clearTimeout(forced)
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))`}
      />

      <h2>docker-compose</h2>

      <p>
        For local development and for a single-host deployment. The replica set
        is not optional detail: MongoDB transactions and change streams require
        it, and the compose file below is the easiest way to run one locally
        instead of paying for Atlas.
      </p>

      <CodeBlock
        language="bash"
        title="docker-compose.yml"
        code={`services:
  mongo:
    image: mongo:7
    command: ["--replSet", "rs0", "--bind_ip_all"]
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]
    healthcheck:
      # The one-shot initiates the replica set; every container after this
      # waits on the healthcheck, so they never start before rs.initiate().
      test: >
        mongosh --quiet --eval "
          try { rs.status().ok } catch (e) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo:27017'}]}).ok }
        "
      interval: 5s
      timeout: 5s
      retries: 20

  mongo-init:
    image: mongo:7
    depends_on: { mongo: { condition: service_healthy } }
    restart: on-failure
    command: >
      mongosh --host mongo:27017 --eval
      "rs.add('mongo:27017') || true"

  api:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: { mongo: { condition: service_healthy } }
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://mongo:27017/nutrideliver?replicaSet=rs0
      CLIENT_URL: http://localhost:5173,http://localhost:8081
    env_file: [.env]
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes: ["redis-data:/data"]
    # Only for the Socket.IO adapter and caching. The API works without
    # it, which is exactly what makes it safe to introduce later.

volumes:
  mongo-data:
  redis-data:`}
      />

      <Callout
        variant="note"
        title="Use Atlas in production, not compose Mongo"
      >
        <p>
          Compose is for development and demos. Running your own MongoDB means
          you own backups, point-in-time recovery, upgrades, and disk failure —
          and the backup is the one thing you cannot improvise. Atlas M0 is free
          and beats a self-managed single node on every axis that matters.
        </p>
      </Callout>

      <h2>Environment and secrets</h2>

      <Steps>
        <Step title="Keep .env.example in the repo, .env out of it">
          <CodeBlock
            language="bash"
            title=".env.example — every key, no values"
            code={`NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:8081,http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/nutrideliver
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_SERVICE_ACCOUNT=
EMAIL_USER=
EMAIL_PASS=`}
          />
          <p>
            A contributor clones the repo, copies the example to{" "}
            <code>.env</code>, and knows every key the system needs. A
            contributor who has to ask does not fill it in.
          </p>
        </Step>

        <Step title="Fail the boot if configuration is missing">
          <p>
            <code>config/env.js</code> throws before the server listens. A
            server that boots without <code>STRIPE_SECRET_KEY</code> and then
            fails at the first payment is worse than one that refuses to start —
            you find out at deploy time rather than from a customer.
          </p>
        </Step>

        <Step title="Injected by the platform, never baked into the image">
          <p>
            Render, Railway, Fly, and ECS all inject environment variables at
            runtime. Secrets never appear in a layer, in a{" "}
            <code>docker history</code>, or in a build cache that outlives the
            deploy.
          </p>
        </Step>

        <Step title="Rotate, and make rotation possible">
          <p>
            Store secrets in a manager — AWS Secrets Manager, Render secret
            groups, 1Password, or Vault. Rotating a JWT secret should be a
            variable change and a restart, not an afternoon of grep.
          </p>
        </Step>

        <Step title="Separate keys per environment">
          <p>
            <code>sk_test_</code> and <code>sk_live_</code> from Stripe;
            separate Firebase projects; separate JWT secrets. One shared{" "}
            <code>JWT_ACCESS_SECRET</code> across staging and production means a
            staging leak is a production incident.
          </p>
        </Step>
      </Steps>

      <h2>Health checks</h2>

      <p>
        Two distinct endpoints. Conflating them is a classic failure: a liveness
        probe that checks the database will restart every pod during a brief
        database blip, turning a degradation into an outage.
      </p>

      <CodeBlock
        language="js"
        title="routes/health.js — liveness and readiness, separated"
        code={`import mongoose from 'mongoose'

// Liveness: is the process alive and not deadlocked?
// Deliberately does NOT touch the database. If it did, a 30-second
// database blip would restart every pod simultaneously.
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Readiness: can this pod actually serve traffic?
// The load balancer removes pods that fail this from the rotation.
router.get('/health/ready', async (req, res) => {
  const checks = { mongo: 'unknown', redis: 'unknown' }

  try {
    // admin() pings the server — cheaper than a real query and it
    // exercises the same connection pool the application uses.
    await mongoose.connection.db.admin().ping()
    checks.mongo = 'ok'
  } catch {
    checks.mongo = 'failed'
  }

  const ready = checks.mongo === 'ok'
  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? 'ready' : 'not_ready',
    checks,
  })
})`}
      />

      <PropertyTable
        headers={["Probe", "Checks", "On failure", "Used by"]}
        rows={[
          [
            "Liveness — /api/health",
            "Process is up",
            "Container is restarted",
            "Docker HEALTHCHECK, Kubernetes livenessProbe",
          ],
          [
            "Readiness — /api/health/ready",
            "Mongo reachable",
            "Pod removed from the load balancer",
            "Kubernetes readinessProbe, Fly health checks",
          ],
          [
            "Uptime monitor",
            "External HTTP request",
            "Team is paged",
            "BetterStack, Pingdom, UptimeRobot",
          ],
        ]}
      />

      <Callout
        variant="warning"
        title="A failing readiness probe should not also crash"
      >
        <p>
          If the database is down, the correct behaviour is to remove pods from
          rotation and return 503 — not to restart them. Restarting a pod whose
          only problem is a database connection destroys warm caches and
          in-flight work, and it will not fix the database.
        </p>
      </Callout>

      <h2>Deploying the API</h2>

      <PropertyTable
        headers={["Platform", "Best for", "Watch out for"]}
        rows={[
          [
            "Render",
            "First deploy in an afternoon",
            "Free tier sleeps; WebSocket support on paid only.",
          ],
          [
            "Railway",
            "Simple pricing, generous volumes",
            "WebSockets need a sticky instance.",
          ],
          [
            "Fly.io",
            "Global regions, close to users",
            "Region selection must match your database region.",
          ],
          [
            "AWS (ECS/Fargate)",
            "Control, IAM, VPC peering with Atlas",
            "Most operational surface; worth it past ~50k DAU.",
          ],
          [
            "AWS App Runner",
            "Container deploy with less ceremony than ECS",
            "Fewer knobs; no VPN into Atlas without work.",
          ],
        ]}
      />

      <Steps>
        <Step title="Put the API and the database in the same region">
          <p>
            Every request otherwise pays a cross-region round trip. A restaurant
            menu lookup becomes 80&nbsp;ms of pure latency, and the database
            connection count multiplies by the number of hops.
          </p>
        </Step>

        <Step title="Set the memory limit above the Node heap">
          <p>
            Node will happily grow until the OOM killer intervenes, and the
            resulting restart is abrupt. Set <code>--max-old-space-size</code>{" "}
            to roughly 75% of the container limit, so V8 collects before the
            kernel does.
          </p>
        </Step>

        <Step title="Scale on queue depth, not CPU">
          <p>
            An Express process handling WebSockets is mostly idle. CPU-based
            autoscaling will never trigger, and the pod will hold a hundred
            thousand connections instead of adding capacity. Scale on concurrent
            connections, or on request latency at p95.
          </p>
        </Step>

        <Step title="Run the background jobs in a separate process">
          <p>
            The auto-cancel and operating-hours jobs run every five minutes. In
            one process they run on every replica, producing N duplicate
            cancellations and N duplicate emails. See{" "}
            <a href="/docs/production/scaling">Scaling &amp; Performance</a>.
          </p>
        </Step>
      </Steps>

      <h2>The admin panel and this docs site</h2>

      <p>
        Both are static SPAs. Vite emits a <code>dist/</code> of HTML, CSS, JS,
        and assets, and every path is resolved client-side — which means the
        host must rewrite unknown paths to <code>index.html</code>.
      </p>

      <CodeBlock
        language="json"
        title="vercel.json — the rewrite that makes routing work"
        code={`{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}`}
      />

      <Diagram caption="With and without the rewrite">
        {`
  WITHOUT the rewrite:

    GET /orders/abc123  ──▶  host looks for /orders/abc123
                             no such file  ──▶  404 page

  WITH the rewrite:

    GET /orders/abc123  ──▶  host serves /index.html
                             React Router reads the path, finds the
     orders/:id route, renders the drawer. Refresh works too.
`}
      </Diagram>

      <Callout variant="danger" title="The rewrite is the whole deployment">
        <p>
          A Vite SPA without a catch-all rewrite works perfectly in{" "}
          <code>npm run dev</code> and fails completely in production. Clicking
          a link works — the router handles it in memory — and refreshing does
          not. Test this by building, serving the output statically, and hitting
          a deep URL directly.
        </p>
      </Callout>

      <h2>Deploying the admin panel</h2>

      <CodeBlock
        language="bash"
        title="Build and ship"
        code={`# The build runs tsc first, so a type error fails the deploy.
npm ci
npm run build          # → dist/

# Verify locally before shipping. This is the only way to catch the
# SPA rewrite problem.
npx serve -s dist      # -s is the SPA flag; without it, deep links 404`}
      />

      <PropertyTable
        headers={["Host", "Config", "Notes"]}
        rows={[
          [
            "Vercel",
            "vercel.json",
            "Zero-config for Vite; the rewrite is inferred, but declare it anyway.",
          ],
          ["Netlify", "_redirects", "Line: /*  /index.html  200"],
          [
            "Cloudflare Pages",
            "_redirects",
            "Same syntax; fastest global edge for an internal tool.",
          ],
          [
            "S3 + CloudFront",
            "Error document = /index.html",
            "Cheapest at scale; error document is the setting people miss.",
          ],
          [
            "Nginx",
            "try_files $uri /index.html;",
            "Self-hosted; also needs the cache headers.",
          ],
        ]}
      />

      <Callout
        variant="note"
        title="Environment variables are build-time for Vite"
      >
        <p>
          <code>VITE_API_URL</code> is inlined at build time, not read at
          runtime. Changing the API URL means a rebuild, not a restart. Keep the
          API URL the same across environments, or script the swap into the
          deploy pipeline — do not hand-edit a host&rsquo;s environment tab and
          expect it to take effect.
        </p>
      </Callout>

      <h2>Shipping the mobile apps</h2>

      <p>
        Three apps, one process. Expo&rsquo;s EAS handles credentials, build
        services, and store submission; the point of using it is that nobody on
        your team needs a Mac with Xcode to produce an iOS build.
      </p>

      <CodeBlock
        language="bash"
        title="eas.json — the profiles worth defining"
        code={`{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.nutrideliver.com"
      },
      "ios": { "buildType": "store" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {}
  }
}`}
      />

      <Steps>
        <Step title="Log in and link the project">
          <CodeBlock
            language="bash"
            title="One-time setup"
            code={`npm i -g eas-cli
eas login
eas init
eas build:configure`}
          />
        </Step>

        <Step title="Build for a single platform or both">
          <CodeBlock
            language="bash"
            title="Builds"
            code={`eas build -p ios
eas build -p android
eas build -p all --profile production

# The preview profile produces an APK you can sideload directly,
# which is how QA gets a build without touching the stores.
eas build -p android --profile preview`}
          />
        </Step>

        <Step title="Submit to both stores">
          <CodeBlock
            language="bash"
            title="Store submission"
            code={`eas submit -p ios
eas submit -p android
eas submit -p all --latest`}
          />
          <p>
            <code>eas credentials</code> generates the APNs key and uploads the
            FCM service account interactively. Credentials live in EAS, never in
            the repository.
          </p>
        </Step>

        <Step title="Set the API URL per environment">
          <p>
            <code>EXPO_PUBLIC_</code> variables are inlined into the JS bundle
            at build time, so a production build must be built with the
            production URL. A staging build pointing at production is a very
            common and very embarrassing mistake; the <code>env</code> block
            above is the guard.
          </p>
        </Step>
      </Steps>

      <h3>OTA updates</h3>

      <p>
        <code>eas update</code> ships JavaScript and assets to installed apps
        without a store review. For a food delivery app this is transformative:
        a broken filter screen is a fix in minutes rather than a two-day review.
      </p>

      <CodeBlock
        language="bash"
        title="Shipping an OTA update"
        code={`# Preview: only your own devices get it.
eas update --branch preview --message "Fix restaurant filter"

# Production rollout, staged to 20% of users first.
eas update --branch production --message "Checkout total fix" --rollout-percentage 20

# Promote to everyone once metrics look clean.
eas update --branch production --message "Checkout total fix" --rollout-percentage 100`}
      />

      <PropertyTable
        headers={["Change", "Needs a new build?", "Reason"]}
        rows={[
          ["JS/TS code, styles, images", "No", "Bundled as OTA assets."],
          [
            "A new native module",
            "Yes",
            "Requires a native build and store review.",
          ],
          [
            "Permissions or manifest changes",
            "Yes",
            "Info.plist and AndroidManifest are native.",
          ],
          [
            "Changing Expo SDK or React Native version",
            "Yes",
            "Native code is generated per SDK.",
          ],
          [
            "Signing keys, bundle IDs, store metadata",
            "Yes",
            "Build-time concerns.",
          ],
        ]}
      />

      <Callout variant="warning" title="OTA cannot change native behaviour">
        <p>
          Adding <code>expo-location</code> needs a development build before it
          works, and shipping it to production needs a store build. Plan for
          native changes on a monthly cadence rather than trying to make them
          weekly — and never let an OTA depend on a native module the installed
          build does not have, or you get a crash you cannot roll back.
        </p>
      </Callout>

      <h2>A deployment checklist</h2>

      <PropertyTable
        headers={["Surface", "Must be true before you ship"]}
        rows={[
          [
            "API",
            "Image builds, healthcheck passes, env vars injected, migrations or index sync run.",
          ],
          [
            "API",
            "Logs go somewhere queryable, not only to stdout inside a container.",
          ],
          [
            "Admin panel",
            "Build passes with tsc, SPA rewrite configured, deep link tested in production.",
          ],
          ["Docs site", "Same rewrite; internal links verified after deploy."],
          [
            "Mobile",
            "Production API URL, correct signing keys, store listing, permission strings.",
          ],
          [
            "Mobile",
            "Push credentials configured and a real device tested end to end.",
          ],
          [
            "Stripe",
            "Live keys swapped, webhook URL updated, live mode tested end to end.",
          ],
          ["All", "Monitoring and alerting live before the first real order."],
        ]}
      />

      <p>
        The last row is the one people skip. Deploying monitoring after the
        first incident means you learn about the next one from a customer. See{" "}
        <a href="/docs/production/observability">Logging &amp; Monitoring</a>.
      </p>
    </>
  );
}

export function ProductionScaling() {
  return (
    <>
      <p>
        Scaling is not one activity but a sequence, and the order matters. Do
        the cheap, reversible things first and you will often never reach the
        expensive ones. For a marketplace at NutriDeliver&rsquo;s shape, the
        sequence is: index properly, kill N+1s, cache what does not change, then
        add machines.
      </p>

      <h2>Read the index before you guess</h2>

      <p>
        Almost every performance problem is a missing or wrong index, and almost
        every index decision is made by intuition rather than measurement.{" "}
        <code>explain()</code> is the difference.
      </p>

      <CodeBlock
        language="js"
        title="explain() on the order history query"
        code={`// The customer order history — the most-hit query in the app.
db.orders.find({ customer: ObjectId("..."), createdAt: { $gte: ISODate("2026-09-01") } })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain("executionStats")

// What a good plan looks like:
{
  executionStats: {
    nReturned: 20,
    totalKeysExamined: 24,     // ← ~1.2 per document returned
    totalDocsExamined: 20,     // ← no wasted fetches
    executionTimeMillis: 2
  },
  queryPlanner: {
    winningPlan: {
      stage: 'IXSCAN',         // index used
      indexName: 'customer_1_createdAt_-1',
      keysExaminedPerDocument: 1.2
    }
  }
}

// What a bad plan looks like:
{
  queryPlanner: {
    winningPlan: { stage: 'COLLSCAN' }   // full collection scan
  },
  executionStats: { totalDocsExamined: 2_418_930 }
}`}
      />

      <Callout variant="note" title="Two ratios to memorise">
        <p>
          <code>totalKeysExamined / nReturned</code> above roughly 10 means the
          index is doing far more work than it should. A winning plan of{" "}
          <code>COLLSCAN</code> on any collection above a few thousand documents
          means you need an index. Both are visible in a single{" "}
          <code>explain</code> call, and both are impossible to guess reliably.
        </p>
      </Callout>

      <h3>The indexes NutriDeliver actually needs</h3>

      <PropertyTable
        headers={["Index", "Serves", "Query it enables"]}
        rows={[
          [
            "{ customer: 1, createdAt: -1 }",
            "Customer order history",
            "GET /api/orders (customer)",
          ],
          [
            "{ restaurant: 1, createdAt: -1 }",
            "Restaurant order list",
            "GET /api/restaurants/restaurant/orders",
          ],
          [
            "{ status: 1, createdAt: 1 }",
            "Auto-cancel scan, admin filters",
            "Background jobs, admin table",
          ],
          [
            "{ 'deliveryDetails.riderId': 1 }",
            "Rider assigned orders",
            "GET /api/orders/rider/my-orders",
          ],
          [
            '{ location: "2dsphere" }',
            "Nearby restaurants and riders",
            "Geo queries within a radius",
          ],
          ["{ email: 1 } unique", "Login", "Every auth request"],
          [
            "{ notificationPreferences.code: 1 } unique",
            "Offer lookup",
            "POST /api/offers/validate",
          ],
          [
            '{ restaurant: 1, name: "text" }',
            "Menu search",
            "GET /api/food/search",
          ],
        ]}
      />

      <Callout variant="warning" title="Compound index order follows the query">
        <p>
          A compound index serves queries only when the leading field is in the
          filter. <code>{"{ status: 1, createdAt: 1 }"}</code> does not help a
          query that filters only on <code>createdAt</code>. The rule: equality
          fields first, then the sort field, then the range field. Getting this
          backwards produces an index the query planner silently ignores.
        </p>
      </Callout>

      <p>
        Build indexes in Mongoose model definitions so they exist everywhere,
        but build them in the background on a large collection —{" "}
        <code>autoIndex: false</code> in production with an explicit{" "}
        <code>syncIndexes()</code> at boot. Creating an index on a ten-million
        document collection blocks writes for minutes, and doing that during a
        deploy is a self-inflicted outage.
      </p>

      <h2>The N+1 problem</h2>

      <p>
        N+1 is the second most common cause of slowness after missing indexes,
        and the most commonly missed, because the endpoint returns correct data
        and merely takes four seconds.
      </p>

      <CodeBlock
        language="js"
        title="The bug — one query per order"
        code={`// Looks innocent. N restaurants per page. N + 1 queries.
const orders = await Order.find({ restaurantId })
  .sort({ createdAt: -1 })
  .limit(20)

for (const order of orders) {
  // Runs 20 separate queries, one per row, because populate() is a
  // separate round trip per document.
  order.deliveryDetails = await User.findById(order.deliveryDetails.riderId)
  order.items = await OrderItem.find({ order: order._id })
}

return orders`}
      />

      <CodeBlock
        language="js"
        title="The fix — one query, in-memory joins"
        code={`// One aggregate. One round trip. No N.

const orders = await Order.aggregate([
  { $match: { restaurantId: new ObjectId(restaurantId) } },
  { $sort: { createdAt: -1 } },
  { $limit: 20 },

  // Reverse-lookup the riders in a single indexed query and inline
  // the array, instead of one lookup per order.
  { $lookup: {
      from: 'users',
      let: { riderIds: '$deliveryDetails.riderId' },
      pipeline: [
        { $match: { $expr: { $in: ['$_id', { $ifNull: ['$$riderIds', []] }] } } },
        { $project: { firstName: 1, lastName: 1, phone: 1, avatar: 1 } },
      ],
      as: 'riders',
  } },

  { $project: {
      orderId: 1, total: '$pricing.grandTotal', status: 1, createdAt: 1,
      // Replace the single ObjectId with the matching array entry.
      rider: { $first: '$riders' },
  } },
])

return orders`}
      />

      <Split
        left={{
          title: "Diagnosing N+1",
          children: (
            <ul>
              <li>
                Log query counts per request; more than ~10 for one endpoint is
                a smell.
              </li>
              <li>
                Profiler: a request with flat latency but hundreds of queries is
                N+1.
              </li>
              <li>
                Look for <code>await</code> inside a <code>for</code> or{" "}
                <code>map</code> — always suspect.
              </li>
              <li>
                Watch <code>populate()</code> on an array of documents.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Fixing it",
          children: (
            <ul>
              <li>
                <code>$lookup</code> with a <code>let</code>/
                <code>pipeline</code> for a true join.
              </li>
              <li>
                Batch: <code>{"find({ _id: { $in: ids } })"}</code> then index
                by <code>_id</code> in JS.
              </li>
              <li>
                <code>DataLoader</code> if you already have a batch layer.
              </li>
              <li>
                Never <code>populate()</code> two levels deep on a list
                endpoint.
              </li>
            </ul>
          ),
        }}
      />

      <h2>Caching</h2>

      <p>
        Cache what does not change, invalidate it when it does, and be honest
        about staleness. The failure mode is never a stale read — it is a cache
        that is never invalidated and quietly serves a menu with a dish that was
        deleted a week ago.
      </p>

      <PropertyTable
        headers={["What", "TTL", "Invalidated by", "Note"]}
        rows={[
          [
            "Restaurant detail",
            "5 min",
            "Restaurant update",
            "The most-read object in the system.",
          ],
          [
            "Public restaurant listing",
            "60 s",
            "Open/closed toggle, create, update",
            "Short TTL, high hit rate.",
          ],
          [
            "Menu by restaurant",
            "2 min",
            "Food item create/update/delete",
            "Editors notice a 2-minute delay; customers do not.",
          ],
          [
            "Available orders for riders",
            "5 s",
            "Accept, status change",
            "Must be near-real-time; 5 s is the floor.",
          ],
          [
            "Dashboard aggregates",
            "5 min",
            "Time only",
            "Nobody minds a stale revenue tile.",
          ],
          [
            "Cloudinary transformations",
            "30 days",
            "CDN",
            "Handled by the CDN, not by you.",
          ],
          [
            "Session / refresh token blocklist",
            "Until expiry",
            "Logout",
            "Only needed once you add revocation.",
          ],
        ]}
      />

      <CodeBlock
        language="js"
        title="A cache with explicit invalidation"
        code={`import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Stampede protection: one request populates, the rest wait for it.
// Without this, a cache expiry during peak hours fires a hundred
// simultaneous identical aggregation pipelines.
const inflight = new Map()

export async function cached(key, ttlSeconds, producer) {
  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit)

  if (inflight.has(key)) return inflight.get(key)

  const promise = (async () => {
    const value = await producer()
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    return value
  })()

  inflight.set(key, promise)
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

// Invalidation is explicit and always called from the write path —
// never from a cron, never "eventually".
export const invalidateMenu = (restaurantId) =>
  redis.del(\`menu:\${restaurantId}\`, \`restaurant:\${restaurantId}\`)

export const invalidateListing = () =>
  redis.del('restaurants:public')`}
      />

      <Callout variant="danger" title="Never cache a personalised response">
        <p>
          A cache key of <code>/api/orders</code> with no user dimension serves
          one customer&rsquo;s orders to another. Every cached key must include
          every input that changes the response — including the authenticated
          user ID. When in doubt, do not cache an authenticated endpoint.
        </p>
      </Callout>

      <h2>Images and CDN</h2>

      <p>
        Food photography is the second-largest bandwidth cost after video, and
        the easiest to optimise. Serving a 2&nbsp;MB hero image to a phone on
        mobile data is a support ticket and a churn event.
      </p>

      <CodeBlock
        language="js"
        title="Cloudinary — transform at upload, not at serve"
        code={`// utils/cloudinary.js — transform once, on upload. The CDN then
// serves a pre-sized asset and the origin never sees the request.
const MENU_TRANSFORM = {
  resource_type: 'image',
  transformation: [
    { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
    { fetch_format: 'auto' },   // AVIF where supported, WebP otherwise
  ],
}

export const uploadMenuImage = (buffer) =>
  cloudinary.uploader.upload_stream(
    { folder: 'nutrideliver/menu', ...MENU_TRANSFORM },
    (error, result) => (error ? reject(error) : resolve(result)),
  )`}
      />

      <PropertyTable
        headers={["Transformation", "Applied where", "Effect"]}
        rows={[
          [
            "quality: auto:good",
            "Upload",
            "Targeted compression; typically 40% smaller at equal perceived quality.",
          ],
          ["fetch_format: auto", "Upload", "AVIF/WebP negotiation by CDN."],
          [
            "crop: limit, aspect 1:1",
            "Upload",
            "A menu grid of mixed aspect ratios looks broken.",
          ],
          [
            "w_400 / w_800 variants",
            "Serve",
            "Thumbnails for lists, full size only on the detail screen.",
          ],
          [
            "Lazy loading + blurhash",
            "Client",
            "A 20-byte placeholder while the image downloads.",
          ],
          [
            "Signed, expiring URLs for documents",
            "Serve",
            "Government IDs must not be permanently public.",
          ],
        ]}
      />

      <h2>Horizontal scaling of the API</h2>

      <p>
        The API is stateless — JWT carries all context, no server-side sessions,
        no in-memory cache that must be shared. That makes scaling out genuinely
        routine.
      </p>

      <Diagram caption="Stateless API behind a load balancer">
        {`
                 ┌─────────────────────────┐
   HTTPS ──────▶│  Load balancer / L7 LB  │
                 └───────────┬─────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ api-1   │         │ api-2   │         │ api-3   │
   │ socket  │◀───────▶│ socket  │◀───────▶│ socket  │   sticky
   └────┬────┘         └────┬────┘         └────┬────┘   affinity
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                  ┌────────────────────┐
                  │  Redis adapter     │  pub/sub between instances
                  └────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │  MongoDB replica   │
                  └────────────────────┘
`}
      </Diagram>

      <p>
        HTTP requests distribute freely across instances. WebSocket connections
        cannot: they are stateful and long-lived, and the Socket.IO handshake
        establishes a session that subsequent frames must return to. Without
        sticky routing, a reconnect lands on a different instance and the
        session lookup fails.
      </p>

      <CodeBlock
        language="js"
        title="Socket.IO Redis adapter — required for more than one instance"
        code={`import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pubClient = createClient({ url: process.env.REDIS_URL })
const subClient = pubClient.duplicate()

await Promise.all([pubClient.connect(), subClient.connect()])

// Without this, an emit to room "customer-123" only reaches the
// instance that emitted it. The customer is connected to instance 2;
// instance 1 sends the order update; nothing happens.
io.adapter(createAdapter(pubClient, subClient))`}
      />

      <Callout
        variant="danger"
        title="The adapter is not optional past one instance"
      >
        <p>
          A single-instance deployment works perfectly with no adapter, and the
          bug appears the moment you add a second instance during a traffic
          spike: orders stop updating for most users, with no error anywhere.
          Enable the adapter and configure sticky sessions <em>before</em> you
          scale out, not after the incident.
        </p>
      </Callout>

      <PropertyTable
        headers={["Concern", "Solved by", "Note"]}
        rows={[
          [
            "HTTP load distribution",
            "Round-robin L7 load balancer",
            "Stateless, so no affinity needed.",
          ],
          [
            "Socket.IO sessions",
            "Sticky sessions (cookie or IP hash)",
            "Required unless the adapter handles it.",
          ],
          [
            "Cross-instance broadcasts",
            "Socket.IO Redis adapter",
            "Pub/sub; the adapter does not fix affinity.",
          ],
          ["Shared cache", "Redis", "Never in-process."],
          [
            "Background jobs",
            "Separate worker process",
            "Must run on exactly one instance.",
          ],
          [
            "Rate limiting",
            "Redis store for express-rate-limit",
            "In-memory limits reset per instance.",
          ],
        ]}
      />

      <h2>Background workers off the API</h2>

      <p>
        NutriDeliver runs three jobs — auto-cancel every five minutes,
        operating-hours sync every five minutes, notification cleanup nightly.
        Running them inside <code>server.js</code> means they run once per
        replica. Three pods means three auto-cancel passes, three cancellation
        emails, and a race on which one wins the update.
      </p>

      <CodeBlock
        language="js"
        title="Gating the jobs on a single instance"
        code={`// server.js — run jobs only where the leader flag is held.
if (process.env.RUN_JOBS === 'true') {
  // A single-replica deployment just sets the env var. Multi-replica
  // uses a Redis lock so exactly one instance wins each tick.
  if (await acquireLock('jobs:auto-cancel', 270)) {
    setInterval(autoCancelUnclaimedOrders, 5 * 60 * 1000)
    setInterval(syncRestaurantOpenStatus, 5 * 60 * 1000)
    setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000)

    logger.info('Background jobs scheduled on this instance')
  }
}`}
      />

      <p>
        The cleaner long-term move is a separate worker container with the same
        image and a different entrypoint. Same code, different process, no
        duplicated timers, and it can be scaled independently of API traffic.
      </p>

      <h2>Read replicas</h2>

      <p>
        Once the primary is CPU-bound, most reads can move. But{" "}
        <code>readPreference: secondary</code> introduces replication lag, and
        lag is a correctness problem in a marketplace.
      </p>

      <Split
        left={{
          title: "Safe on a secondary",
          children: (
            <ul>
              <li>Restaurant listings and menus.</li>
              <li>Analytics and reporting queries.</li>
              <li>Popular items, category listings, search.</li>
              <li>Anything an operator reads and acts on minutes later.</li>
            </ul>
          ),
        }}
        right={{
          title: "Must stay on the primary",
          children: (
            <ul>
              <li>Order status immediately after any write.</li>
              <li>
                The auto-cancel job&rsquo;s status check — a stale read misses
                claimable orders.
              </li>
              <li>The rider-accept conditional update.</li>
              <li>Anything that must read its own write.</li>
              <li>Auth: a token issued seconds ago must validate.</li>
            </ul>
          ),
        }}
      />

      <h2>Sharding, and when you actually need it</h2>

      <p>
        Sharding is the last resort, not a scaling strategy. Almost every
        problem that appears to need sharding is solved by an index, a cache, or
        another instance.
      </p>

      <PropertyTable
        headers={[
          "Scale",
          "Single node + replicas + cache",
          "Sharding required?",
        ]}
        rows={[
          ["Up to ~1M orders", "Comfortable", "No. Atlas M30 handles this."],
          ["~10M orders", "Fine with indexes and aggregation tuning", "No."],
          [
            "~100M orders",
            "Possible, but analytics and index builds hurt",
            "Consider it.",
          ],
          ["Beyond that", "—", "Yes, or archive cold orders out first."],
        ]}
      />

      <Callout variant="tip" title="Archive before you shard">
        <p>
          Delivered orders older than ninety days are needed for order history
          and payouts, and for nothing else. Moving them to an archive
          collection or S3 Parquet typically removes 70% of the working set for
          a fraction of the operational cost of a sharded cluster — and it is
          reversible, which sharding is not.
        </p>
      </Callout>

      <h2>Where the money goes</h2>

      <p>
        The useful question is not &ldquo;how do we scale&rdquo; but &ldquo;what
        dominates the bill at our size&rdquo;. Assuming an order value of $12, a
        20% commission, roughly three orders per customer per week, and about
        15% of riders online at any moment:
      </p>

      <PropertyTable
        headers={["Cost centre", "1k DAU", "10k DAU", "100k DAU", "First move"]}
        rows={[
          [
            "MongoDB",
            "Free (M0)",
            "$50–200",
            "$800–3,000",
            "Indexes, then read replicas",
          ],
          [
            "API compute",
            "$5",
            "$30–100",
            "$600–2,500",
            "Horizontal scale; cheapest to fix",
          ],
          [
            "Images / CDN",
            "$0–10",
            "$50–200",
            "$2,000–8,000",
            "Transforms, WebP, thumbnails",
          ],
          [
            "Push notifications",
            "Free",
            "Free–$20",
            "$100–400",
            "Batch and chunk sends",
          ],
          [
            "Socket connections",
            "$0",
            "$10–50",
            "$500–2,000",
            "Sticky sessions + adapter",
          ],
          [
            "Stripe fees",
            "~$15",
            "~$150",
            "~$1,500",
            "Proportional — 2.9% + $0.30",
          ],
          [
            "Observability",
            "$0",
            "$20–80",
            "$300–1,200",
            "Sample logs, cap retention",
          ],
        ]}
      />

      <p>
        Read the middle column. At 10k DAU the database and images dominate, and
        both are solved by tuning rather than by new machines. At 100k DAU
        images become the single largest controllable line — which is why the
        upload-time transformation above is worth doing on day one, long before
        it matters.
      </p>

      <Callout variant="note" title="Non-linear costs to watch for">
        <p>
          Socket connections grow with concurrent riders, not with orders — a
          slow API can hold connections open far longer than necessary and turn
          a traffic blip into a connection-count problem. Image bandwidth grows
          with page views, so a share button or a bug that re-renders images in
          a loop can multiply a minor line item overnight. And observability
          grows with log volume, which grows with traffic — sampling is the
          lever.
        </p>
      </Callout>
    </>
  );
}

export function ProductionObservability() {
  return (
    <>
      <p>
        Observability is what turns &ldquo;the app is broken&rdquo; into
        &ldquo;orders placed between 14:02 and 14:07 failed with a Stripe
        timeout on pod api-3&rdquo;. This chapter covers the five things worth
        having, in the order you should build them.
      </p>

      <h2>Structured logging</h2>

      <p>
        Winston with JSON output. The requirement is not formatting — it is that
        every log line carries the fields you will filter on later: request ID,
        user ID, route, and duration. A log you cannot query by request ID is a
        log you will read one line at a time.
      </p>

      <CodeBlock
        language="js"
        title="utils/logger.js"
        code={`import winston from 'winston'
import { config } from '../config/env.js'

const { combine, timestamp, json, errors, printf, colorize } = winston.format

// Human-readable in development, JSON in production. The log aggregator
// cannot parse the pretty format, and developers should not be reading
// JSON all day.
const consoleFormat = config.env === 'development'
  ? combine(colorize(), printf(({ level, message, timestamp: ts, ...meta }) => {
      const rest = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
      return \`\${ts} \${level}: \${message}\${rest}\`
    }))
  : json()

export const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), consoleFormat),
  transports: [
    new winston.transports.Console({
      // Never let a logging failure take down a request handler.
      handleExceptions: true,
    }),
  ],
})

// In production the container runtime collects stdout. In development
// you also want a file so you can tail without losing scrollback.
if (config.env === 'development') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  )
}`}
      />

      <CodeBlock
        language="js"
        title="middleware/requestLogger.js — the fields every line needs"
        code={`export const requestLogger = (req, res, next) => {
  // Incoming trace ID from the load balancer or an upstream service.
  // Propagating it means one search covers the whole request path.
  req.id = req.get('x-request-id') ?? randomUUID()
  res.setHeader('X-Request-Id', req.id)

  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6

    logger.info('request', {
      requestId: req.id,
      method: req.method,
      // req.originalUrl, not req.url — the latter is rewritten by routers
      // and loses the path you actually want to group by.
      route: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?._id ?? null,
      role: req.user?.role ?? null,
      ip: req.ip,
    })
  })

  next()
}`}
      />

      <PropertyTable
        headers={["Field", "Used to answer"]}
        rows={[
          ["requestId", "Every log line for one request, across all services."],
          [
            "route",
            "Which endpoints are slow or erroring, grouped not per-URL.",
          ],
          ["status", "Error rate per route — the core availability metric."],
          [
            "durationMs",
            "Latency percentiles, which need percentiles not averages.",
          ],
          ["userId", "Everything one user did, for support tickets."],
          ["role", "Whether an outage is customer-facing or admin-only."],
        ]}
      />

      <Callout variant="warning" title="Never log these">
        <p>
          Passwords, JWTs, full card numbers, addresses on customer records,
          document URLs. Log a truncated hash or the last four digits if you
          need correlation, and nothing more. A log aggregator is a data store
          with the weakest access controls in your stack and a long retention —
          treat writing PII into it as publishing it.
        </p>
      </Callout>

      <h2>Shipping logs somewhere queryable</h2>

      <p>
        <code>docker logs</code> does not survive a redeploy and cannot be
        searched across instances. Ship to an aggregator.
      </p>

      <PropertyTable
        headers={["Service", "Cost", "Worth it when"]}
        rows={[
          [
            "Better Stack / Papertrail",
            "Cheap hosted",
            "You want a search UI and not much else.",
          ],
          [
            "Grafana Cloud + Loki",
            "Free tier is generous",
            "You already run Grafana.",
          ],
          ["Datadog", "Expensive", "You need APM and metrics in one product."],
          [
            "AWS CloudWatch",
            "Included with ECS/RDS",
            "You are already all-in on AWS.",
          ],
          [
            "Plain files + logrotate",
            "Free",
            "Never. Not for anything beyond local dev.",
          ],
        ]}
      />

      <h2>Error tracking with Sentry</h2>

      <p>
        Logs tell you what happened; Sentry tells you how often, to whom, and
        with what stack trace and breadcrumbs. It also groups by fingerprint, so
        one bug is one issue rather than ten thousand events.
      </p>

      <CodeBlock
        language="js"
        title="backend — Sentry with source maps"
        code={`import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: config.env,
  // Sample aggressively in production. Every error is valuable; every
  // transaction is not.
  tracesSampleRate: config.env === 'production' ? 0.05 : 1.0,
  beforeSend(event) {
    // Expected 4xx are not incidents. Reporting them buries the real bugs.
    if (event.exception?.values?.[0]?.type === 'ApiError') return null
    return event
  },
})

app.use((err, req, res, next) => {
  // Handled ApiErrors are business outcomes; only unexpected ones are
  // errors. Reporting "minimum order not met" as an exception trains
  // everyone to ignore the alert channel.
  if (!(err instanceof ApiError)) {
    Sentry.withScope((scope) => {
      scope.setUser({ id: req.user?._id })
      scope.setTag('requestId', req.id)
      scope.setExtra('url', req.originalUrl)
      Sentry.captureException(err)
    })
  }
  next(err)
})`}
      />

      <CodeBlock
        language="json"
        title="mobile Sentry — the crash report that gets acted on"
        code={`{
  "expo": {
    "plugins": ["expo-source-maps"],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}`}
      />

      <PropertyTable
        headers={["Signal", "Include?", "Why"]}
        rows={[
          [
            "requestId",
            "Yes",
            "Correlate a crash with the server logs for the same request.",
          ],
          [
            "userId",
            "Yes",
            "How many users a bug affects, not how many events.",
          ],
          ["appVersion", "Yes", "Proves the OTA update fixed it."],
          [
            "deviceModel / OS version",
            "Yes",
            "Points at the actual cause half the time.",
          ],
          [
            "Screen / route",
            "Yes",
            "Makes the report actionable without a repro.",
          ],
          [
            "Breadcrumbs: last 10 actions",
            "Yes",
            "The single most useful field for reproduction.",
          ],
        ]}
      />

      <Callout variant="tip" title="Source maps are not optional on mobile">
        <p>
          Without them a stack trace is minified frame numbers that mean
          nothing.
          <code>expo-source-maps</code> uploads them at build time and Sentry
          deobfuscates. The alternative is asking a user to reproduce a crash on
          demand, which does not happen.
        </p>
      </Callout>

      <h2>APM and metrics</h2>

      <p>
        APM answers &ldquo;where did the time go&rdquo;. For a Node service
        behind a database, the answer is almost always one of four things, and
        each has an instrument.
      </p>

      <CodeBlock
        language="js"
        title="Instrumenting the two things worth tracing"
        code={`// 1. Request duration — the RED method: Rate, Errors, Duration.
app.use(httpMetricsMiddleware)

// 2. Database queries — Mongoose is the usual culprit and the only way
//    to see it is to instrument it.
mongoose.set('debug', config.env === 'development')

mongoose.connection.on('commandStarted', (event) => {
  const durationMs = Date.now() - event.startTime.toTime()

  if (durationMs > SLOW_QUERY_MS) {
    logger.warn('slow query', {
      durationMs,
      collection: event.collectionName,
      // Log the shape, never the values — the filter can contain an
      // email address or an address.
      filterKeys: Object.keys(event.queryFilter ?? {}),
      plan: event.command?.find ? 'find' : 'aggregate',
    })
  }
})

const SLOW_QUERY_MS = 100`}
      />

      <h3>Metrics worth exporting</h3>

      <PropertyTable
        headers={["Metric", "Type", "Alert on"]}
        rows={[
          [
            "http_requests_total{route,status}",
            "Counter",
            "Rate of 5xx per route",
          ],
          ["http_request_duration_ms{route}", "Histogram", "p95 above 800 ms"],
          [
            "mongo_query_duration_ms{collection}",
            "Histogram",
            "p95 above 100 ms",
          ],
          [
            "mongo_pool_checkouts_total",
            "Counter",
            "Saturation — waitQueue > 0",
          ],
          ["orders_created_total", "Counter", "Rate drop > 80% vs baseline"],
          [
            "orders_cancelled_total{reason}",
            "Counter",
            "Auto-cancel rate spike",
          ],
          [
            "payment_webhook_failures_total",
            "Counter",
            "Any sustained non-zero",
          ],
          [
            "socket_connections_active",
            "Gauge",
            "Approaching the instance limit",
          ],
          [
            "push_sent_total / push_failed_total",
            "Counter",
            "Delivery rate below 90%",
          ],
        ]}
      />

      <h2>Health probes and uptime monitoring</h2>

      <p>
        Two layers, described in{" "}
        <a href="/docs/production/deployment">Deployment</a>. What matters here
        is the external monitor: an in-cluster probe cannot tell you the cluster
        is unreachable from the internet, which is the failure users actually
        experience.
      </p>

      <PropertyTable
        headers={["Check", "Endpoint", "Interval", "Alert after"]}
        rows={[
          ["API up", "GET /api/health", "60 s", "3 consecutive failures"],
          ["API ready", "GET /api/health/ready", "60 s", "5 minutes"],
          [
            "Customer app reachable",
            "GET / (static host)",
            "5 min",
            "2 failures",
          ],
          [
            "Admin panel reachable",
            "GET / (static host)",
            "5 min",
            "2 failures",
          ],
          [
            "Stripe webhook endpoint",
            "GET /api/payments/webhook",
            "5 min",
            "1 failure",
          ],
          ["Certificate expiry", "TLS check", "Daily", "14 days remaining"],
        ]}
      />

      <Callout variant="note" title="Monitor the webhook endpoint's existence">
        <p>
          The Stripe webhook returning 500 is one failure. The endpoint being
          deleted by a bad deploy is a different and much worse one — payments
          succeed and the order never confirms. A cheap synthetic check against
          the endpoint catches it in minutes instead of at reconciliation.
        </p>
      </Callout>

      <h2>Database metrics</h2>

      <p>
        Connection pool saturation and slow queries explain most database
        incidents, and both are visible before users complain.
      </p>

      <CodeBlock
        language="js"
        title="Reading the connection pool"
        code={`// poolSize   100   — total connections Mongoose will open
// waitQueue    47   — requests BLOCKED waiting for a connection
//
// waitQueue > 0 is the signal. It means requests are queueing for the
// database, which is why latency climbed, and it usually predates a
// latency alert by several minutes.
//
// Root causes, in order of frequency for this workload:
//   1. An N+1 hammering the database with sequential queries
//   2. A new query shape without a matching index (collection scan)
//   3. Aggregation pipelines running on every dashboard poll
//   4. Genuine traffic exceeding the provisioned tier`}
      />

      <CodeBlock
        language="js"
        title="Reading a query plan for the real cause"
        code={`db.orders
  .find({ customer: ObjectId("...") })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain("executionStats")

// totalDocsExamined vastly greater than nReturned → missing index.
// IXSCAN with high keysExaminedPerDocument → compound index order
//   is wrong (leading field not in the filter).
// Stage FETCH after a large IXSCAN → covering index missing; add the
//   projected fields to the compound index.`}
      />

      <h2>Alerts worth having</h2>

      <p>
        An alert that fires on something you cannot act on trains people to
        ignore the channel. These five are worth waking someone for; everything
        else belongs in a dashboard.
      </p>

      <Steps>
        <Step title="Payment webhook failures">
          <p>
            Any sustained failure means orders are paid but not confirmed, or
            confirmations are being missed entirely. Customers see paid orders
            that never start. Page immediately — every minute is orders stuck.
          </p>
        </Step>

        <Step title="Error rate spike">
          <p>
            5xx rate above 2% for five minutes, against a 24-hour baseline
            rather than an absolute threshold. A service that normally serves 20
            requests a minute and one that serves 20,000 need different absolute
            bars.
          </p>
        </Step>

        <Step title="Auto-cancel rate spike">
          <p>
            Auto-cancellations above roughly 3% of orders mean riders are not
            accepting ready orders — usually a supply problem, not a bug. It is
            a business alarm as much as a technical one, and it is invisible
            without a metric, because the system keeps working.
          </p>
        </Step>

        <Step title="No riders online">
          <p>
            Zero available riders in an active service area for ten minutes
            during business hours. Customers are placing orders that will expire
            undelivered, and nothing in the system throws an error.
          </p>
        </Step>

        <Step title="Order creation failure rate">
          <p>
            <code>POST /api/orders</code> is the single most important endpoint.
            Any failure rate above 0.5% is the platform down, regardless of what
            every other health check says.
          </p>
        </Step>
      </Steps>

      <Callout variant="warning" title="Alert on symptoms, page on outcomes">
        <p>
          High CPU, slow queries, and connection pool saturation belong on
          dashboards. They are causes, they are often harmless, and paging on
          them is how an on-call rotation learns to ignore pages. Page when
          orders cannot be placed or payments cannot be confirmed.
        </p>
      </Callout>

      <h2>What to look at during an incident</h2>

      <CodeBlock
        language="bash"
        title="The first five queries"
        code={`# 1. Is it us? Which route, which status, since when?
#    Logs, filtered: status:5xx over the last 15 minutes

# 2. Is it everything or one pod?
#    Compare request volume per instance — a single bad pod looks
#    different from a platform-wide issue in per-instance stats.

# 3. Did we just deploy?
#    Almost always the answer, and it is one query.

# 4. Is the database the bottleneck?
#    Connection pool waitQueue, plus any slow-query warnings
#    in the last 10 minutes.

# 5. What changed in a dependency?
#    Stripe, FCM, Cloudinary status pages.`}
      />

      <h2>Log retention and cost</h2>

      <p>
        Logs grow faster than traffic. A chatty DEBUG line at 100 requests per
        second is more data than all your application logs combined — and log
        storage is usually the least expected line on a cloud bill.
      </p>

      <PropertyTable
        headers={["Strategy", "Effect", "When"]}
        rows={[
          [
            "INFO in production, DEBUG only in dev",
            "Removes most volume at source",
            "Default. Do this first.",
          ],
          [
            "Sample at 10% for successful requests",
            "Keeps every error, thins the noise",
            "Once volume becomes a problem.",
          ],
          [
            "Never log 2xx health checks",
            "Removes the single noisiest line",
            "Immediate, and obviously correct.",
          ],
          [
            "30 days hot, 90 days cold",
            "Usually enough to investigate a complaint",
            "Default retention.",
          ],
          ["Payload logging", "Do not. Ever.", "—"],
        ]}
      />

      <Callout
        variant="danger"
        title="Turn off health-check logging before anything else"
      >
        <p>
          An orchestrator polling <code>/api/health</code> every 10 seconds
          across ten pods is 86,400 log lines a day from a single endpoint. It
          is the easiest and largest log reduction available, and it takes one
          line of middleware to skip.
        </p>
      </Callout>
    </>
  );
}

export function ProductionChecklist() {
  return (
    <>
      <p>
        This is the last chapter, and it is the one that decides whether the
        first week is manageable or catastrophic. Everything here is a
        verification step, not a recommendation — an item is done when you have
        confirmed it, not when you have intended to.
      </p>

      <h2>Security</h2>

      <PropertyTable
        headers={["Check", "How to verify", "Severity"]}
        rows={[
          [
            "All secrets rotated from development values",
            "Grep the repo for sk_test, JWT defaults, and placeholder keys",
            "Critical",
          ],
          [
            "JWT access and refresh use different secrets",
            "Compare JWT_ACCESS_SECRET and JWT_REFRESH_SECRET",
            "Critical",
          ],
          [
            "No secret committed to git history",
            "Run a secret scanner over the full history, not just HEAD",
            "Critical",
          ],
          [
            "Helmet enabled with a strict CSP",
            "curl -I and inspect the headers",
            "High",
          ],
          [
            "CORS locked to real origins",
            "Remove wildcards; test from an unlisted origin",
            "High",
          ],
          [
            "Rate limits on auth and payment routes",
            "Six failed logins in a minute should be blocked",
            "High",
          ],
          [
            "Dependency audit clean",
            "npm audit — triage every high and critical",
            "High",
          ],
          [
            "Admin routes require the admin role",
            "Call /api/admin/users with a customer token; expect 403",
            "Critical",
          ],
          [
            "Upload size and MIME type validated",
            "Attempt a 100 MB and an .exe upload",
            "High",
          ],
          [
            "MongoDB not publicly reachable",
            "Confirm no 0.0.0.0 binding in production",
            "Critical",
          ],
          [
            "Refresh tokens revocable on logout",
            "Log out, then try to refresh",
            "High",
          ],
          [
            "Socket.IO origin restricted",
            "Reject connections from unlisted origins",
            "Medium",
          ],
        ]}
      />

      <Callout variant="danger" title="The CORS check people skip">
        <p>
          A wildcard <code>Access-Control-Allow-Origin: *</code> on an API with
          cookie-based auth is a cross-origin data theft vector on any site a
          logged-in operator visits. Test it from a real unlisted origin, not by
          reading the config.
        </p>
      </Callout>

      <h2>Payments</h2>

      <PropertyTable
        headers={["Check", "How to verify", "Severity"]}
        rows={[
          [
            "Live keys in the production environment",
            "Log the key prefix; confirm it is sk_live",
            "Critical",
          ],
          [
            "Webhook URL points at production",
            "Check the endpoint in the Stripe dashboard",
            "Critical",
          ],
          [
            "Webhook signature verified",
            "Send a forged payload and confirm a 400",
            "Critical",
          ],
          [
            "End-to-end live payment completed",
            "Real card, real order, real delivery",
            "Critical",
          ],
          [
            "Full refund tested end to end",
            "Refund, confirm funds returned, confirm notification sent",
            "Critical",
          ],
          [
            "Partial refund tested",
            "Refund half, confirm the remainder is not refundable twice",
            "High",
          ],
          [
            "Currency and tax correct for your market",
            "Compare the confirmation to a manual calculation",
            "High",
          ],
          [
            "Failed payment leaves the order recoverable",
            "Decline a card; confirm the order state and the user path",
            "High",
          ],
          [
            "Idempotency keys on order creation",
            "Double-tap the pay button; confirm one order and one charge",
            "Critical",
          ],
        ]}
      />

      <h2>Data</h2>

      <PropertyTable
        headers={["Check", "How to verify", "Severity"]}
        rows={[
          [
            "All indexes built",
            "Run explain() on the five hottest queries",
            "High",
          ],
          [
            "Compound indexes match query shapes",
            "Confirm the leading field is in the filter",
            "High",
          ],
          [
            "Backups enabled and scheduled",
            "Check the provider dashboard for a recent snapshot",
            "Critical",
          ],
          [
            "Restore drill performed",
            "Restore last night into a scratch database and query an order",
            "Critical",
          ],
          [
            "Write concern reviewed for orders",
            "Confirm orders are acknowledged by a majority",
            "High",
          ],
          [
            "Seed data is not in production",
            'Query the database for "Test Restaurant"',
            "High",
          ],
          [
            "Notification retention job configured",
            "Confirm it runs and old documents disappear",
            "Medium",
          ],
          [
            "Document URLs are not publicly guessable",
            "Try a sequential or unlisted URL",
            "High",
          ],
        ]}
      />

      <Callout
        variant="warning"
        title="A backup you have never restored is a hope"
      >
        <p>
          Restore drills are the single most-skipped item on this list and the
          one that matters most. An untested backup fails at the exact moment
          you need it, in the exact format you did not anticipate. Budget thirty
          minutes; do it before launch, not during your first incident.
        </p>
      </Callout>

      <h2>Mobile apps</h2>

      <PropertyTable
        headers={["Check", "How to verify", "Severity"]}
        rows={[
          [
            "Production API URL baked into the bundle",
            "Inspect the built JS for the production hostname",
            "Critical",
          ],
          [
            "Store signing keys configured",
            "The installed build launches and updates",
            "Critical",
          ],
          [
            "Push notifications working on a physical device",
            "Development build, not Expo Go — see Notifications",
            "Critical",
          ],
          [
            "Deep links resolve from a cold start",
            "Open a tracking link with the app terminated",
            "High",
          ],
          [
            "Permissions requested in context, not at launch",
            "No system prompt before the user has seen value",
            "High",
          ],
          [
            "OTA update rolls back cleanly",
            "Ship a bad update and revert it",
            "High",
          ],
          [
            "Version bump and autoIncrement working",
            "Build twice; the second build increments",
            "Medium",
          ],
          [
            "App works on the oldest supported device",
            "One low-end Android is worth more than ten flagships",
            "High",
          ],
        ]}
      />

      <h2>Store listing</h2>

      <PropertyTable
        headers={["Asset", "iOS", "Android", "Notes"]}
        rows={[
          [
            "App icon",
            "1024×1024, no alpha",
            "Adaptive, foreground + background",
            "Design once, export per size.",
          ],
          [
            "Screenshots",
            '6.7" and 6.5"',
            "Phone + tablet",
            "Show three screens: home, order, tracking.",
          ],
          [
            "App name",
            "30 characters",
            "30 characters",
            "Include the category for search.",
          ],
          ["Short description", "30 characters", "80 characters", ""],
          [
            "Full description",
            "4000 characters",
            "4000 characters",
            "Include keywords — app store search is weak.",
          ],
          [
            "Support URL",
            "Required",
            "Required",
            "Must be a real page, not a mailto.",
          ],
          [
            "Privacy policy URL",
            "Required",
            "Required",
            "Must be publicly reachable without a login.",
          ],
          ["Category and age rating", "Required", "Required", ""],
        ]}
      />

      <h3>Permissions, justified</h3>

      <PropertyTable
        headers={["Permission", "String", "Justification to include"]}
        rows={[
          [
            "NSLocationWhenInUse",
            "Location",
            "Shows your position on the delivery map and finds restaurants near you.",
          ],
          [
            "NSLocationAlwaysAndWhenInUse",
            "Location",
            "Shares your position with the customer while you deliver so they can see the food arriving.",
          ],
          [
            "NSPhotoLibraryUsageDescription",
            "Photos",
            "Lets you attach a delivery photo as proof.",
          ],
          [
            "NSCameraUsageDescription",
            "Camera",
            "Takes the delivery confirmation photo.",
          ],
          [
            "POST_NOTIFICATIONS",
            "Notifications",
            "Tells you when an order is assigned and when its status changes.",
          ],
          [
            "ACCESS_FINE_LOCATION",
            "Location",
            "Enables delivery navigation and order assignment in your area.",
          ],
        ]}
      />

      <Callout variant="danger" title="Vague permission strings get rejected">
        <p>
          Apple rejects &ldquo;we need location&rdquo;. The string must state
          the user-facing reason in their terms. For background location
          especially, ship a short screen explaining the feature before the
          system prompt — reviewers want to see the justification, not just read
          it.
        </p>
      </Callout>

      <h3>Offline and edge-case states</h3>

      <PropertyTable
        headers={["State", "Where it appears", "Verified?"]}
        rows={[
          ["No network", "Every screen", "Airplane mode, full walkthrough"],
          ["Slow network", "Catalogues", "Throttled connection"],
          ["Empty cart", "Cart", "Remove everything"],
          ["Empty order history", "Orders tab", "New account"],
          ["Restaurant closed mid-order", "Checkout", "Place at 22:59"],
          [
            "Item unavailable at checkout",
            "Checkout",
            "Sell out an item in another session",
          ],
          [
            "Address outside the delivery radius",
            "Checkout",
            "Select a distant address",
          ],
          ["Below minimum order", "Checkout", "Small basket"],
          ["Session expired", "Any screen", "Revoke the token and navigate"],
          ["Server unreachable", "Any screen", "Stop the backend"],
          ["Push denied", "Any screen", "Deny and relaunch"],
          ["Location denied", "Rider tracking", "Deny in Settings"],
        ]}
      />

      <h2>Operations</h2>

      <PropertyTable
        headers={["Check", "Detail", "Severity"]}
        rows={[
          [
            "Logs shipping to an aggregator",
            "Verified by searching for a known request ID",
            "Critical",
          ],
          [
            "Sentry receiving exceptions",
            "Throw a test error and confirm the alert arrives",
            "High",
          ],
          [
            "Uptime monitor alerting",
            "Confirm the alert reaches a phone, not just an email",
            "Critical",
          ],
          [
            "Five operational alerts configured",
            "Payment webhooks, error rate, auto-cancel, no riders, order failures",
            "High",
          ],
          [
            "Runbook written",
            "One page: deploy, rollback, restart, scale, common incidents",
            "High",
          ],
          [
            "Rollback tested",
            "Deploy a broken build and roll it back under time pressure",
            "High",
          ],
          [
            "On-call rotation defined",
            "Named people, not a distribution list",
            "Medium",
          ],
          [
            "Status page or incident channel",
            "Where you communicate during an outage",
            "Medium",
          ],
          [
            "Staging environment",
            "Separate from production, with its own database",
            "High",
          ],
        ]}
      />

      <h2>Legal and business</h2>

      <PropertyTable
        headers={["Item", "Why it matters", "Severity"]}
        rows={[
          [
            "Terms of service",
            "Liability, acceptable use, arbitration",
            "Critical",
          ],
          [
            "Privacy policy",
            "Legally required, must match actual data handling",
            "Critical",
          ],
          [
            "Refund and cancellation policy",
            "Published and enforced consistently",
            "Critical",
          ],
          [
            "Data retention policy",
            "How long order and document data is kept",
            "High",
          ],
          [
            "Cookie or tracking consent",
            "If you track or use non-essential cookies",
            "High",
          ],
          [
            "Restaurant agreement",
            "Commission, payouts, liability, termination",
            "Critical",
          ],
          [
            "Rider agreement",
            "Classification as contractor or employee",
            "Critical",
          ],
          [
            "Insurance",
            "Public liability at minimum; confirm platform coverage",
            "High",
          ],
          ["Tax registration", "VAT or GST obligations on commission", "High"],
          [
            "Support SLA",
            "What response time you promise, and to whom",
            "Medium",
          ],
        ]}
      />

      <Callout variant="warning" title="Your privacy policy must match reality">
        <p>
          If the policy says data is deleted after 90 days and your database has
          two years of addresses, that is a compliance exposure — and in several
          jurisdictions an actively misleading one. Reconcile the document with
          the retention job before launch, not after a complaint.
        </p>
      </Callout>

      <h2>The first 48 hours</h2>

      <p>
        Launch monitoring is not the same as launch-time monitoring. Most
        incidents are not bugs — they are capacity, configuration, and
        unfamiliar real-world data. Watch these specifically.
      </p>

      <Steps>
        <Step title="Hour 0–2: order flow, end to end">
          <p>
            Place three real orders with real payments at three different times
            of day. Confirm each reaches <code>delivered</code>, the restaurant
            is notified within seconds, and a rider is assigned. Watch the
            dashboard and the logs at the same time.
          </p>
        </Step>

        <Step title="Hour 0–4: push delivery">
          <p>
            Confirm push delivery rate is above 90% on real devices. Below that,
            find out whether it is token pruning, an FCM misconfiguration, or
            permission denial — and note that customers are not getting
            notifications.
          </p>
        </Step>

        <Step title="Hour 0–6: first refund or intervention">
          <p>
            The first refund reveals whether your reason taxonomy is usable and
            whether the customer-facing message reads well. Do one deliberately
            early rather than discovering the wording during a real dispute.
          </p>
        </Step>

        <Step title="Hour 0–12: rider supply">
          <p>
            Watch the ratio of riders online to ready orders. If orders queue
            with no riders, you have a supply problem that no amount of bug
            fixing will solve, and you need to recruit or adjust incentives.
          </p>
        </Step>

        <Step title="Hour 0–24: latency under real data">
          <p>
            Check p95 latency by route and connection pool waitQueue. Real data
            is larger than seed data and aggregation pipelines behave
            differently. A dashboard that takes eight seconds is a bug report
            waiting to happen.
          </p>
        </Step>

        <Step title="Hour 0–48: the support queue">
          <p>
            Read every support message. The first twenty-four hours of user
            complaints are a specification document for what to fix next, and
            almost none of it will be what you predicted.
          </p>
        </Step>
      </Steps>

      <Callout
        variant="tip"
        title="Have one person watching, and one person sleeping"
      >
        <p>
          Launch needs an owner whose only job is watching dashboards and logs
          for a day, not a rotating group of people all refreshing the same
          page. One watch, one clear hand-off, and a written log of everything
          that fired. The first 48 hours set the operational baseline you will
          be measured against for the next year.
        </p>
      </Callout>

      <h2>What comes next</h2>

      <p>
        NutriDeliver is complete: four applications, one backend, a deployment
        pipeline, and a checklist. The most valuable next step is not a feature
        — it is running one order per screen of this system end to end and
        watching where it feels slow, awkward, or wrong. Everything above that
        matters was built to support that moment.
      </p>
    </>
  );
}
