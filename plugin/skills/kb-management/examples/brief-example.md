# Project Brief Example

This is an example of a well-filled-out brief.md that provides rich context for AI exploration.

---

# Project Brief

## Overview

**Project Name:** Legacy E-Commerce API
**Project Type:** legacy-brownfield
**Created:** 2024-01-15T14:30:00Z

## Goal

Understand authentication flow and payment processing to modernize the system safely. We need to move from custom JWT implementation to OAuth2, and from outdated payment gateway to Stripe, but first must understand all the integration points.

## Focus Areas

- Architecture and design patterns
- Security and authentication
- API endpoints and integrations

## Context

### What This Project Does

This is the backend API for our e-commerce platform, built 5 years ago in Ruby on Rails. It handles:

- User authentication and session management
- Product catalog and inventory
- Shopping cart and checkout flow
- Payment processing (currently Braintree)
- Order management and fulfillment tracking
- Admin dashboard API

The API serves a React frontend (web) and React Native mobile apps. About 50K monthly active users, 5K daily transactions.

### Why This Project Exists

Built to replace the original PHP monolith. The Rails API was state-of-the-art in 2019 but has accumulated technical debt. We're now modernizing to support new features (subscriptions, multi-currency, marketplace model).

### Key Stakeholders

- **Primary Users**: E-commerce customers (via web/mobile apps)
- **Internal Users**: Customer service team (via admin dashboard)
- **Maintainers**: Backend team (3 developers, 2 new in past 6 months)
- **Decision Makers**: CTO, Engineering Manager

## Technical Overview

### Architecture

**Type:** RESTful API (monolithic Rails app)

**Key Components:**
- Rails 6.1 API-only mode
- PostgreSQL 13 (main database)
- Redis (sessions, cache, job queue)
- Sidekiq (background jobs)
- Elasticsearch (product search)
- AWS S3 (product images)

**Infrastructure:**
- Heroku (production, staging)
- GitHub Actions (CI/CD)
- Datadog (monitoring)
- Sentry (error tracking)

### Core Technologies

**Languages & Frameworks:**
- Ruby 3.0.6
- Rails 6.1.7
- RSpec (testing)
- Pundit (authorization)
- Devise (authentication foundation)

**Key Gems:**
- `braintree` - Payment processing
- `jwt` - Custom JWT implementation
- `rack-cors` - CORS handling
- `active_model_serializers` - JSON serialization
- `sidekiq` - Background jobs
- `searchkick` - Elasticsearch wrapper

### Critical Dependencies

**External Services:**
- Braintree (payment gateway) - Main integration point for modernization
- SendGrid (transactional emails)
- Twilio (SMS notifications)
- Cloudinary (image transformations)

**Internal Dependencies:**
- Legacy PHP system (still handles gift cards and store credit - not migrated yet)
- Warehouse management system (separate Rails app, synchronizes inventory)

## Pain Points

### Current Challenges

1. **Authentication System:**
   - Custom JWT implementation with undocumented refresh flow
   - Token expiration causes logout issues (most reported bug)
   - No clear separation between authentication and authorization logic
   - Mobile apps have different token handling than web (inconsistent)

2. **Payment Processing:**
   - Braintree integration spread across multiple controllers
   - Webhook handling is brittle (failed payments not always caught)
   - No retry logic for failed transactions
   - Refunds require manual steps

3. **Technical Debt:**
   - God objects: `Order` model is 2000+ lines
   - Callback hell in ActiveRecord models
   - Controllers doing too much business logic
   - Inconsistent API response formats
   - Tests are slow (full suite takes 45 minutes)

4. **Performance:**
   - N+1 queries in cart/checkout endpoints
   - Order history endpoint times out for power users
   - No caching strategy beyond Rails default

### Areas of Uncertainty

**Authentication Flow:**
- How does token refresh actually work end-to-end?
- Where are tokens validated? (Multiple places, unclear)
- What happens when tokens expire during checkout?
- How do password resets interact with sessions?

**Payment Processing:**
- Complete flow from checkout to fulfillment
- How are failed payments handled?
- What happens if Braintree webhook fails?
- Reconciliation process for orders vs. payments

**Data Models:**
- Why does Order have 47 associations?
- What's the relationship between Cart, Order, and Payment?
- How are inventory levels updated (seems to happen in multiple places)

**Deployment:**
- What's the zero-downtime deploy strategy?
- How do we handle database migrations with traffic?
- What's in the CI/CD pipeline exactly?

## Exploration Priorities

1. **Authentication System (HIGH PRIORITY)**
   - Map complete JWT flow from login to logout
   - Identify all validation points
   - Document refresh token handling
   - Find inconsistencies between web and mobile

2. **Payment Processing (HIGH PRIORITY)**
   - Trace complete payment flow
   - Document Braintree integration points
   - Identify failure scenarios
   - Map webhook handling

3. **Order/Cart Data Models (MEDIUM)**
   - Understand Order associations
   - Map cart-to-order conversion
   - Document inventory update triggers

4. **API Endpoints (MEDIUM)**
   - Catalog all public endpoints
   - Document authentication requirements
   - Identify performance bottlenecks

5. **Background Jobs (LOW)**
   - List all Sidekiq jobs
   - Understand retry logic
   - Document scheduling

## Questions to Answer

**Authentication:**
- Q: Where is the JWT secret stored and how is it rotated?
- Q: What claims are in our JWT tokens?
- Q: How long are tokens valid?
- Q: What triggers a token refresh vs. full re-login?

**Payments:**
- Q: What happens if a payment succeeds but order creation fails?
- Q: How do we handle partial refunds?
- Q: What's the reconciliation process between Braintree and our DB?
- Q: Are there race conditions in concurrent payment processing?

**Architecture:**
- Q: What's the dependency graph of our models?
- Q: Which endpoints are slowest and why?
- Q: What code is legacy PHP system dependent on?

## Success Criteria

What would make this knowledge base valuable:

- [x] Complete authentication flow diagram
- [x] Payment processing documentation with failure modes
- [x] Clear data model relationships
- [x] Identified integration points for OAuth2 migration
- [x] Identified integration points for Stripe migration
- [x] Performance bottleneck analysis
- [x] Gotchas and pitfalls documented for new team members
- [x] Test strategy improvements identified

---

*This brief guides the AI's exploration and knowledge building process. The more specific and honest you are about pain points and questions, the better the resulting knowledge base will be.*
