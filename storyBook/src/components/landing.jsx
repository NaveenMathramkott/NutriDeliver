import { useEffect } from "react";
import {
  ArrowRight,
  Boxes,
  Clock,
  CreditCard,
  Info,
  Radio,
  Smartphone,
  Sparkles,
  Truck,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import { GitHubIcon } from "./icons";
import { REPO } from "../lib/repo";
import { pageHref } from "../lib/urls";
import { Logo } from "./layout/logo";
import { sections } from "../lib/navigation";

const HIGHLIGHTS = [
  {
    icon: Boxes,
    title: "A real backend",
    body: "Express 5, MongoDB, and Mongoose models for ten collections — auth, menus, carts, orders, payments, offers, notifications.",
  },
  {
    icon: Truck,
    title: "A real marketplace",
    body: "Three mobile apps with distinct roles, joined by one order state machine that refuses illegal transitions.",
  },
  {
    icon: CreditCard,
    title: "Real payments",
    body: "Stripe PaymentIntents, server-side confirmation, and webhook reconciliation that treats the client as untrusted.",
  },
  {
    icon: Radio,
    title: "Real realtime",
    body: "Socket.IO rooms per role push order updates and stream rider location instead of polling every few seconds.",
  },
  {
    icon: Smartphone,
    title: "Real clients",
    body: "Three Expo apps plus a Redux-driven admin dashboard, built on a shared API client with transparent token refresh.",
  },
  {
    icon: Utensils,
    title: "Real domain logic",
    body: "Delivery radius, minimum orders, discount scoping, auto-cancel timers, and operating-hours synchronisation.",
  },
  {
    icon: Sparkles,
    title: "AI, where it earns its place",
    body: "Nutrition-aware recommendations, menu enrichment, ETA forecasting, and grounded support chat — each with a deterministic fallback and a cost ceiling.",
  },
];

const AI_FEATURES = [
  {
    icon: Sparkles,
    title: "Where AI belongs",
    href: "/docs/ai/integration",
    body: "Good fits, bad fits, a provider-agnostic client, and the prompt-injection rules that decide whether it is safe at all.",
  },
  {
    icon: Utensils,
    title: "Recommendations",
    href: "/docs/ai/recommendations",
    body: "MongoDB hard-filters allergies and dietary tags. The model only explains the result — it can never invent a dish.",
  },
  {
    icon: Boxes,
    title: "Menu enrichment",
    href: "/docs/ai/menu-enrichment",
    body: "Turns one line of description into calories, macros, and dietary tags. Fixes the platform’s weakest data.",
  },
  {
    icon: Clock,
    title: "Forecasting",
    href: "/docs/ai/forecasting",
    body: "Predicts delivery times and per-zone demand, after a historical-median baseline the model has to beat.",
  },
  {
    icon: Radio,
    title: "Support agent",
    href: "/docs/ai/support",
    body: "Answers grounded in real order data, with tool calls instead of database access and escalation to a human.",
  },
];

const STATS = [
  { value: "4", label: "Applications" },
  { value: "10", label: "Data models" },
  { value: "130+", label: "API endpoints" },
  { value: "42", label: "Chapters" },
];

export function Landing() {
  useEffect(() => {
    document.title =
      "NutriDeliver — Build a Food Delivery Platform From Scratch";
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        {/* soft glow behind the hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-3xl px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
          <Link
            to="/docs/backend/setup"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Start building · 34 chapters
            <ArrowRight size={12} />
          </Link>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Build a production-grade{" "}
            <span className="text-brand"> AI food delivery platform</span> from
            an empty folder
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
            The complete, uncut walkthrough of NutriDeliver — four applications,
            one API, from architecture decisions to a deployed platform taking
            real money. Every code sample is the code that actually ships,
            including where AI genuinely helps and where it quietly makes things
            worse.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/docs/overview"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Read the guide
              <ArrowRight size={15} />
            </Link>
            <a
              href={REPO.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <GitHubIcon size={15} />
              View source
            </a>
          </div>

          <dl className="mx-auto mt-14 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-card px-4 py-5">
                <dt className="order-2 mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="order-1 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Not a toy tutorial
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            The parts of a food delivery platform that are hard, written out in
            full rather than skipped with &ldquo;production hardening is left as
            an exercise&rdquo;.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="bg-card p-6">
              <item.icon size={18} className="text-brand" />
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles size={12} className="text-brand" />
              AI integration
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Where AI helps a food delivery app — and where it doesn&rsquo;t
            </h2>
            <p className="mt-3 text-muted-foreground">
              Five chapters on adding AI without inheriting AI&rsquo;s problems:
              cost ceilings, latency budgets, deterministic fallbacks, and the
              places a model is simply the wrong tool.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {AI_FEATURES.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className="group bg-card p-6 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-center gap-2">
                  <item.icon size={16} className="text-brand" />
                  <h3 className="font-semibold">{item.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand">
                  Read the chapter
                  <ArrowRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <Info
                size={17}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div className="text-sm leading-relaxed">
                <p className="m-0 font-semibold">
                  The rule these chapters follow
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  A calorie goal from height and weight is a formula, not a
                  prompt — an LLM there is slower, non-deterministic, and costs
                  money. Every feature in this section has a deterministic
                  fallback that ships when the model is unavailable, and a model
                  that must beat a measured baseline before it is allowed to
                  replace one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            The build order
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Thirty-four chapters, sequenced the way you would actually work.
            Each section depends only on what came before it.
          </p>

          <div className="mt-10 space-y-3">
            {sections.map((section, i) => (
              <div
                key={section.title}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-ring/50"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {section.pages[0].description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {section.pages.length} chapter
                    {section.pages.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {section.pages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        to={pageHref(page)}
                        className="inline-block rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Logo className="mx-auto mb-4 h-10 w-10" />
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to start?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Begin with the architecture overview, then get a running API in about
          ten minutes. No credit card, no paid services — every dependency has a
          free tier that holds well past your first thousand users.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/docs/architecture"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Read the architecture
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/docs/backend/setup"
            className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Jump to setup
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            NutriDeliver — an open reference implementation of an industrial
            food delivery platform.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={REPO.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Source
            </a>
            <span>MIT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
