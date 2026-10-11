import { Callout } from "../callout";
import { CodeBlock } from "../code-block";
import { Diagram, PropertyTable, Split, Step, Steps } from "../primitives";

/**
 * The data-and-safety half of the backend: models, validation, errors,
 * middleware, and auth. Each chapter depends only on the ones before it.
 */

export function BackendModels() {
  return (
    <>
      <p>
        Ten collections carry the entire platform. If the schemas are wrong,
        nothing built on top of them can be correct — and schema changes get
        expensive the moment real documents exist. This chapter covers what each
        model stores, why it is shaped that way, and which indexes earn their
        keep.
      </p>

      <h2>The decisions that apply to every model</h2>

      <p>
        Three schema options are set on nearly every model, and they are worth
        stating once rather than ten times.
      </p>

      <PropertyTable
        headers={["Option", "Value", "Why it matters"]}
        rows={[
          [
            "timestamps",
            "true",
            "Adds createdAt and updatedAt. Every collection gets a free audit trail, an implicit sort key, and a TTL anchor.",
          ],
          [
            "strict",
            "true",
            "Unknown paths are discarded rather than silently written. A typo in a controller becomes an obvious missing field instead of a phantom one.",
          ],
          [
            "toJSON transform",
            "delete __v, delete password",
            "Controls exactly what leaves the process. This is the last line of defence before a credential is serialised into a response.",
          ],
        ]}
      />

      <p>
        The third is the one people skip, and it is the one that produces
        incidents. Mongoose includes <code>__v</code> on every document and
        includes every path by default. A transform lets you remove both the
        version key and any sensitive field once, at the schema level, rather
        than relying on every controller to remember{" "}
        <code>select('-password')</code>.
      </p>

      <CodeBlock
        language="js"
        title="Schema options that apply everywhere"
        code={`const schemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      // The version key is an internal implementation detail. Clients have no
      // use for it and it only ever invites optimistic-concurrency bugs.
      delete ret.__v
      return ret
    },
  },
}`}
      />

      <Callout
        variant="danger"
        title="Deleting a field in a transform is not the same as excluding it"
      >
        <p>
          A <code>toJSON</code> transform runs at serialisation time. The value
          still exists on the document, still lives in memory, and will still be
          written if you save it. For credentials, use both: a{" "}
          <code>select: false</code> path so the field is never loaded, and a
          transform so it is never serialised. Either one alone leaves a gap.
        </p>
      </Callout>

      <h2>User</h2>

      <p>
        One collection holds all four roles, discriminated by <code>role</code>.
        The alternative — separate collections per role — means four login
        flows, four token shapes, and four places for an authorisation bug to
        hide.
      </p>

      <CodeBlock
        language="js"
        title="models/User.js — the core identity fields"
        code={`const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'restaurant', 'rider', 'admin'],
      default: 'user',
    },
    passwordResetOTP: String,
    passwordResetExpires: Date,

    profile: {
      firstName: { type: String, required: [true, 'First name is required'], trim: true },
      lastName: { type: String, required: [true, 'Last name is required'], trim: true },
      phone: { type: String, trim: true },
      avatar: { type: String, default: '' },
      dateOfBirth: Date,
    },

    preferences: {
      dietaryRestrictions: [
        {
          type: String,
          enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free',
                 'nut-free', 'keto', 'paleo'],
        },
      ],
      allergies: [String],
      calorieGoal: Number,
    },

    addresses: [
      {
        type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        coordinates: { lat: Number, lng: Number },
        isDefault: { type: Boolean, default: false },
      },
    ],

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)`}
      />

      <h3>Role-specific sub-schemas</h3>

      <p>
        Rider-only fields live under <code>riderProfile</code>, and a restaurant
        owns a separate <code>Restaurant</code> document rather than an inline
        sub-document. Both are subdocuments; the reasons differ.
      </p>

      <Split
        left={{
          title: "Embedded on User (riderProfile)",
          children: (
            <ul>
              <li>
                Always read with the user — verification status, availability,
                earnings.
              </li>
              <li>Never queried independently of its user.</li>
              <li>
                Bounded size: one vehicle, one earnings summary, a handful of
                documents.
              </li>
              <li>
                Updating availability is a single-document write, with no join.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Separate collection (Restaurant)",
          children: (
            <ul>
              <li>
                Queried on its own: geospatial search, cuisine filters, ratings.
              </li>
              <li>Potentially many documents per owner over time.</li>
              <li>Mutated by public requests while the owner is not online.</li>
              <li>
                Needs its own indexes, which would bloat the User collection.
              </li>
            </ul>
          ),
        }}
      />

      <CodeBlock
        language="js"
        title="models/User.js — the rider sub-document"
        code={`riderProfile: {
  vehicleType: {
    type: String,
    enum: ['bicycle', 'motorcycle', 'car', 'scooter'],
  },
  vehicleNumber: String,
  licenseNumber: String,
  licenseImage: String,
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  availabilityStatus: {
    isOnline: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline',
    },
    lastOnline: Date,
  },
  currentLocation: {
    coordinates: { lat: Number, lng: Number },
    lastUpdated: Date,
  },
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  documents: [
    {
      type: {
        type: String,
        enum: ['license', 'insurance', 'vehicle_registration'],
      },
      documentUrl: String,
      verified: { type: Boolean, default: false },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
},`}
      />

      <Callout variant="note" title="Earnings are a summary, not a ledger">
        <p>
          The <code>earnings</code> block on <code>riderProfile</code> is a
          denormalised total. It exists so the rider app can render a dashboard
          without an aggregation pipeline on every screen. The per-delivery
          detail — delivery fee, tip, bonus, payout status — is derived from the{" "}
          <code>Order</code> collection. If the two ever disagree, the Order
          collection wins and the summary is rebuilt.
        </p>
      </Callout>

      <h3>Indexes on User</h3>

      <CodeBlock
        language="js"
        title="models/User.js — indexes"
        code={`userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'riderProfile.availabilityStatus.status': 1 });
userSchema.index({ 'riderProfile.currentLocation.coordinates': '2dsphere' });

// Hash on save. isModified() guards the hot path so we do not re-hash on
// every profile update — the single most common bcrypt performance bug.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};`}
      />

      <h2>Restaurant</h2>

      <p>
        The merchant listing. Two fields carry disproportionate weight:{" "}
        <code>isOpen</code>, which decides whether the restaurant appears in any
        public listing, and <code>contact.address.coordinates</code>, which
        powers every nearby query.
      </p>

      <CodeBlock
        language="js"
        title="models/Restaurant.js — location, hours, and delivery settings"
        code={`operatingHours: {
  opening: { type: String, required: true },
  closing: { type: String, required: true },
  days: [
    {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday',
             'friday', 'saturday', 'sunday'],
    },
  ],
},
rating: { type: Number, default: 0, min: 0, max: 5 },
totalReviews: { type: Number, default: 0 },
images: [String],
isActive: { type: Boolean, default: true },
isVerified: { type: Boolean, default: false },

// Maintained from operatingHours by a scheduled job, and overridable by the
// restaurant for a private event or a holiday closure.
isOpen: { type: Boolean, default: true },

deliverySettings: {
  deliveryFee: { type: Number, default: 2.99 },
  minOrderAmount: { type: Number, default: 15 },
  deliveryRadius: { type: Number, default: 10 },      // kilometres
  estimatedDeliveryTime: { type: Number, default: 30 }, // minutes
},`}
      />

      <h3>Geospatial indexing</h3>

      <p>
        The <code>2dsphere</code> index turns &ldquo;restaurants within 5 km of
        this address&rdquo; into a single indexed lookup. Without it, the same
        query is a collection scan with a Haversine calculation per document.
      </p>

      <CodeBlock
        language="js"
        title="models/Restaurant.js — geospatial and filter indexes"
        code={`restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ 'contact.address.coordinates': '2dsphere' });
restaurantSchema.index({ cuisineType: 1 });
restaurantSchema.index({ isOpen: 1 });
restaurantSchema.index({ rating: -1 });

// The compound index every public listing actually uses: nearby, open, then
// sorted by rating. Without the compound form MongoDB can only choose one of
// the three and will scan.
restaurantSchema.index({
  'contact.address.coordinates': '2dsphere',
  isOpen: 1,
  rating: -1,
});`}
      />

      <Callout
        variant="warning"
        title="Latitude and longitude are not interchangeable"
      >
        <p>
          The schema stores <code>{"{ lat, lng }"}</code>, and MongoDB accepts
          that as a legacy coordinate pair. If you switch to the GeoJSON form,
          the order is <strong>longitude first</strong>:{" "}
          <code>{"{ type: 'Point', coordinates: [lng, lat] }"}</code>. Swapping
          them is a bug that produces plausible-looking results for part of the
          world and nothing at all elsewhere.
        </p>
      </Callout>

      <h2>FoodItem</h2>

      <p>
        A sellable menu entry. This is where NutriDeliver earns its name: the
        nutrition block is not decoration. Customers filter on it, and the whole
        product is built around it.
      </p>

      <CodeBlock
        language="js"
        title="models/FoodItem.js — nutrition, tags, and pricing"
        code={`price: { type: Number, required: [true, 'Price is required'], min: 0 },

// Macronutrients are required. A healthy-food platform that permits an item
// with unknown calories cannot honestly filter for a calorie goal.
calories: { type: Number, required: [true, 'Calories information is required'] },
protein: { type: Number, required: true },
carbs: { type: Number, required: true },
fat: { type: Number, required: true },

ingredients: [{ type: String, required: true }],

dietaryTags: [
  {
    type: String,
    enum: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free',
           'low-carb', 'high-protein', 'keto', 'paleo', 'sugar-free',
           'organic', 'non-gmo'],
  },
],

images: [{ type: String, required: [true, 'At least one image is required'] }],
preparationTime: { type: Number, required: true, min: 1 }, // minutes
isAvailable: { type: Boolean, default: true },

nutritionalInfo: {
  servingSize: String,
  fiber: Number,
  sugar: Number,
  sodium: Number,
  cholesterol: Number,
  vitamins: [{ name: String, amount: String }],
},

customizationOptions: [
  {
    name: String,
    options: [{ name: String, price: Number }],
  },
],`}
      />

      <p>
        The macros sit at the top level while the micronutrients nest under{" "}
        <code>nutritionalInfo</code>. That is deliberate: the top-level fields
        are indexed and filtered on, and anything you filter on does not belong
        in a nested object.
      </p>

      <CodeBlock
        language="js"
        title="models/FoodItem.js — index strategy"
        code={`foodItemSchema.index({ restaurantId: 1, isAvailable: 1 });
foodItemSchema.index({ categoryId: 1, isAvailable: 1 });
foodItemSchema.index({ price: 1 });
foodItemSchema.index({ calories: 1 });
foodItemSchema.index({ dietaryTags: 1 });
foodItemSchema.index({ rating: -1 });`}
      />

      <Callout variant="tip" title="Multikey indexes have a limit">
        <p>
          <code>{"{ dietaryTags: 1 }"}</code> is a multikey index and MongoDB
          will not compound it with another array field. That is fine here,
          because
          <code>dietaryTags</code> is the only array on FoodItem — if you add a
          second one, the compound index will silently fail to build.
        </p>
      </Callout>

      <h2>Order</h2>

      <p>
        The most important document in the system, and the one with the most
        defensible design decisions. Two of them — embedded item snapshots and
        the pricing breakdown — exist to protect historical truth.
      </p>

      <h3>Embedded item snapshots</h3>

      <p>
        Each order item stores <code>foodItemId</code> <em>and</em> the name,
        unit price, and chosen customisations as they were at purchase time.
        That is deliberate redundancy, and it is the correct call.
      </p>

      <Diagram caption="Why order items embed a snapshot instead of referencing the menu">
        {`
  Reference-only (the trap)
  ────────────────────────
  Order ──► FoodItem ──► price: 12.50
            Restaurant updates the price to 14.00
            → last month's order now displays 14.00, and the
              recorded receipt disagrees with the charge.

  Embedded snapshot (what NutriDeliver does)
  ─────────────────────────────────────────
  Order.items[0] = { foodItemId: 5f2…, name: "Protein Bowl",
                     price: 12.50, quantity: 2 }
  → price changes tomorrow, this order is unaffected.
  → the receipt is provable from the order alone.
`}
      </Diagram>

      <CodeBlock
        language="js"
        title="models/Order.js — item snapshots"
        code={`items: [
  {
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true,
    },
    // Snapshot fields — written once at checkout, never updated.
    name: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    specialInstructions: String,
    customization: [
      {
        option: String,
        choice: String,
        price: Number,
      },
    ],
  },
],`}
      />

      <Callout
        variant="danger"
        title="The snapshot is worthless if the client fills it"
      >
        <p>
          The controller must read <code>price</code> and <code>name</code> from
          the FoodItem document and write them onto the order. Accepting them
          from the request body lets a client buy a 250-rupee bowl for one
          rupee. Pricing logic is covered in{" "}
          <a href="/docs/backend/cart-orders">Cart &amp; Order APIs</a>.
        </p>
      </Callout>

      <h3>The pricing breakdown</h3>

      <p>
        Five separate totals, all recomputed server-side. A single{" "}
        <code>total</code> field would be impossible to audit and trivial to
        dispute.
      </p>

      <PropertyTable
        headers={["Field", "Computed from", "Note"]}
        rows={[
          [
            "orderTotal",
            "Sum of item price × quantity, plus customisations",
            "Before discount and fees.",
          ],
          [
            "appliedOffer.discountAmount",
            "The matched Offer, capped by maxDiscount",
            "A reference, so the order explains itself later.",
          ],
          [
            "deliveryFee",
            "restaurant.deliverySettings.deliveryFee",
            "Zero when the subtotal crosses the free-delivery threshold.",
          ],
          [
            "tax",
            "A flat percentage applied to the discounted subtotal",
            "Percentage lives in platform Settings.",
          ],
          [
            "grandTotal",
            "orderTotal − discount + deliveryFee + tax",
            "The only figure the client is allowed to act on.",
          ],
        ]}
      />

      <h3>Status and history</h3>

      <CodeBlock
        language="js"
        title="models/Order.js — status enum and transitions"
        code={`status: {
  type: String,
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
  default: 'pending',
},
paymentStatus: {
  type: String,
  enum: ['pending', 'paid', 'failed', 'refunded'],
  default: 'pending',
},
paymentMethod: {
  type: String,
  enum: ['card', 'cash', 'digital_wallet'],
  required: true,
},

// Every transition is recorded with who made it and when. This is the audit
// trail that turns "my order vanished" into a five-second investigation.
statusHistory: [
  {
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
],`}
      />

      <p>
        The enum restricts the <em>set</em> of legal states. It does not
        restrict the <em>transitions</em>. A document method encodes the
        transition map so every controller asserts against the same rules.
      </p>

      <CodeBlock
        language="js"
        title="models/Order.js — the transition guard"
        code={`const validStatusTransitions = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['preparing', 'cancelled'],
  preparing:        ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['pickedup', 'cancelled'],
  pickedup:         ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered:        [],   // terminal
  cancelled:        [],   // terminal
};

orderSchema.methods.canTransitionTo = function (newStatus) {
  const allowed = validStatusTransitions[this.status] ?? [];
  return allowed.includes(newStatus);
};`}
      />

      <Callout
        variant="warning"
        title="Enum plus transition map, not one or the other"
      >
        <p>
          An enum alone permits <code>delivered → preparing</code>, which is
          physically impossible and which a well-meaning client will eventually
          send. The transition map alone permits a status string that was never
          in the domain. You need both: the enum for the vocabulary, the map for
          the grammar.
        </p>
      </Callout>

      <h3>Order identity and indexes</h3>

      <p>
        <code>orderId</code> is a human-readable reference (
        <code>ND-YYYYMMDD-NNN</code>) generated in a pre-save hook, separate
        from the MongoDB <code>_id</code>. Support asks for &ldquo;order
        231&rdquo;, not for an ObjectId.
      </p>

      <CodeBlock
        language="js"
        title="models/Order.js — index strategy"
        code={`orderSchema.index({ orderId: 1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ riderId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });`}
      />

      <h2>Cart, Category, Offer</h2>

      <p>
        Three supporting models. The Cart is worth reading closely, because its{" "}
        <code>userId</code> is unique — one active cart per customer, full stop.
      </p>

      <CodeBlock
        language="js"
        title="models/Cart.js"
        code={`const cartSchema = new mongoose.Schema(
  {
    // Unique, not merely indexed: the database itself enforces one cart per
    // user, so two concurrent "add to cart" requests cannot create two carts.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    items: [
      {
        foodItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FoodItem',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        price: { type: Number, required: true, min: 0 },
        specialInstructions: String,
      },
    ],
    totalAmount: { type: Number, default: 0, min: 0 },
    appliedOffer: {
      offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
      code: String,
      discountAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);`}
      />

      <Callout variant="note" title="A cart belongs to exactly one restaurant">
        <p>
          <code>restaurantId</code> sits on the cart rather than on each item
          because a cart may only ever hold items from a single kitchen. Adding
          an item from a different restaurant replaces the cart contents and
          tells the user why. Merging them produces an order no restaurant can
          prepare.
        </p>
      </Callout>

      <CodeBlock
        language="js"
        title="models/Category.js"
        code={`const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true },
    description: { type: String, required: [true, 'Category description is required'] },
    image: { type: String, required: [true, 'Category image is required'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);`}
      />

      <CodeBlock
        language="js"
        title="models/Offer.js"
        code={`const offerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    // Caps a percentage discount. Without it, "50% off" on a large order is a
    // loss-making order.
    maxDiscount: { type: Number, min: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    // Empty array means "applies everywhere" — see the offers chapter.
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  },
  { timestamps: true },
);`}
      />

      <h2>Notification, Settings, Earnings</h2>

      <CodeBlock
        language="js"
        title="models/notification.js"
        code={`const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['order', 'promotion', 'system', 'rider'],
      default: 'system',
    },
    // Payload for deep-linking: { orderId, route, screen }.
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });`}
      />

      <p>
        The compound <code>{"{ userId, isRead }"}</code> index exists for one
        query: &ldquo;my unread notifications, newest first.&rdquo; That is the
        only notification query a user ever makes directly, so it is the only
        one worth indexing beyond <code>createdAt</code>.
      </p>

      <CodeBlock
        language="js"
        title="models/Settings.js — a singleton with a unique key"
        code={`const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'system' },
    platform: {
      name: { type: String, trim: true, default: 'NutriDeliver' },
      description: { type: String, trim: true, default: 'Healthy Food Delivery Platform' },
      contactEmail: { type: String, trim: true, lowercase: true, default: 'admin@nutrideliver.com' },
      supportPhone: { type: String, trim: true, default: '+1-555-0123' },
    },
    delivery: {
      baseFee: { type: Number, min: 0, default: 2.99 },
      minOrderAmount: { type: Number, min: 0, default: 15 },
      maxDeliveryDistance: { type: Number, min: 0, default: 10 },
      estimatedDeliveryTime: { type: Number, min: 0, default: 30 },
    },
    payments: {
      currency: { type: String, uppercase: true, trim: true, default: 'USD' },
      stripeEnabled: { type: Boolean, default: true },
      cashOnDelivery: { type: Boolean, default: true },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);`}
      />

      <Callout variant="tip" title="The singleton pattern">
        <p>
          <code>
            {"key: { type: String, unique: true, default: 'system' }"}
          </code>
          makes the settings document a singleton without any application-level
          ceremony. A second insert collides on the unique index; an upsert on{" "}
          <code>{"{ key: 'system' }"}</code> finds the existing one. This is the
          cheapest way to have exactly one of something in MongoDB.
        </p>
      </Callout>

      <h2>How the models relate</h2>

      <Diagram caption="References, embeds, and the queries that justify them">
        {`
  User ──1:N──► Restaurant        ref      ownerId, indexed
    │                                        owner looks up "my restaurant"
    ├──1:1──► Cart               ref      userId UNIQUE — one active cart
    │             └──N:1──► FoodItem        ref, embedded in items[]
    │
    ├──1:N──► Order              ref      userId + status compound index
    │             ├──N:1──► Restaurant      ref
    │             ├──N:1──► User (rider)   ref, nullable until assigned
    │             ├──N:1──► FoodItem        ref + NAME/PRICE SNAPSHOT
    │             └──N:1──► Offer           ref + discountAmount snapshot
    │
    ├──embedded──► riderProfile            subdoc, always read together
    │                  ├──embedded earnings   summary, denormalised
    │                  └──2dsphere location   nearby-rider queries
    │
    └──1:N──► Notification      ref      userId + isRead compound index

  Restaurant ──1:N──► FoodItem    ref      restaurantId + isAvailable
             ──2dsphere── location          "open restaurants near me"

  FoodItem ──N:1──► Category      ref      categoryId + isAvailable

  Offer ──N:M──► Category / Restaurant      scoped applicability
`}
      </Diagram>

      <h2>Index strategy in one paragraph</h2>

      <p>
        An index is only used by MongoDB if it can serve the leading field of
        your <code>match</code> and then supply the <code>sort</code> from the
        same index. Single-field indexes serve one query well. Compound indexes
        serve the queries you actually wrote. Before adding an index, look at
        the query, and add the compound form of that query's filter plus sort.
      </p>

      <Steps>
        <Step title="Start with the reference fields">
          <p>
            Every <code>ref</code> path gets an index. The overwhelmingly most
            common query in the platform is &ldquo;documents belonging to this
            user, restaurant, or rider,&rdquo; and an unindexed ref is a
            collection scan.
          </p>
        </Step>

        <Step title="Add a compound index per real query">
          <p>
            <code>{"{ restaurantId, isAvailable }"}</code> and{" "}
            <code>{"{ categoryId, isAvailable }"}</code> exist because those are
            the exact shapes of the menu queries. They replace two single-field
            indexes each, which MongoDB would otherwise have to intersect.
          </p>
        </Step>

        <Step title="Add a geospatial index for distance">
          <p>
            <code>2dsphere</code> on restaurants and on rider locations. Without
            it, a 5 km search is a full scan with trigonometry per document.
          </p>
        </Step>

        <Step title="Let uniqueness do enforcement work">
          <p>
            A unique index is not just a lookup aid — it is a concurrency
            guarantee. Cart's <code>userId</code> and Offer's <code>code</code>{" "}
            both rely on the database to reject the duplicate.
          </p>
        </Step>

        <Step title="Verify with explain before shipping">
          <p>
            Run the query through the shell with{" "}
            <code>explain(&apos;executionStats&apos;)</code>:
          </p>
          <CodeBlock
            code={`db.fooditems.find({ restaurantId: ObjectId('…'), isAvailable: true })
  .explain('executionStats')`}
          />
          <p>
            A stage count above <code>EXPLAIN</code> — or a{" "}
            <code>COLLSCAN</code> in <code>queryPlanner.winningPlan</code> —
            means the index is not being used.
          </p>
        </Step>
      </Steps>

      <Callout variant="warning" title="Indexes are not free">
        <p>
          Every index is written on every insert and occupies memory. An
          over-indexed collection is slower on writes than an unindexed one. The
          default in production should be <code>autoIndex: false</code> with
          indexes created deliberately by a migration step, not at application
          start. Covered in{" "}
          <a href="/docs/production/scaling">Scaling &amp; Performance</a>.
        </p>
      </Callout>

      <h2>Before moving on</h2>

      <PropertyTable
        headers={["Check", "How"]}
        rows={[
          [
            "Every model has timestamps",
            "Inspect a created document for createdAt and updatedAt.",
          ],
          [
            "Password never serialises",
            "`User.findById(id).then(u => console.log(u))` shows no password field.",
          ],
          [
            "Geospatial index exists",
            "`db.restaurants.getIndexes()` lists a 2dsphere index.",
          ],
          [
            "Enums reject bad values",
            'Save a FoodItem with dietaryTags: ["carnivore"] and expect a ValidationError.',
          ],
          [
            "Order snapshots survive",
            "Change a FoodItem price, reload an old order, confirm the old price is intact.",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/validation">Validation Layer</a> — the Joi
        schemas that stop malformed input before it ever reaches a controller.
      </p>
    </>
  );
}

export function BackendValidation() {
  return (
    <>
      <p>
        Mongoose validates what arrives at the database. Joi validates what
        arrives at the HTTP boundary. They are not redundant: one stops a bad
        document, the other stops a bad <em>request</em> — and stops it with a
        400 that names the offending field, before any controller code runs.
      </p>

      <h2>Validation is the contract</h2>

      <p>
        A Joi schema is a single artefact that documents an endpoint, rejects
        malformed input, sanitises and coerces types, and asserts in tests. It
        is the closest thing this stack has to a type system, and it is worth
        treating as the source of truth rather than as a debug aid.
      </p>

      <CodeBlock
        language="js"
        title="The same schema in four places"
        code={`// 1. The request contract — rejects a bad body before the controller.
router.post('/food', authenticate, authorize('restaurant'), validate(validateFoodItem), createFoodItem);

// 2. The Swagger document, if you generate it from the schema.
// 3. The test fixture — assert the response body satisfies the same schema.
// 4. The admin panel form defaults, if you ever export the shape.

// Change the schema once; all four consumers change together.`}
      />

      <h2>The middleware factory</h2>

      <p>
        NutriDeliver's validators are functions returning{" "}
        <code>{"{ error, value }"}</code>, and a single <code>validate()</code>{" "}
        middleware adapts them to Express. This keeps the schemas free of any
        HTTP awareness, so they remain usable in tests and in background jobs.
      </p>

      <CodeBlock
        language="js"
        title="middleware/validation.js — the validate() factory"
        code={`// Validation middleware
export const validate = (validator) => {
  return (req, res, next) => {
    const { error } = validator(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
};`}
      />

      <p>
        Two details here are load-bearing. The validator returns{" "}
        <code>value</code> as well as <code>error</code>, and the middleware
        currently discards it — a gap we close below. And it returns{" "}
        <code>error.details[0].message</code> rather than a raw Joi object,
        because the raw thing is a 400-line dump that no mobile developer can
        act on.
      </p>

      <Callout variant="warning" title="Write the coerced value back">
        <p>
          Joi converts <code>"25"</code> to <code>25</code> and{" "}
          <code>"true"</code> to <code>true</code>. If you validate the body and
          then read the original <code>req.body</code>, you are reading the
          uncoerced values and the coercion was wasted. Assign the result:
        </p>
        <CodeBlock
          code={`export const validate = (validator) => (req, res, next) => {
  const { error, value } = validator(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  // Downstream controllers now see coerced, defaults-applied values.
  req.body = value;
  next();
};`}
        />
      </Callout>

      <h2>Body, query, and params</h2>

      <p>
        The factory above validates only the body. Query strings and route
        parameters need the same treatment, and they need different schemas
        because they arrive as strings and are usually used for filtering,
        pagination, and lookup.
      </p>

      <CodeBlock
        language="js"
        title="middleware/validation.js — validating every source"
        code={`// Validate req.body, req.query, or req.params by name.
export const validateSource = (source) => (validator) => (req, res, next) => {
  const { error, value } = validator(req[source]);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  req[source] = value;   // req.params and req.query are writable in Express 5
  next();
};

// Usage:
router.get(
  '/',
  validateSource('query')(validateListQuery),
  listRestaurants,
);

router.get(
  '/:id',
  validateSource('params')(validateIdParam),
  getRestaurant,
);`}
      />

      <Callout variant="note" title="Why query strings need coercion so badly">
        <p>
          Everything in <code>req.query</code> is a string. Without{" "}
          <code>Joi.number()</code>, <code>?page=2&amp;limit=20</code> arrives
          as <code>{"{ page: '2', limit: '20' }"}</code> and a naive{" "}
          <code>.skip(page * limit)</code> silently skips nothing. Coercion is
          not cosmetic — it is the difference between a working paginator and a
          confusing one.
        </p>
      </Callout>

      <h2>stripUnknown</h2>

      <p>
        By default Joi rejects unknown keys. That is correct but awkward for
        public write endpoints, where a client library may send extra fields.
        <code>stripUnknown</code> removes them instead of failing — while{" "}
        <code>{"{ abortEarly: false }"}</code> reports every problem at once
        rather than only the first.
      </p>

      <CodeBlock
        language="js"
        title="Common Joi preferences"
        code={`const base = {
  abortEarly: false,                        // report all errors, not just the first
  stripUnknown: true,                       // silently drop keys not in the schema
  convert: true,                            // "25" → 25, "true" → true
  errors: { wrap: { label: '"' } },         // readable messages
};`}
      />

      <p>
        Choose per endpoint. <code>stripUnknown: true</code> is right for public
        writes. For internal endpoints where a typo should fail loudly, set{" "}
        <code>stripUnknown: false</code> — the default — and let Joi complain
        about <code>restarantId</code>.
      </p>

      <h2>The register schema</h2>

      <CodeBlock
        language="js"
        title="middleware/validation.js — validateRegister"
        code={`export const validateRegister = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().optional(),
      dateOfBirth: Joi.date().optional(),
    }).required(),
    // 'admin' is deliberately absent. The public registration form can create
    // a customer, a restaurant, or a rider — never an administrator.
    role: Joi.string().valid('user', 'restaurant', 'rider').default('user'),
  });

  return schema.validate(data);
};`}
      />

      <Callout
        variant="danger"
        title="Validation and authorisation are different things"
      >
        <p>
          This schema constrains <code>role</code> to a safe set, which prevents
          a typo from creating an admin. It does <strong>not</strong> stop a
          client from posting <code>role: 'restaurant'</code> when it was
          registered as a customer — the schema would accept it. Role
          transitions are business rules and belong in the controller, backed by
          the role guards in{" "}
          <a href="/docs/backend/auth">Authentication &amp; RBAC</a>.
        </p>
      </Callout>

      <h2>The restaurant schema</h2>

      <p>
        Nesting is where Joi earns its keep. A plain per-field check cannot
        express &ldquo;coordinates are required <em>if and only if</em> an
        address is present.&rdquo;
      </p>

      <CodeBlock
        language="js"
        title="middleware/validation.js — validateRestaurant"
        code={`export const validateRestaurant = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    cuisineType: Joi.string()
      .valid(
        'healthy', 'salads', 'protein', 'vegan', 'vegetarian',
        'gluten-free', 'keto', 'mediterranean', 'smoothies',
      )
      .required(),
    contact: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        coordinates: Joi.object({
          lat: Joi.number().min(-90).max(90).required(),
          lng: Joi.number().min(-180).max(180).required(),
        }).required(),
      }).required(),
    }).required(),
    operatingHours: Joi.object({
      opening: Joi.string().required(),
      closing: Joi.string().required(),
      days: Joi.array()
        .items(
          Joi.string().valid(
            'monday', 'tuesday', 'wednesday', 'thursday',
            'friday', 'saturday', 'sunday',
          ),
        )
        .required(),
    }).required(),
  });

  return schema.validate(data);
};`}
      />

      <Callout variant="tip" title="Keep the enum in one place">
        <p>
          The cuisine list appears in <code>models/Restaurant.js</code>, here,
          and in the mobile filter UI. Three copies drift. Export it once from a
          constants module and import it in all three:
        </p>
        <CodeBlock
          code={`// utils/constants.js
export const CUISINE_TYPES = [
  'healthy', 'salads', 'protein', 'vegan', 'vegetarian',
  'gluten-free', 'keto', 'mediterranean', 'smoothies',
];

// models/Restaurant.js
cuisineType: { type: String, enum: CUISINE_TYPES, required: true },

// validations/restaurant.js
cuisineType: Joi.string().valid(...CUISINE_TYPES).required(),`}
        />
      </Callout>

      <h2>The food item schema</h2>

      <CodeBlock
        language="js"
        title="middleware/validation.js — validateFoodItem"
        code={`export const validateFoodItem = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    categoryId: Joi.string().required(),
    price: Joi.number().min(0).required(),
    calories: Joi.number().required(),
    protein: Joi.number().required(),
    carbs: Joi.number().required(),
    fat: Joi.number().required(),
    ingredients: Joi.array().items(Joi.string()).required(),
    dietaryTags: Joi.array()
      .items(
        Joi.string().valid(
          'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'nut-free',
          'low-carb', 'high-protein', 'keto', 'paleo', 'sugar-free',
          'organic', 'non-gmo',
        ),
      )
      .optional(),
    preparationTime: Joi.number().min(1).required(),
    isAvailable: Joi.boolean().optional(),
  });

  return schema.validate(data);
};`}
      />

      <p>
        Note what is absent: <code>restaurantId</code>. The restaurant is taken
        from the authenticated owner, never from the body. Letting a client
        choose which restaurant to write into is a privilege escalation, and it
        is the kind of omission that should be deliberate.
      </p>

      <h2>The order schema</h2>

      <CodeBlock
        language="js"
        title="middleware/validation.js — validateOrder"
        code={`export const validateOrder = (data) => {
  const schema = Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          foodItemId: Joi.string().required(),
          quantity: Joi.number().min(1).required(),
          specialInstructions: Joi.string().optional(),
          customization: Joi.array()
            .items(
              Joi.object({
                option: Joi.string().required(),
                choice: Joi.string().required(),
                price: Joi.number().min(0).optional(),
              }),
            )
            .optional(),
        }),
      )
      .min(1)
      .required(),
    deliveryAddress: Joi.object({
      type: Joi.string().valid('home', 'work', 'other').default('home'),
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().required(),
        lng: Joi.number().required(),
      }).optional(),
    }).required(),
    paymentMethod: Joi.string()
      .valid('card', 'cash', 'digital_wallet')
      .required(),
    specialInstructions: Joi.string().optional(),
  });

  return schema.validate(data);
};`}
      />

      <Callout variant="danger" title="No totals in the schema, on purpose">
        <p>
          There is no <code>orderTotal</code>, no <code>deliveryFee</code>, no{" "}
          <code>grandTotal</code>. They are absent because they must never come
          from the client. <code>customization[].price</code> is the one price a
          client may send, and the controller still resolves it against the
          FoodItem before writing it to the order.
        </p>
      </Callout>

      <h2>Custom validators</h2>

      <p>
        Built-in rules cover types and structure. Domain rules need{" "}
        <code>custom()</code>, and the discipline is to keep each one a pure
        predicate with a message.
      </p>

      <CodeBlock
        language="js"
        title="Custom Joi validators"
        code={`import mongoose from 'mongoose';

// A syntactically valid ObjectId. Catching this here turns a CastError 500
// deep in the controller into a 400 at the edge.
const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId')
  .messages({ 'any.invalid': '{{#label}} must be a valid ObjectId' });

// An operating-hours window where closing is genuinely after opening.
const openingBeforeClosing = Joi.object({
  opening: Joi.string().required(),
  closing: Joi.string().required(),
}).custom((value, helpers) => {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  if (toMinutes(value.closing) <= toMinutes(value.opening)) {
    return helpers.message({ custom: 'Closing time must be after opening time' });
  }
  return value;
});

const latitude  = Joi.number().min(-90).max(90).required();
const longitude = Joi.number().min(-180).max(180).required();

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  cuisine: Joi.string().valid(...CUISINE_TYPES),
  lat: latitude,
  lng: longitude,
  radius: Joi.number().min(0.5).max(50).default(10),
  sort: Joi.string().valid('rating', 'distance', 'deliveryTime', 'price')
          .default('rating'),
});`}
      />

      <h2>Formatting the error response</h2>

      <p>
        One consistent shape for every validation failure, everywhere. Clients
        should never have to parse a message string to know which field is at
        fault.
      </p>

      <CodeBlock
        language="js"
        title="A field-addressable error response"
        code={`// Request
{
  "name": "",
  "price": -4
}

// Response
{
  "success": false,
  "message": "name is not allowed to be empty; price must be greater than or equal to 0",
  "errors": [
    { "field": "name",  "message": "is not allowed to be empty" },
    { "field": "price", "message": "must be greater than or equal to 0" }
  ]
}`}
      />

      <CodeBlock
        language="js"
        title="middleware/validation.js — extracting Joi paths"
        code={`import { ApiError } from './errorHandler.js';

export const validateSource = (source) => (validator) => (req, res, next) => {
  const { error, value } = validator(req[source], {
    abortEarly: false,
    stripUnknown: source === 'body',
  });

  if (error) {
    // Joi paths look like "contact.address.coordinates.lat". That string is
    // exactly what the form needs to highlight, so pass it through verbatim.
    const errors = error.details.map((d) => ({
      field: d.path.join('.') || source,
      message: d.message,
    }));

    return next(
      new ApiError(400, error.details[0].message, { errors }),
    );
  }

  req[source] = value;
  next();
};`}
      />

      <p>
        Throwing an <code>ApiError</code> rather than calling{" "}
        <code>res.status().json()</code> directly means validation failures flow
        through the same central handler as everything else — same logging, same
        envelope, one place to change the shape. That is the subject of{" "}
        <a href="/docs/backend/errors">Error Handling</a>.
      </p>

      <h2>Validating everything else</h2>

      <p>
        Listing, filtering, and pagination go through the same machinery. This
        schema is the reason the public restaurant endpoint works at all.
      </p>

      <CodeBlock
        language="js"
        title="validateRiderLocation — the schema that protects the database"
        code={`export const validateRiderLocation = (data) => {
  const schema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  });

  return schema.validate(data);
};`}
      />

      <Callout
        variant="tip"
        title="Location pings are the highest-volume write in the platform"
      >
        <p>
          A rider broadcasting every few seconds is thousands of writes per
          minute across the fleet. Validating the payload is not optional here:
          one malformed coordinate with the wrong shape would fail the{" "}
          <code>2dsphere</code> index lookup and silently remove that rider from
          every nearby search.
        </p>
      </Callout>

      <h2>Reusing schemas in tests</h2>

      <p>
        Because validators are plain functions over plain data, a test can
        assert on the response without importing the controller, the route, or
        the database.
      </p>

      <CodeBlock
        language="js"
        title="tests/unit/foodItem.validation.test.js"
        code={`import { describe, it, expect } from 'vitest';
import { validateFoodItem } from '../../middleware/validation.js';

const valid = {
  name: 'Quinoa Protein Bowl',
  description: 'Grilled chicken, quinoa, roasted vegetables.',
  categoryId: '652f0000000000000000abcd',
  price: 12.5,
  calories: 480,
  protein: 38,
  carbs: 42,
  fat: 14,
  ingredients: ['quinoa', 'chicken breast', 'kale'],
  preparationTime: 15,
};

describe('validateFoodItem', () => {
  it('accepts a well-formed item', () => {
    const { error } = validateFoodItem(valid);
    expect(error).toBeUndefined();
  });

  it('rejects a negative price', () => {
    const { error } = validateFoodItem({ ...valid, price: -1 });
    expect(error.details[0].message).toMatch(/greater than or equal to 0/);
  });

  it('rejects an unknown dietary tag', () => {
    const { error } = validateFoodItem({
      ...valid,
      dietaryTags: ['carnivore'],
    });
    expect(error).toBeDefined();
  });

  it('coerces a numeric string price', () => {
    const { value } = validateFoodItem({ ...valid, price: '12.5' });
    expect(value.price).toBe(12.5);
  });
});`}
      />

      <p>
        The same schemas run as assertions inside Supertest integration tests,
        so a response that drifts from the contract fails the build instead of a
        client. That loop — schema, endpoint, test — is the whole point.
      </p>

      <Callout variant="note" title="Do not validate only on the client">
        <p>
          Client validation exists for fast feedback. It is advisory and
          trivially bypassed with curl. Every rule you enforce there must also
          exist here. The order is always: client for speed, Joi for truth,
          Mongoose for integrity.
        </p>
      </Callout>

      <h2>Common mistakes</h2>

      <PropertyTable
        headers={["Mistake", "Symptom", "Fix"]}
        rows={[
          [
            "Validating but not writing back `value`",
            "Numbers arrive as strings and arithmetic silently misbehaves",
            "Assign `req[source] = value` before `next()`.",
          ],
          [
            "`abortEarly: true`",
            "Client fixes one field, resubmits, finds the next",
            "Set `abortEarly: false` and return every field.",
          ],
          [
            "Validating only `req.body`",
            "A bad `:id` still becomes a CastError 500",
            'Add `validateSource("params")` and `validateSource("query")`.',
          ],
          [
            "Duplicating enum lists",
            "Schema accepts a value the model rejects",
            "Export enums from one constants module.",
          ],
          [
            "Trusting the schema for authorisation",
            'A customer posts `role: "admin"`',
            "Schemas constrain shape; role guards constrain permission.",
          ],
          [
            "Skipping schema on internal scripts",
            "Background jobs write malformed data straight to Mongo",
            "Validators are plain functions — call them from jobs too.",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/errors">Error Handling</a> — turning
        everything that can go wrong, including the failures validation cannot
        prevent, into one consistent response shape.
      </p>
    </>
  );
}

export function BackendErrors() {
  return (
    <>
      <p>
        Every Express application has two response paths: the one you designed,
        and the one that happens when something you did not anticipate goes
        wrong. The second path is where trust is won or lost — and it is the one
        people rush.
      </p>

      <h2>Why a typed error class</h2>

      <p>
        Without a typed error, a controller ends up doing its own status-code
        bookkeeping. Three handlers written at three different times drift, and
        the client gets three different error shapes from one API. A typed error
        makes the contract explicit at the throw site and uniform at the
        response.
      </p>

      <CodeBlock
        language="js"
        title="middleware/errorHandler.js — the ApiError class"
        code={`export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;

    // Without this, \`instanceof ApiError\` is false after a transpile or a
    // worker-thread boundary — a genuinely confusing bug to chase.
    Object.setPrototypeOf(this, ApiError.prototype);

    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }

  static unauthorized(msg = 'Not authorised') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Access denied') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Resource already exists') {
    return new ApiError(409, msg);
  }

  static tooMany(msg = 'Too many requests') {
    return new ApiError(429, msg);
  }
}`}
      />

      <p>
        The static constructors are not sugar.{" "}
        <code>throw ApiError.notFound('Restaurant not found')</code> reads as a
        single thought, and it is impossible to send a 402 by accident because
        there is no 402 constructor.
      </p>

      <h2>Async errors and the wrapper</h2>

      <p>
        Express 5 propagates a rejected promise from an async handler to your
        error middleware automatically. The wrapper below is what the codebase
        uses anyway, and it is worth understanding exactly why — because the
        <em>reason</em> is instructive, and because Express 4 is still what most
        tutorials show.
      </p>

      <CodeBlock
        language="js"
        title="middleware/errorHandler.js — asyncHandler"
        code={`// Wrapper to avoid try-catch blocks in async functions
export const asyncHandler = (fn) => (req, res, next) => {
  // Promise.resolve(...) normalises a sync throw into the same rejection path,
  // so one wrapper covers both an async function that rejects and a plain
  // function that throws.
  Promise.resolve(fn(req, res, next)).catch(next);
};`}
      />

      <CodeBlock
        language="js"
        title="Using it in a controller"
        code={`import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id)
    .populate('ownerId', 'profile firstName profile.lastName');

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }

  res.json({
    success: true,
    data: { restaurant },
  });
});`}
      />

      <Callout variant="note" title="Which one should you use?">
        <p>
          On Express 5, <code>asyncHandler</code> is belt-and-braces — a bare{" "}
          <code>async (req, res)</code> handler that throws reaches the error
          middleware on its own. Keep the wrapper anyway: it is explicit, it
          survives an upgrade to a framework that does not, and it documents at
          the call site that errors are handled centrally. Consistency across
          two hundred handlers is worth more than the twelve characters it
          saves.
        </p>
      </Callout>

      <h2>The central handler</h2>

      <p>
        One function, mounted last, that converts any thrown value into the
        standard response envelope. Its first job is translation: library errors
        become HTTP errors with messages a client can act on.
      </p>

      <CodeBlock
        language="js"
        title="middleware/errorHandler.js — errorHandler"
        code={`export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error Stack:', err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = { message: 'Resource not found', statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = { message: 'Duplicate field value entered', statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = { message, statusCode: 400 };
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = { message: 'Malformed JSON in request body', statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 };
  }

  const statusCode = error.statusCode || err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    // The stack is a development affordance, never a production response.
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};`}
      />

      <p>
        Four arguments. That arity is the entire signal Express uses to
        distinguish error middleware from normal middleware — dropping{" "}
        <code>next</code> makes the function silently invisible, and your errors
        will hang the request until it times out.
      </p>

      <h3>Mongoose error translation</h3>

      <PropertyTable
        headers={[
          "Mongoose error",
          "Detected by",
          "Maps to",
          "Why that status",
        ]}
        rows={[
          [
            "CastError",
            'err.name === "CastError"',
            "404 Resource not found",
            "A malformed ObjectId means no such resource.",
          ],
          [
            "ValidationError",
            'err.name === "ValidationError"',
            "400 with joined messages",
            "The request did not satisfy the schema.",
          ],
          [
            "Duplicate key",
            "err.code === 11000",
            "400 / 409",
            "The unique index rejected a duplicate.",
          ],
          [
            "JsonWebTokenError",
            "err.name",
            "401 Invalid token",
            "Authentication failed.",
          ],
          [
            "TokenExpiredError",
            "err.name",
            "401 Token expired",
            "Client should call refresh-token.",
          ],
          [
            "SyntaxError + body",
            'err.status === 400 && "body" in err',
            "400 Malformed JSON",
            "The body parser could not read it.",
          ],
        ]}
      />

      <Callout variant="tip" title="Name the duplicate key, do not guess">
        <p>
          <code>err.keyValue</code> tells you which field collided. A generic
          &ldquo;duplicate field value entered&rdquo; forces the client to
          guess; &ldquo;An account with this email already exists&rdquo; does
          not. Derive the message from{" "}
          <code>Object.keys(err.keyValue ?? {})</code>.
        </p>
      </Callout>

      <h2>The 404 fallback</h2>

      <p>
        Express does not stop when no route matches — it falls through to the
        end of the stack, and Express's built-in handler responds with HTML. On
        a JSON API that is a genuinely bad failure: a mobile client tries to
        <code>JSON.parse()</code> an HTML 404 page and throws a confusing parse
        error instead of reporting a 404.
      </p>

      <CodeBlock
        language="js"
        title="middleware/errorHandler.js — notFound"
        code={`// Handle 404 for undefined routes
export const notFound = (req, res, next) => {
  const error = new Error(\`Not found - \${req.originalUrl}\`);
  error.statusCode = 404;
  next(error);
};`}
      />

      <p>
        It throws a normal <code>Error</code> with <code>statusCode</code>{" "}
        bolted on, and passes it down to <code>errorHandler</code>, which reads{" "}
        <code>err.statusCode</code> and responds with JSON. One response path
        for everything.
      </p>

      <CodeBlock
        language="js"
        title="server.js — mounting order at the tail"
        code={`// ...all routes above...

// 1. Anything that matched no route becomes a 404 error…
app.use(notFound);

// 2. …gets logged with its request id…
app.use(errorLogger);

// 3. …and rendered as JSON by the single central handler.
app.use(errorHandler);`}
      />

      <Callout
        variant="warning"
        title="These three must come last, in this order"
      >
        <p>
          <code>notFound</code> only runs if no route responded. The logger must
          sit between it and the handler so that 404s are captured with the same
          context as crashes. Putting <code>errorHandler</code> anywhere above
          the routes swallows every error before it reaches the controller.
        </p>
      </Callout>

      <h2>Operational errors versus programmer errors</h2>

      <p>Two categories, and they deserve opposite treatment.</p>

      <Split
        left={{
          title: "Operational — expected, handle it",
          children: (
            <>
              <p>
                Something about the world went wrong: the database was briefly
                unreachable, a document did not exist, a duplicate key collided.
                The user did something reasonable and the system should explain
                it clearly.
              </p>
              <ul>
                <li>4xx status.</li>
                <li>A specific, human-readable message.</li>
                <li>Logged at warn, not error.</li>
                <li>
                  Thrown as an <code>ApiError</code>.
                </li>
              </ul>
            </>
          ),
        }}
        right={{
          title: "Programmer — a bug, hide it",
          children: (
            <>
              <p>
                The code is wrong. A null dereference, a typo, a missing await.
                Nobody can act on the raw details, and leaking them hands an
                attacker your file structure and dependency versions.
              </p>
              <ul>
                <li>500 status, generic message.</li>
                <li>Full detail to the log only.</li>
                <li>Alert someone to look.</li>
                <li>Unhandled — fix it, do not catch it.</li>
              </ul>
            </>
          ),
        }}
      />

      <CodeBlock
        language="js"
        title="Separating the two in the handler"
        code={`import { ApiError } from './errorHandler.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode ?? err.status ?? 500;
  let message = err.message ?? 'Server Error';
  let details;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value';
    statusCode = 409;
    message = \`An account with this \${field} already exists\`;
  } else if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Our own typed errors are safe to show. Anything else is a bug, and bugs
  // get a generic message plus a stack trace in the log.
  const isOperational = err instanceof ApiError || statusCode < 500;
  if (!isOperational) {
    message = 'Something went wrong on our end.';
    logger.error('Unhandled error', {
      requestId: req.id,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
    });
  } else {
    logger.warn(err.message, { requestId: req.id, statusCode });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    // Development only. In production this key is absent entirely.
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};`}
      />

      <Callout variant="danger" title="Never leak a stack trace in production">
        <p>
          <code>err.stack</code> contains absolute file paths, line numbers, and
          often a dependency version. That is a free reconnaissance pass. The
          gate above is the only thing standing between a bug and that leak —
          guard it with a test, and never gate it on a header the client
          controls.
        </p>
      </Callout>

      <h3>Other things that must not reach a client</h3>

      <PropertyTable
        headers={["Never leak", "Why", "Instead"]}
        rows={[
          [
            "Stack traces",
            "Reveals file layout and dependency versions",
            "Full trace in the log, keyed by request id",
          ],
          [
            "SQL / Mongo query text",
            "Discloses schema and data shape",
            'A short "could not process request"',
          ],
          [
            "Raw driver errors",
            "Connection strings may be embedded",
            "A generic 500",
          ],
          [
            "Whether an email exists",
            "User enumeration on /forgot-password",
            "The same 200 response either way",
          ],
          [
            "Field-level internals",
            "Leaks business logic and thresholds",
            "The specific field a client sent",
          ],
        ]}
      />

      <h2>Logging with a correlation id</h2>

      <p>
        The error handler is only useful if you can find the log line. Every
        error response should carry an id that also appears in the log — which
        means the id has to be set before anything can fail.
      </p>

      <CodeBlock
        language="js"
        title="middleware/logger.js"
        code={`export const errorLogger = (err, req, res, next) => {
  logger.error(err.message, {
    requestId: req.id,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
  });
  next(err);
};`}
      />

      <CodeBlock
        language="js"
        title="Echoing the id to the client"
        code={`res.status(statusCode).json({
  success: false,
  message,
  // Non-secret, and the single most useful thing in a support conversation.
  requestId: req.id,
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
});`}
      />

      <h2>The response envelope</h2>

      <p>
        One shape for success, one for failure, forever. Clients branch on{" "}
        <code>success</code> and never on the HTTP status alone, because proxied
        and cached responses do not always preserve it.
      </p>

      <CodeBlock
        language="json"
        title="The two shapes"
        code={`// Success
{
  "success": true,
  "message": "Restaurant fetched successfully",
  "data": { "restaurant": { "...": "..." } },
  "requestId": "k3f9qz1x"
}

// Failure
{
  "success": false,
  "message": "Restaurant not found",
  "errors": [
    { "field": "id", "message": "must be a valid ObjectId" }
  ],
  "requestId": "k3f9qz1x"
}`}
      />

      <h2>Common mistakes</h2>

      <PropertyTable
        headers={["Mistake", "Why it hurts", "Fix"]}
        rows={[
          [
            "Calling res.status() inside a catch",
            "The central handler never runs, so no logging",
            "Throw an ApiError and let the handler respond",
          ],
          [
            "`err.status` is sometimes undefined",
            "Falls through to 500 for a 404",
            "Resolve the status with the full fallback chain",
          ],
          [
            "Four-argument handler written as three",
            "Express ignores it; requests hang",
            "Always keep (err, req, res, next)",
          ],
          [
            "Sending the error object directly",
            "Leaks every enumerable internal field",
            "Build the response explicitly",
          ],
          [
            "Forgetting the 404 fallback",
            "Unmatched routes return HTML, clients crash",
            "Mount notFound after all routes",
          ],
          [
            "Duplicating try/catch per controller",
            "Response shapes drift over time",
            "One handler, one shape",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/middleware">Middleware &amp; Security</a> —
        the layer that runs before any of this, in an order that is not
        interchangeable.
      </p>
    </>
  );
}

export function BackendMiddleware() {
  return (
    <>
      <p>
        Express middleware is a queue. Each function runs in the order it was
        registered, may modify the request, and may end the response. That makes
        order the single most consequential decision in <code>server.js</code> —
        a stack that is safe on Tuesday can be exploitable on Wednesday purely
        because two lines moved.
      </p>

      <h2>The order, and why it is that order</h2>

      <Diagram caption="server.js middleware stack — annotated">
        {`
  Request
     │
     ▼
  1. helmet()            Security headers on the way out.
     │                   First, so every response has them.
     ▼
  2. cors()              Origin allow-list. Must run before anything
     │                   responds, or errors bypass it.
     ▼
  3. generalLimiter      Reject cheap. Parsing a body we will then
     │                   discard is wasted work under attack.
     ▼
  4. authLimiter         Tighter limit on /api/auth only.
     │
     ▼
  5. requestLogger       Assign X-Request-Id so step 9 can log it.
     │
     ▼
  6. express.json()      Body parser. Everything below needs req.body.
     │
     ▼
  7. sanitizeBody        XSS scrub. Needs a parsed body to inspect.
     │   sanitizeQuery
     ▼
  8. Routes              Per-route: authenticate → authorize → validate
     │                              → controller
     ▼
  9. notFound            No route matched.
     ▼
 10. errorLogger         Logs with the request id.
     ▼
 11. errorHandler        The only thing that writes an error response.
`}
      </Diagram>

      <CodeBlock
        language="js"
        title="server.js — the real ordering"
        code={`// Disable ETag generation on API responses.
// Express hashes every JSON body into an ETag; when a client replays
// If-None-Match, the server replies 304 with an EMPTY body, which breaks
// clients that always parse a JSON payload.
app.set('etag', false);

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Rate Limiting
app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// Request logging
app.use(requestLogger);

// Body Parsing & Sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);
app.use(sanitizeQuery);`}
      />

      <Callout variant="warning" title="The two orderings people get wrong">
        <p>
          Rate limiting <strong>before</strong> the body parser, because
          rejecting a request should cost as close to nothing as possible — you
          do not want an attacker making you allocate a 10 MB buffer per
          request. Sanitization <strong>after</strong> the body parser, because
          it has nothing to inspect until the body exists. Swap either pair and
          you get both wasted work and a hole.
        </p>
      </Callout>

      <h2>Helmet</h2>

      <p>
        One line, a substantial number of headers. Every one of them closes a
        specific browser attack, and the defaults are correct for a JSON API.
      </p>

      <CodeBlock
        language="js"
        title="Helmet with the one adjustment that matters"
        code={`import helmet from 'helmet';

app.use(
  helmet({
    // A pure JSON API serves no HTML, so it needs no script sources. Locking
    // the policy down to 'none' is stronger than Helmet's default and costs
    // nothing, because we have no docs page served from this origin.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // The Swagger UI at /api-docs loads inline styles and scripts.
    // Only relax this if you serve docs from the same origin.
    crossOriginEmbedderPolicy: false,
  }),
);`}
      />

      <PropertyTable
        headers={["Header", "Stops", "Applied by Helmet"]}
        rows={[
          [
            "X-Content-Type-Options",
            "MIME sniffing turning a text file into script",
            "Yes",
          ],
          [
            "Strict-Transport-Security",
            "Downgrade attacks on the first request",
            "Yes",
          ],
          ["X-Frame-Options", "Clickjacking via an iframe", "Yes"],
          [
            "Content-Security-Policy",
            "Injected script and data exfiltration",
            "Yes, relaxed above",
          ],
          ["Referrer-Policy", "Full URL leaking to third parties", "Yes"],
          [
            "Cross-Origin-Opener-Policy",
            "Cross-origin window reference attacks",
            "Yes",
          ],
        ]}
      />

      <h2>CORS with multiple origins</h2>

      <p>
        Four clients — three Expo apps on arbitrary ports and an admin panel on
        another — means a list, not a string. This is the single most common
        misconfiguration in a multi-client API, because <code>origin: '*'</code>{" "}
        works in development and is a data leak in production.
      </p>

      <CodeBlock
        language="js"
        title="config/env.js and server.js — a real origin allow-list"
        code={`// config/env.js
clientUrls: (process.env.CLIENT_URL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean),

// server.js
import { config } from './config/env.js';

app.use(
  cors({
    // An array, or a function that decides per request. Both work; the
    // function form lets you log rejections, which is how you discover the
    // client you forgot to add.
    origin(origin, callback) {
      // Same-origin and server-to-server calls have no Origin header.
      if (!origin) return callback(null, true);

      if (config.clientUrls.includes(origin)) {
        return callback(null, true);
      }

      logger.warn('CORS rejection', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);`}
      />

      <Callout variant="danger" title="credentials: true forbids the wildcard">
        <p>
          If you send credentials, the response header must name an exact
          origin. <code>origin: '*'</code> together with{" "}
          <code>credentials: true</code> is rejected by browsers, and if you get
          it working you have disabled CORS protection for authenticated
          endpoints. Pick the allow-list.
        </p>
      </Callout>

      <h2>Rate limiting</h2>

      <p>
        Three limiters with different budgets, because endpoints have different
        costs and different abuse profiles.
      </p>

      <CodeBlock
        language="js"
        title="middleware/rateLimit.js"
        code={`import rateLimit from 'express-rate-limit';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,                // 1000 requests per window, per IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,    // RateLimit-Limit / -Remaining / -Reset (RFC draft)
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment endpoint rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many payment attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});`}
      />

      <PropertyTable
        headers={["Limiter", "Window", "Max", "Mounted on", "Reasoning"]}
        rows={[
          [
            "generalLimiter",
            "15 min",
            "1000",
            "Every route",
            "Backstop against scraping and runaway clients.",
          ],
          [
            "authLimiter",
            "1 min",
            "50",
            "/api/auth",
            "Credential stuffing and OTP brute force.",
          ],
          [
            "paymentLimiter",
            "15 min",
            "10",
            "/api/payments",
            "Card testing and PaymentIntent spam.",
          ],
          [
            "createUserSpecificLimiter",
            "15 min",
            "configurable",
            "Per-route, per user",
            "Fair use per account rather than per NAT.",
          ],
        ]}
      />

      <Callout variant="note" title="Rate limit by account, not only by IP">
        <p>
          Behind carrier NAT, a whole apartment block shares one IP — and behind
          a corporate proxy, an entire office does. The general limiter should
          be the backstop, while authenticated routes use a key generator based
          on <code>req.user.id</code>:
        </p>
        <CodeBlock
          code={`export const createUserSpecificLimiter = (maxRequests = 100) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    keyGenerator: (req) => req.user?.id ?? req.ip,
    standardHeaders: true,
    legacyHeaders: false,
  });`}
        />
      </Callout>

      <h2>Sanitization</h2>

      <p>
        <code>sanitize-html</code> strips markup rather than encoding it. With
        an empty tag allow-list, a field that should contain text becomes text,
        and a field containing <code>&lt;script&gt;</code> becomes the literal
        string.
      </p>

      <CodeBlock
        language="js"
        title="middleware/sanitize.js"
        code={`import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
  allowedTags: [],       // No HTML tags allowed
  allowedAttributes: {}, // No attributes allowed
};

export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions).trim();
      }
    });
  }
  next();
};

export const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeHtml(req.query[key], sanitizeOptions).trim();
      }
    });
  }
  next();
};

// Sanitize specific fields
export const sanitizeFields = (fields) => (req, res, next) => {
  if (req.body) {
    fields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = sanitizeHtml(req.body[field], sanitizeOptions).trim();
      }
    });
  }
  next();
};`}
      />

      <Callout variant="warning" title="This walks the top level only">
        <p>
          <code>sanitizeBody</code> iterates <code>Object.keys(req.body)</code>{" "}
          one level deep. A nested string — <code>profile.address.street</code>,
          or <code>items[0].specialInstructions</code> — is untouched. For the
          order endpoints, use <code>sanitizeFields(['items'])</code> or a deep
          walk, and remember that Joi's <code>.pattern()</code> rules can
          constrain nested fields more precisely than stripping ever will.
        </p>
      </Callout>

      <h2>Uploads</h2>

      <p>
        Multer handles multipart bodies for avatars, menu imagery, and rider
        documents. Three things matter: where files land, what they are called,
        and what is allowed through.
      </p>

      <CodeBlock
        language="js"
        title="middleware/upload.js"
        code={`import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Never trust the client filename — it can contain traversal sequences
    // and it can collide. Generate the name and keep only the extension.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
});

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);`}
      />

      <Callout
        variant="danger"
        title="Multer errors must be handled before the central handler"
      >
        <p>
          A <code>MulterError</code> for an oversized file is not an{" "}
          <code>ApiError</code>, and its message is written for humans, not
          clients. Mount <code>handleUploadError</code> after the upload
          middleware and before the route handler, or every oversized upload
          becomes an opaque 500 instead of a clean 400.
        </p>
        <CodeBlock
          code={`router.post(
  '/avatar',
  authenticate,
  uploadSingle('avatar'),
  handleUploadError,
  updateAvatar,
);`}
        />
      </Callout>

      <h2>Request logging</h2>

      <p>
        Logging runs before the body parser, which is deliberate — it means a
        request that fails to parse still produces a log line with an id.
      </p>

      <CodeBlock
        language="js"
        title="middleware/logger.js"
        code={`export const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  req.id = Math.random().toString(36).slice(2, 11);
  res.setHeader('X-Request-Id', req.id);

  // 'finish' fires after the response has been fully written, so the status
  // code is final by then. Logging on 'close' gives you aborted requests too.
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;

    logger.info(\`\${req.method} \${req.originalUrl}\`, {
      requestId: req.id,
      status: res.statusCode,
      durationMs: Math.round(ms * 100) / 100,
      userId: req.user?.id,
    });
  });

  next();
};`}
      />

      <Callout variant="tip" title="Never log credentials">
        <p>
          Never log <code>req.body</code> wholesale. It contains{" "}
          <code>password</code>, OTP codes, and card references. Log the route,
          the status, the duration, and the user id — that is enough to debug
          anything, and none of it is sensitive.
        </p>
      </Callout>

      <h2>Per-route middleware</h2>

      <p>
        Global middleware handles what applies everywhere. Per-route middleware
        handles the rest, and the order inside a route definition is the same
        principle at a smaller scale.
      </p>

      <CodeBlock
        language="js"
        title="routes/orders.js — the canonical route"
        code={`router.post(
  '/',
  authenticate,             // 1. Who is this? Bearer token → req.user
  paymentLimiter,           // 2. Reject expensive abuse early
  validate(validateOrder),  // 3. Is the body well-formed?
  createOrder,              // 4. Do the work
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('restaurant', 'rider', 'admin'),  // must come AFTER authenticate
  validate(validateStatusUpdate),
  updateOrderStatus,
);`}
      />

      <Callout
        variant="danger"
        title="authorise() before authenticate() is a crash"
      >
        <p>
          <code>authorize</code> reads <code>req.user.role</code>. If no
          authentication has run, <code>req.user</code> is undefined and the
          guard throws a TypeError — which means a 500 on a public route that
          should have returned 401. Authentication always comes first.
        </p>
      </Callout>

      <h2>Verifying the stack</h2>

      <Steps>
        <Step title="Headers are present">
          <CodeBlock code={`curl -I http://localhost:5000/api/health`} />
        </Step>

        <Step title="A disallowed origin gets no CORS header">
          <CodeBlock
            code={`curl -i -H "Origin: https://evil.example" \\
  http://localhost:5000/api/health | grep -i "access-control"`}
          />
          <p>No output means the allow-list is working.</p>
        </Step>

        <Step title="The rate limiter actually fires">
          <CodeBlock
            code={`for i in $(seq 1 60); do
  curl -s -o /dev/null -w "%{http_code}\\n" \\
    -X POST http://localhost:5000/api/auth/login \\
    -H "Content-Type: application/json" \\
    -d '{"email":"a@b.com","password":"wrong"}'
done | sort | uniq -c`}
          />
        </Step>

        <Step title="XSS payloads are stripped">
          <CodeBlock
            code={`curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"x@y.com","password":"secret123",
       "profile":{"firstName":"<script>alert(1)</script>",
                  "lastName":"Test"}}'`}
          />
          <p>The stored name should be plain text, not a tag.</p>
        </Step>

        <Step title="The 404 fallback returns JSON">
          <CodeBlock code={`curl http://localhost:5000/api/does-not-exist`} />
          <p>
            You should get a JSON body with <code>success: false</code>, not an
            HTML page.
          </p>
        </Step>
      </Steps>

      <h2>Common mistakes</h2>

      <PropertyTable
        headers={["Mistake", "Consequence", "Fix"]}
        rows={[
          [
            'CORS `origin: "*"` with credentials',
            "Either broken or no protection",
            "An explicit allow-list of client origins",
          ],
          [
            "Rate limiting after body parsing",
            "Attackers make you parse every request",
            "Register limiters before express.json()",
          ],
          [
            "Sanitizing before parsing",
            "req.body is empty, nothing is scrubbed",
            "Register after express.json()",
          ],
          [
            "authorize() before authenticate()",
            "TypeError → 500 on a public route",
            "Always authenticate first",
          ],
          [
            "No 404 fallback",
            "Unmatched routes return HTML; clients crash parsing",
            "app.use(notFound) after all routes",
          ],
          [
            "Logging req.body",
            "Passwords and OTPs in your log files",
            "Log metadata only",
          ],
          [
            "Trusting file.originalname",
            "Path traversal and collisions",
            "Generate the filename, keep the extension",
          ],
          [
            "No X-Request-Id",
            "A user-reported error is untraceable",
            "Assign the id in the first middleware",
          ],
        ]}
      />

      <p>
        Next: <a href="/docs/backend/auth">Authentication &amp; RBAC</a> — which
        uses every layer above, and is the one place where a mistake in ordering
        becomes a security incident.
      </p>
    </>
  );
}

export function BackendAuth() {
  return (
    <>
      <p>
        This is the chapter where the platform's money and its users are
        actually protected. Everything so far has been structural discipline —
        good habits that make the code correct. Authentication is where a single
        careless line lets someone else take an order, spend a merchant's money,
        or impersonate an administrator.
      </p>

      <h2>Two tokens, two lifetimes</h2>

      <p>
        A single long-lived token is the usual beginner mistake and it is a bad
        one. If it leaks — from a shared device, an XSS payload, a log file —
        the attacker has indefinite access that no amount of server-side
        revocation can undo.
      </p>

      <PropertyTable
        headers={["Property", "Access token", "Refresh token"]}
        rows={[
          ["Lifetime", "15 minutes", "7 days"],
          ["Signed with", "JWT_SECRET", "JWT_REFRESH_SECRET (a different key)"],
          [
            "Sent on",
            "Every request, as a Bearer header",
            "Only to /api/auth/refresh-token",
          ],
          [
            "Carried in",
            "Memory (mobile) / httpOnly cookie (admin)",
            "SecureStore or httpOnly cookie",
          ],
          [
            "Purpose",
            "Proves identity",
            "Proves the right to obtain a new access token",
          ],
          [
            "If leaked",
            "Exposure window is 15 minutes",
            "Needs rotation and reuse detection",
          ],
        ]}
      />

      <Diagram caption="Token lifecycle">
        {`
  login(email, password)
        │
        ├──► verify password (bcrypt)
        ├──► sign ACCESS  (JWT_SECRET,      15m)
        ├──► sign REFRESH (JWT_REFRESH_SECRET, 7d)
        └──► { accessToken, refreshToken, user }

  every request:  Authorization: Bearer <accessToken>
        │
        ├── valid ─────────────────────────► controller
        └── expired (401 Token expired)
                    │
                    client calls POST /api/auth/refresh-token
                    with the refresh token
                    │
                    ├──► verify with JWT_REFRESH_SECRET
                    ├──► look up the user, confirm isActive
                    └──► new access token, refresh token rotated
`}
      </Diagram>

      <h2>Hashing passwords</h2>

      <p>
        Passwords are hashed with <code>bcryptjs</code> at 12 salt rounds, in a
        Mongoose pre-save hook. Twelve rounds is the current floor: it takes
        roughly 250 ms per hash on typical server hardware, which is far too
        slow for an attacker with a GPU and far too fast for a legitimate user
        to notice.
      </p>

      <CodeBlock
        language="js"
        title="models/User.js — the hashing hook"
        code={`import bcrypt from 'bcryptjs';

// Auto-hash password before saving
userSchema.pre('save', async function (next) {
  // The guard matters more than the hash. Without it, every profile update
  // re-runs bcrypt on an already-hashed string, which both corrupts the
  // value and adds 250 ms to an operation that should be instant.
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};`}
      />

      <Callout
        variant="tip"
        title="Why the hash belongs in a hook, not in the controller"
      >
        <p>
          A hook makes the correct thing unavoidable. A controller that forgets
          to hash stores the plaintext; a controller that hashes twice stores a
          hash of a hash. Neither failure is possible when Mongoose owns the
          step, and the password reset flow can simply assign{" "}
          <code>user.password = password</code> and call <code>save()</code>.
        </p>
      </Callout>

      <h2>The token utility</h2>

      <p>
        One module owns token creation. Controllers never call{" "}
        <code>jwt.sign</code> directly — centralising it is what makes expiry
        and secret rotation a one-file change.
      </p>

      <CodeBlock
        language="js"
        title="utils/generateToken.js"
        code={`import jwt from 'jsonwebtoken';

// Generate JWT Token
export const generateToken = (payload, expiresIn = '15m') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn,
  });
};

// Generate Refresh Token
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret',
    { expiresIn: '7d' },
  );
};

// Generate Email Verification Token
export const generateEmailVerificationToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_VERIFY_SECRET || 'verify_fallback_secret',
    { expiresIn: '1h' },
  );
};

// Generate Password Reset Token
export const generatePasswordResetToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_RESET_SECRET || 'reset_fallback_secret',
    { expiresIn: '1h' },
  );
};

export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};`}
      />

      <Callout variant="warning" title="The payload should carry the role">
        <p>
          Signing <code>{"{ id }"}</code> alone forces a database read on every
          request just to answer &ldquo;what role is this?&rdquo; Add the role
          so <code>requireRole</code> is a pure in-memory check:
        </p>
        <CodeBlock
          code={`generateAccessToken({
  id: user._id,
  role: user.role,   // verified server-side at issue time, never client-supplied
});`}
        />
        <p>
          The trade-off is staleness: a demotion takes effect when the access
          token expires rather than instantly. Fifteen minutes is short enough
          that it is usually the right call — and it removes a query from the
          hot path of every authenticated request.
        </p>
      </Callout>

      <h2>Register</h2>

      <p>
        Check for an existing account, create the user, issue a verification
        OTP, and return a token pair.
      </p>

      <CodeBlock
        language="js"
        title="controllers/authController.js — register"
        code={`// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { email, password, profile, role } = req.body;

  // The pre-check below gives a nicer message, but the unique index is what
  // actually guarantees uniqueness — two simultaneous registrations both pass
  // this check and one still loses at the database.
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User already exists with this email');
  }

  const user = await User.create({
    email,
    password,
    profile,
    role: role || 'user',
  });

  // Generate email verification OTP
  const emailOTP = generateOTP();
  user.emailVerificationOTP = emailOTP;
  user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      template: 'emailVerification',
      templateData: [user.profile.firstName, emailOTP],
    });
  } catch (error) {
    // A failed email must not fail the registration. The user can request a
    // resend; failing here would strand them with an account they cannot verify.
    logger.error('Failed to send verification email', {
      userId: user._id,
      error: error.message,
    });
  }

  const token = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  res.status(201).json({
    success: true,
    message:
      'User registered successfully. Please check your email for verification OTP.',
    data: { user, token, refreshToken },
  });
});`}
      />

      <h2>Login</h2>

      <p>
        Three checks, in this order: the user exists, the password matches, and
        the account is active. The failure messages are deliberately identical
        for the first two.
      </p>

      <CodeBlock
        language="js"
        title="controllers/authController.js — login"
        code={`export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password');
  }

  // If password is select: false on the schema, request it explicitly.
  const user = await User.findOne({ email }).select('+password');

  // One message for both branches. Telling an attacker which half was wrong
  // turns the endpoint into an account-existence oracle.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized(
      'Account is deactivated. Please contact support.',
    );
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  res.json({
    success: true,
    message: 'Login successful',
    data: { user, token, refreshToken },
  });
});`}
      />

      <Callout variant="danger" title="Timing attacks on the login endpoint">
        <p>
          When the user does not exist, <code>!user</code> short-circuits and
          bcrypt never runs — so the response is fast. When the user exists,
          bcrypt takes ~250 ms. That difference is measurable and it is exactly
          how an attacker enumerates your user base. If enumeration matters to
          you, run a dummy <code>bcrypt.compare</code> against a constant hash
          when the user is absent so both paths cost the same.
        </p>
      </Callout>

      <h2>requireAuth</h2>

      <p>
        Reads the Bearer header, verifies the signature and expiry, confirms the
        user still exists and is active, and attaches them to the request.
      </p>

      <CodeBlock
        language="js"
        title="middleware/auth.js — authenticate"
        code={`// Verify JWT token and authenticate user
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check for token in Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  // Verify signature + expiry in one step. Anything invalid throws here.
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

  // The database lookup is not redundant. It is what makes deactivation
  // immediate: a user suspended by an admin loses access on the next request
  // rather than in fifteen minutes.
  const user = await User.findById(decoded.id).select('-password');

  if (!user) {
    throw ApiError.unauthorized('Token is not valid. User not found.');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account is deactivated.');
  }

  // Attach user to request object
  req.user = user;
  next();
};`}
      />

      <p>
        The header check is deliberately strict. The codebase's shorthand —
        <code>req.header('Authorization')?.replace('Bearer ', '')</code> — is
        more forgiving, and that is exactly its problem: a client sending{" "}
        <code>Basic abc</code> silently produces <code>Basic abc</code> as the
        token after the replace, and you get a confusing 401 instead of a clear
        error.
      </p>

      <p>
        There is also an <code>optionalAuth</code> variant for endpoints that
        behave differently for signed-in users — a restaurant list that shows
        favourite badges, say — but which must not reject anonymous requests.
      </p>

      <CodeBlock
        language="js"
        title="middleware/auth.js — optionalAuth"
        code={`// Optional auth that doesn't block request if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();          // Valid token: attach the user and continue
  } catch {
    next();          // Bad token: still continue, just unauthenticated
  }
};`}
      />

      <h2>requireRole</h2>

      <p>
        A variadic guard. It reads the role from the verified token and compares
        it against an allow-list. It runs after <code>authenticate</code>,
        always.
      </p>

      <CodeBlock
        language="js"
        title="middleware/auth.js — authorize"
        code={`// Check if user has required roles for access
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Defensive: guards against the route being mounted without authenticate().
      return next(ApiError.unauthorized('Authentication required'));
    }

    // The role comes from the verified token, never from a header or body.
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          \`User role \${req.user.role} is not authorized to access this resource\`,
        ),
      );
    }

    next();
  };
};`}
      />

      <CodeBlock
        language="js"
        title="routes/ — guards in use"
        code={`// Admin only.
router.get('/users', authenticate, authorize('admin'), listUsers);

// A restaurant may only edit its own profile. Note the second check: the role
// guard gets you to the right door, this gets you into the right room.
router.put(
  '/:id',
  authenticate,
  authorize('restaurant', 'admin'),
  asyncHandler(async (req, res) => {
    if (req.user.role === 'restaurant') {
      const owned = await Restaurant.findOne({
        _id: req.params.id,
        ownerId: req.user._id,
      });
      if (!owned) throw ApiError.forbidden('Not your restaurant');
    }
    // …
  }),
);

// Any authenticated role.
router.patch(
  '/:id/status',
  authenticate,
  authorize('restaurant', 'rider', 'admin'),
  updateOrderStatus,
);`}
      />

      <Callout
        variant="danger"
        title="Role checks must never read the request body"
      >
        <p>
          <code>if (req.body.role === 'admin')</code> is a privilege escalation.
          <code>req.body</code> is attacker-controlled input. The role must come
          from <code>req.user.role</code>, which is derived from a signature the
          server produced. If you find yourself writing{" "}
          <code>req.body.role</code> anywhere in a permission check, stop and
          rewrite it.
        </p>
      </Callout>

      <Split
        left={{
          title: "Authorisation mistakes that leak data",
          children: (
            <ul>
              <li>
                Filtering by ID but not by owner, so one restaurant edits
                another&rsquo;s menu.
              </li>
              <li>
                Trusting <code>restaurantId</code> from the body when the owner
                is in the token.
              </li>
              <li>
                Forgetting <code>requireRole</code> on a route that only
                &ldquo;feels&rdquo; protected.
              </li>
              <li>
                Returning other users&rsquo; documents from a{" "}
                <code>findById</code> with no ownership filter.
              </li>
            </ul>
          ),
        }}
        right={{
          title: "Mistakes that leak tokens",
          children: (
            <ul>
              <li>
                Sending the refresh token in a normal API response or a URL
                query string.
              </li>
              <li>Logging the Authorization header.</li>
              <li>
                Returning the user document with the password path selected.
              </li>
              <li>
                Putting the access token in a URL, where it lands in server
                logs.
              </li>
            </ul>
          ),
        }}
      />

      <h2>Refreshing and rotation</h2>

      <p>
        The refresh endpoint verifies with the refresh secret, re-checks the
        user, and issues a new pair. Rotation means the old refresh token stops
        working the moment a new one is issued.
      </p>

      <CodeBlock
        language="js"
        title="controllers/authController.js — refreshToken"
        code={`// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token required');
  }

  try {
    // Verified with the REFRESH secret. An access token presented here fails
    // the signature check, so the two token types cannot be interchanged.
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret',
    );

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const token = generateAccessToken({ id: user._id, role: user.role });
    const newRefresh = generateRefreshToken({ id: user._id });

    res.json({
      success: true,
      data: { token, refreshToken: newRefresh },
    });
  } catch (error) {
    throw ApiError.unauthorized('Invalid refresh token');
  }
});`}
      />

      <h3>Where the refresh token lives</h3>

      <PropertyTable
        headers={["Client", "Access token", "Refresh token", "Why"]}
        rows={[
          [
            "Customer / Restaurant / Rider apps",
            "In-memory JS variable",
            "expo-secure-store (Keychain / Keystore)",
            "AsyncStorage is plaintext on disk and readable by a rooted device or a backup.",
          ],
          [
            "Admin panel",
            "In-memory JS variable",
            "httpOnly, Secure, SameSite=Strict cookie",
            "A cookie is not reachable from JavaScript, so an XSS payload cannot exfiltrate it.",
          ],
          [
            "Never",
            "localStorage",
            "localStorage",
            "Any XSS anywhere on the origin can read it.",
          ],
        ]}
      />

      <Callout
        variant="danger"
        title="localStorage is not storage, it is a public noticeboard"
      >
        <p>
          Anything in <code>localStorage</code> is readable by any script on the
          origin and survives until explicitly cleared. A single stored XSS
          vulnerability hands an attacker a seven-day refresh token. On mobile,
          <code>expo-secure-store</code>; on the web, an httpOnly cookie with{" "}
          <code>SameSite=Strict</code>.
        </p>
      </Callout>

      <h3>Rotation and reuse detection</h3>

      <p>
        A stateless JWT refresh token cannot be revoked — not until it expires.
        Rotation plus a server-side deny-list is what closes that window.
      </p>

      <CodeBlock
        language="js"
        title="utils/refreshTokenStore.js — rotation with reuse detection"
        code={`import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

/**
 * A refresh token is a random opaque string, not a JWT. It lets us look the
 * session up in the database, which is what makes revocation and reuse
 * detection possible at all.
 *
 * The JWT access token stays stateless. Only the long-lived half needs state.
 */
export const issueRefreshToken = async (userId) => {
  const token = crypto.randomBytes(48).toString('hex');

  await RefreshToken.create({
    userId,
    token: await bcrypt.hash(token, 10),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    familyId: crypto.randomUUID(),   // every rotation inherits this id
  });

  return token;
};

export const rotateRefreshToken = async (presented) => {
  const record = await RefreshToken.findOneAndUpdate(
    { token: await bcrypt.hash(presented, 10), revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
    { new: false },
  );

  if (!record) {
    // Reuse of an already-rotated token means it was stolen. Kill the whole
    // family: the legitimate client is logged out too, and that is correct.
    throw ApiError.unauthorized('Refresh token reuse detected');
  }

  return issueRefreshToken(record.userId);
};`}
      />

      <Diagram caption="Rotation, reuse detection, and logout">
        {`
  session A1 ──refresh──► session A2 ──refresh──► session A3
      revoked               revoked                (current)

  Attacker holds A1 and replays it after A2 exists:
     A1 already revoked ──► reuse detected
     ──► revoke the whole family
     ──► legitimate client's A2/A3 stop working too
     ──► user logs in again; attacker is logged out

  Logout: revoke the current token's family.
`}
      </Diagram>

      <Callout variant="note" title="Where NutriDeliver stands today">
        <p>
          The shipped <code>refreshToken</code> controller issues a stateless
          JWT with no server-side record, so logout is currently advisory — the
          client discards its tokens, and they remain valid until they expire.
          The store above is the fix. A stateless refresh token is acceptable
          for a short-lived pilot; it is not acceptable once real money is
          involved, because you cannot revoke access to a suspended account
          mid-session.
        </p>
      </Callout>

      <h2>Logout</h2>

      <p>
        With rotation in place, logout revokes the presented token&rsquo;s
        family. Without it, logout is a client-side action — the server
        acknowledges and returns.
      </p>

      <CodeBlock
        language="js"
        title="controllers/authController.js — logout"
        code={`// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // With the refresh store in place:
  //   await RefreshToken.revokeFamilyFor(req.user._id, req.body.refreshToken);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});`}
      />

      <h2>Password reset with OTP</h2>

      <p>
        A four-step flow: request, verify, reset. The key design choice is that
        verification mints a short-lived, purpose-scoped token, so the reset
        password itself is a separate request that can be audited.
      </p>

      <Steps>
        <Step title="Request an OTP">
          <CodeBlock
            code={`export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  const resetOTP = generateOTP();
  user.passwordResetOTP = resetOTP;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendEmail({
    email: user.email,
    template: 'passwordReset',
    templateData: [user.profile.firstName, resetOTP],
  });
});`}
          />
        </Step>

        <Step title="Verify the OTP">
          <CodeBlock
            code={`export const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // One query does existence, correctness, and expiry at once.
  const user = await User.findOne({
    email,
    passwordResetOTP: otp,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired OTP');

  // A purpose-scoped token: 15 minutes, and rejected anywhere that does not
  // check decoded.purpose === 'password_reset'.
  const resetToken = jwt.sign(
    { id: user._id, purpose: 'password_reset' },
    process.env.JWT_RESET_SECRET,
    { expiresIn: '15m' },
  );

  // Single-use: clear the OTP the moment it is redeemed.
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ success: true, data: { resetToken, email: user.email } });
});`}
          />
        </Step>

        <Step title="Set the new password">
          <CodeBlock
            code={`export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, password } = req.body;

  const decoded = jwt.verify(resetToken, process.env.JWT_RESET_SECRET);

  // A reset token must not work as an access token. Without this check, the
  // separate secret alone is the only thing standing between the two.
  if (decoded.purpose !== 'password_reset') {
    throw ApiError.badRequest('Invalid reset token');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.badRequest('Invalid reset token');

  // The pre-save hook hashes. The controller does not, and must not.
  user.password = password;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully' });
});`}
          />
        </Step>

        <Step title="Invalidate outstanding sessions">
          <p>
            A password reset should revoke every existing refresh token for that
            account. Otherwise an attacker who logged in before the reset keeps
            access, which defeats the entire exercise.
          </p>
        </Step>
      </Steps>

      <Callout variant="danger" title="Never reveal whether an account exists">
        <p>
          The <code>forgotPassword</code> flow returns 404 when the email is
          unknown. That is an account-existence oracle: an attacker can test a
          list of emails against it and build a verified user base without ever
          attempting a login. Return the same 200 response either way, send
          nothing when the account is absent, and rate-limit the endpoint hard.
        </p>
      </Callout>

      <h2>Email verification</h2>

      <p>
        Structurally identical to the reset flow: an OTP, an expiry field, a
        single query that checks all three at once, and cleanup on success.
      </p>

      <CodeBlock
        language="js"
        title="controllers/authController.js — verifyEmail"
        code={`export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    emailVerificationOTP: otp,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired OTP');

  user.isVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully' });
});`}
      />

      <p>
        Verification status is a business rule, not a security gate: require it
        before a rider can go online or a restaurant can publish a menu, but do
        not block login on it. Locking people out of their own account over an
        undelivered email produces support tickets and abandoned signups.
      </p>

      <h2>OTPs are a six-digit space</h2>

      <p>
        One million combinations, and the endpoint is public. Two properties
        make that safe: a ten-minute expiry, and rate limiting. Add both, and
        add a maximum attempt count per issued OTP.
      </p>

      <PropertyTable
        headers={["Control", "Value", "Why"]}
        rows={[
          ["OTP length", "6 digits", "Usable on a phone keypad."],
          [
            "Expiry",
            "10 minutes",
            "Long enough to fetch an email, short enough to matter.",
          ],
          [
            "Endpoint rate limit",
            "50 / minute per IP",
            "Caps brute force to 50×10⁶ attempts per window per IP.",
          ],
          [
            "Single use",
            "Cleared on redemption",
            "An intercepted OTP cannot be replayed.",
          ],
          [
            "Attempt cap",
            "5 per OTP",
            "Turns a 10⁶ space into 5×10⁶ — and invalidates the OTP on exhaustion.",
          ],
          [
            "Generator",
            "crypto.randomInt, not Math.random",
            "Math.random is predictable from prior output.",
          ],
        ]}
      />

      <CodeBlock
        language="js"
        title="utils/generateOTP.js — a cryptographically sound OTP"
        code={`import crypto from 'crypto';

/**
 * A uniform six-digit code from a CSPRNG.
 *
 * Math.floor(100000 + Math.random() * 900000) is the version in the current
 * codebase. It is fine for a demo and wrong for production: Math.random's
 * output is recoverable from a handful of observed values, which lets an
 * attacker predict every code issued to a victim.
 */
export const generateOTP = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(crypto.randomInt(min, max));
};`}
      />

      <h2>Keeping the password out of responses</h2>

      <p>Two independent mechanisms, because either alone has a gap.</p>

      <CodeBlock
        language="js"
        title="models/User.js — exclusion and a transform"
        code={`const userSchema = new mongoose.Schema(
  {
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      // 1. Never loaded unless a query explicitly asks with .select('+password').
      select: false,
    },
    // …
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // 2. Even if it is loaded, it is never serialised.
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compare an instance method, not a schema method — the latter overrides
// toObject() and breaks populate() in subtle ways.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};`}
      />

      <Callout variant="note" title="A defence-in-depth test">
        <p>Assert it in CI so a future edit cannot regress it:</p>
        <CodeBlock
          code={`it('never serialises the password', async () => {
  const user = await User.create({
    email: 'a@b.com',
    password: 'secret123',
    profile: { firstName: 'A', lastName: 'B' },
  });

  const json = user.toJSON();
  expect(json.password).toBeUndefined();
  expect(JSON.stringify(json)).not.toContain('secret123');
});`}
        />
      </Callout>

      <h2>Common mistakes</h2>

      <PropertyTable
        headers={["Mistake", "Consequence", "Fix"]}
        rows={[
          [
            "Role taken from req.body",
            "Any client can claim any role",
            "Read it from the verified token",
          ],
          [
            "Access token in localStorage",
            "XSS exfiltrates a 7-day credential",
            "In memory; refresh in SecureStore or an httpOnly cookie",
          ],
          [
            "One token type for both halves",
            "A refresh token works as an access token",
            "Two secrets, two lifetimes",
          ],
          [
            "No user lookup in authenticate",
            "A deactivated account keeps access for 15 minutes",
            "Look up the user and check isActive",
          ],
          [
            "Compare only when the user exists",
            "Login timing reveals which emails are registered",
            "Run bcrypt against a constant hash on the miss path",
          ],
          [
            "404 on forgot-password",
            "Account enumeration",
            "Identical response either way",
          ],
          ["Math.random for OTPs", "Codes are predictable", "crypto.randomInt"],
          [
            "Logout that only clears the client",
            "Access survives until expiry",
            "Revoke the refresh token family",
          ],
          [
            "Forgetting to clear the OTP",
            "An intercepted code can be replayed",
            "Null it on redemption",
          ],
          [
            "authorize() before authenticate()",
            "TypeError → 500 on a public route",
            "Authenticate first, always",
          ],
        ]}
      />

      <h2>Verifying the whole flow</h2>

      <Steps>
        <Step title="Register and confirm a token pair">
          <CodeBlock
            code={`curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"a@b.com","password":"secret123",
       "profile":{"firstName":"Ada","lastName":"L"}}'`}
          />
        </Step>

        <Step title="Call a protected route">
          <CodeBlock
            code={`curl http://localhost:5000/api/auth/me \\
  -H "Authorization: Bearer <accessToken>"`}
          />
        </Step>

        <Step title="Watch it fail after 15 minutes">
          <p>
            You should get <code>401 Token expired</code> — the exact signal the
            mobile client uses to trigger a refresh.
          </p>
        </Step>

        <Step title="Refresh">
          <CodeBlock
            code={`curl -X POST http://localhost:5000/api/auth/refresh-token \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"<refreshToken>"}'`}
          />
        </Step>

        <Step title="Confirm the boundaries hold">
          <CodeBlock
            code={`# An access token must not work as a refresh token.
curl -X POST http://localhost:5000/api/auth/refresh-token \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken":"<accessToken>"}'
# → 401 Invalid refresh token

# A restaurant-role token must not reach an admin route.
curl http://localhost:5000/api/admin/users \\
  -H "Authorization: Bearer <restaurantToken>"
# → 403 User role restaurant is not authorized`}
          />
        </Step>
      </Steps>

      <h2>What comes next</h2>

      <p>
        Authentication and authorisation are now in place, which means the route
        layer can be designed properly: resource naming, response envelopes, and
        version prefixes. Read{" "}
        <a href="/docs/backend/api-design">API Design &amp; Routing</a> next.
      </p>
    </>
  );
}
