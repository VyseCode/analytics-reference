import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/analytics_ref";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

const siteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 253,
    },
    trackingId: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true },
);
siteSchema.index({ owner: 1, createdAt: -1 });

const deviceSchema = new mongoose.Schema(
  {
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    type: { type: String, default: "desktop" },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    visitorId: { type: String, required: true, trim: true, maxlength: 200 },
    eventId: { type: String, required: true, trim: true, maxlength: 200 },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    referrer: { type: String, default: "", trim: true, maxlength: 2048 },
    device: { type: deviceSchema, default: () => ({}) },
  },
  { timestamps: true },
);
eventSchema.index({ site: 1, createdAt: -1 });
eventSchema.index({ site: 1, eventId: 1 }, { unique: true });
eventSchema.index({ site: 1, name: 1, createdAt: -1 });
eventSchema.index({ site: 1, url: 1 });
eventSchema.index({ site: 1, referrer: 1 });
eventSchema.index({ site: 1, visitorId: 1 });

const funnelSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    steps: { type: [String], required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
funnelSchema.index({ site: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);
const Site = mongoose.model("Site", siteSchema);
const Event = mongoose.model("Event", eventSchema);
const Funnel = mongoose.model("Funnel", funnelSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection.db.databaseName;
  if (dbName !== "analytics_ref") {
    throw new Error(`Refusing to seed unexpected database: ${dbName}`);
  }

  await mongoose.connection.dropDatabase();

  const passwordHash = await bcrypt.hash("password123", 10);
  const owner = await User.create({
    name: "Demo Owner",
    email: "owner@example.com",
    password: passwordHash,
  });
  const other = await User.create({
    name: "Other Owner",
    email: "other@example.com",
    password: passwordHash,
  });

  const blog = await Site.create({
    owner: owner._id,
    name: "Acme Blog",
    domain: "blog.acme.test",
    trackingId: "trk_acme_blog",
  });
  const store = await Site.create({
    owner: owner._id,
    name: "Acme Store",
    domain: "store.acme.test",
    trackingId: "trk_acme_store",
  });
  const otherSite = await Site.create({
    owner: other._id,
    name: "Other Co",
    domain: "other.test",
    trackingId: "trk_other_co",
  });

  const sites = [
    { doc: blog, key: "blog" },
    { doc: store, key: "store" },
    { doc: otherSite, key: "other" },
  ];
  const urls = ["/", "/blog/hello-world", "/pricing", "/about"];
  const referrers = [
    "https://google.com",
    "https://twitter.com",
    "",
    "https://news.ycombinator.com",
  ];
  const devices = [
    { browser: "Chrome", os: "Windows", type: "desktop" },
    { browser: "Safari", os: "iOS", type: "mobile" },
    { browser: "Firefox", os: "macOS", type: "desktop" },
    { browser: "Chrome", os: "Android", type: "mobile" },
    { browser: "Safari", os: "macOS", type: "tablet" },
  ];

  const events = [];
  for (let day = 0; day < 30; day += 1) {
    const base = Date.now() - day * 86_400_000;
    for (const { doc: site, key } of sites) {
      for (let i = 0; i < 5; i += 1) {
        events.push({
          site: site._id,
          name: "pageview",
          visitorId: `visitor-${key}-${i + 1}`,
          eventId: `evt-${key}-${day}-pv-${i}`,
          url: urls[i % urls.length],
          referrer: referrers[i % referrers.length],
          device: devices[i % devices.length],
          createdAt: new Date(base - (9 + i) * 3_600_000),
        });
      }
      for (let i = 0; i < 2; i += 1) {
        events.push({
          site: site._id,
          name: "signup",
          visitorId: `visitor-${key}-${i + 1}`,
          eventId: `evt-${key}-${day}-su-${i}`,
          url: "/signup",
          referrer: referrers[(i + 1) % referrers.length],
          device: devices[(i + 2) % devices.length],
          createdAt: new Date(base - (11 + i) * 3_600_000),
        });
      }
      events.push({
        site: site._id,
        name: "purchase",
        visitorId: `visitor-${key}-1`,
        eventId: `evt-${key}-${day}-pu`,
        url: "/checkout",
        referrer: "",
        device: devices[0],
        createdAt: new Date(base - 13 * 3_600_000),
      });
    }
  }

  const orphanSiteId = new mongoose.Types.ObjectId();
  for (let i = 0; i < 3; i += 1) {
    events.push({
      site: orphanSiteId,
      name: "pageview",
      visitorId: `visitor-ghost-${i}`,
      eventId: `evt-ghost-${i}`,
      url: "/ghost",
      referrer: "",
      device: devices[0],
      createdAt: new Date(Date.now() - i * 3_600_000),
    });
  }

  await Event.insertMany(events, { ordered: false });

  await Funnel.create([
    {
      site: blog._id,
      name: "Signup funnel",
      steps: ["pageview", "signup", "purchase"],
      createdBy: owner._id,
    },
    {
      site: blog._id,
      name: "Traffic only",
      steps: ["pageview"],
      createdBy: owner._id,
    },
    {
      site: store._id,
      name: "Store funnel",
      steps: ["pageview", "signup", "purchase"],
      createdBy: owner._id,
    },
    {
      site: otherSite._id,
      name: "Other funnel",
      steps: ["pageview", "signup"],
      createdBy: other._id,
    },
  ]);

  await Promise.all([
    User.init(),
    Site.init(),
    Event.init(),
    Funnel.init(),
  ]);

  console.log(
    `Seeded analytics_ref: users=2 sites=3 events=${events.length} funnels=4`,
  );
  console.log("Demo accounts: owner@example.com / other@example.com (password123)");
  console.log("Tracking IDs: trk_acme_blog, trk_acme_store, trk_other_co");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
