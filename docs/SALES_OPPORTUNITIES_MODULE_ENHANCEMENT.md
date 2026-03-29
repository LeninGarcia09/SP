# Sales & Opportunities Module — Complete Enhancement Plan

> **Module Rethink**: Transform the basic CRUD opportunities module into a best-in-class B2B sales platform, cherry-picking top features from Salesforce, HubSpot, Dynamics 365, Pipedrive, Close, and Freshsales.

---

## 1. Executive Summary

| Aspect | Current State | Target State |
|--------|---------------|--------------|
| **Data Model** | Single `Opportunity` entity with text fields for client | 20+ entities: Leads, Contacts, Accounts, Opportunities, Products, Quotes, Activities, Competitors, Pipelines, Stages, Stakeholders, Forecasts, Activity Templates, Sequences, Sequence Steps, Enrollments, Workflow Rules, Assignment Rules |
| **Pipeline** | 7 hardcoded status values | Multi-pipeline support with configurable stages, probability mapping, forecast categories, and deal health scoring |
| **Contacts** | `clientName` + `clientContact` text fields | Full contact/account management with stakeholder roles, org charts, and relationship tracking |
| **Quoting** | None | Quote creation from opportunity, line items, approval workflow, PDF generation |
| **Activities** | None | Full activity tracking (calls, emails, meetings, notes) with type-specific fields, templates, multi-step sequences, follow-up enforcement, and per-rep/per-deal metrics |
| **Forecasting** | None | Weighted pipeline forecasting, forecast categories (Pipeline/Best Case/Commit/Closed), period-based rollups |
| **Automation** | Manual status changes only | 4-layer automation engine: event bus, built-in triggers (30+ auto-actions), configurable workflow rules, scheduled jobs (8 cron tasks); activity sequences, assignment rules, reminder system |
| **Analytics** | Dashboard pipeline bar chart | Win/loss analysis, sales cycle analytics, rep performance, pipeline health, forecast accuracy |
| **Conversion** | Basic opportunity→project | Enhanced with stakeholder→team mapping, budget allocation, activity history preservation |

---

## 2. Data Model — Complete Entity Design

### 2.1 Account (Company/Organization)

> Inspired by: Salesforce Account, HubSpot Company, Dynamics 365 Account

```
Account {
  id: uuid PK
  tenantId: string(36)
  code: string UNIQUE              // ACC-YYYY-NNN (auto-generated)
  name: string(200)                // Company name (REQUIRED)
  legalName: string(200) nullable  // Official legal name
  industry: string(100) nullable
  website: string(500) nullable
  phone: string(50) nullable
  email: string(200) nullable
  
  // Address
  addressLine1: string(200) nullable
  addressLine2: string(200) nullable
  city: string(100) nullable
  state: string(100) nullable
  country: string(100) nullable
  postalCode: string(20) nullable
  
  // Classification
  type: AccountType                // PROSPECT | CUSTOMER | PARTNER | COMPETITOR | VENDOR | OTHER
  tier: AccountTier nullable       // ENTERPRISE | MID_MARKET | SMB | STARTUP
  annualRevenue: decimal(15,2) nullable
  employeeCount: int nullable
  
  // Ownership
  ownerId: uuid FK → User          // Account owner/manager
  parentAccountId: uuid FK → Account nullable  // Account hierarchy
  
  // Tracking
  source: string(100) nullable     // How we found this account (referral, web, event, etc.)
  tags: string[] default []
  metadata: jsonb default {}
  
  isActive: boolean default true
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Indexes**: `tenantId`, `name`, `type`, `ownerId`, `parentAccountId`, `tags (GIN)`, `metadata (GIN)`

### 2.2 Contact (Person at an Account)

> Inspired by: Salesforce Contact, HubSpot Contact, Freshsales Contact

```
Contact {
  id: uuid PK
  tenantId: string(36)
  code: string UNIQUE              // CON-YYYY-NNN
  
  // Personal
  firstName: string(100)
  lastName: string(100)
  email: string(200) nullable
  phone: string(50) nullable
  mobilePhone: string(50) nullable
  jobTitle: string(200) nullable
  department: string(100) nullable
  
  // Relationships
  accountId: uuid FK → Account     // Primary company
  reportsToId: uuid FK → Contact nullable  // Org hierarchy
  
  // Communication preferences
  preferredChannel: ContactChannel  // EMAIL | PHONE | IN_PERSON | VIDEO
  timezone: string(50) nullable
  language: string(10) default 'en'
  
  // Classification
  type: ContactType                // PRIMARY | BILLING | TECHNICAL | EXECUTIVE | OTHER
  influence: ContactInfluence nullable  // DECISION_MAKER | INFLUENCER | CHAMPION | BLOCKER | END_USER | EVALUATOR | ECONOMIC_BUYER
  
  // Engagement
  lastContactedAt: timestamp nullable
  lastActivityAt: timestamp nullable
  
  // Profile
  linkedinUrl: string(500) nullable
  notes: text nullable
  tags: string[] default []
  metadata: jsonb default {}
  
  isActive: boolean default true
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Indexes**: `tenantId`, `accountId`, `email`, `lastName`, `influence`, `tags (GIN)`

### 2.3 Lead (Unqualified Prospect)

> Inspired by: Salesforce Lead, Freshsales Lead, Dynamics 365 Lead

```
Lead {
  id: uuid PK
  tenantId: string(36)
  code: string UNIQUE              // LEAD-YYYY-NNN
  
  // Person info
  firstName: string(100)
  lastName: string(100)
  email: string(200) nullable
  phone: string(50) nullable
  jobTitle: string(200) nullable
  
  // Company info (pre-account)
  companyName: string(200)
  industry: string(100) nullable
  companySize: string(50) nullable  // 1-10, 11-50, 51-200, 201-1000, 1000+
  website: string(500) nullable
  
  // Lead tracking
  status: LeadStatus               // NEW | CONTACTED | ENGAGED | QUALIFIED | UNQUALIFIED | CONVERTED
  source: LeadSource               // WEB_FORM | REFERRAL | EVENT | COLD_OUTREACH | PARTNER | SOCIAL | AD_CAMPAIGN | INBOUND_CALL | OTHER
  rating: LeadRating               // HOT | WARM | COLD
  score: int default 0             // 0-100 lead score
  
  // Assignment
  ownerId: uuid FK → User nullable // Assigned sales rep
  assignedAt: timestamp nullable
  
  // Qualification
  budget: decimal(15,2) nullable
  authority: string(200) nullable  // Decision maker info
  need: text nullable              // Pain points / needs
  timeline: string(100) nullable   // Expected timeline
  
  // Conversion
  convertedAt: timestamp nullable
  convertedAccountId: uuid FK → Account nullable
  convertedContactId: uuid FK → Contact nullable
  convertedOpportunityId: uuid FK → Opportunity nullable
  convertedBy: uuid FK → User nullable
  
  // Tracking
  lastContactedAt: timestamp nullable
  nextFollowUpAt: timestamp nullable
  
  notes: text nullable
  tags: string[] default []
  metadata: jsonb default {}
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Indexes**: `tenantId`, `status`, `source`, `rating`, `ownerId`, `companyName`, `score`, `convertedAccountId`

### 2.4 Sales Pipeline (Configurable per tenant)

> Inspired by: Pipedrive multi-pipeline, Salesforce Sales Process

```
SalesPipeline {
  id: uuid PK
  tenantId: string(36)
  name: string(100)                // e.g., "Enterprise Sales", "SMB Quick Deal"
  description: text nullable
  isDefault: boolean default false // One default per tenant
  isActive: boolean default true
  sortOrder: int default 0
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

### 2.5 Pipeline Stage (Configurable stages per pipeline)

> Inspired by: Salesforce OpportunityStage, Pipedrive Stage, Dynamics 365 BPF

```
PipelineStage {
  id: uuid PK
  tenantId: string(36)
  pipelineId: uuid FK → SalesPipeline
  
  name: string(100)                // e.g., "Prospecting", "Qualification", "Proposal"
  description: text nullable
  sortOrder: int                   // Display order in pipeline
  
  // Pipeline mechanics
  defaultProbability: int          // 0-100, default probability when entering stage
  forecastCategory: ForecastCategory  // PIPELINE | BEST_CASE | COMMIT | OMITTED
  isClosed: boolean default false  // Is this a terminal stage?
  isWon: boolean default false     // Is this a "won" stage? (only if isClosed)
  
  // Stage requirements (guided selling)
  requiredFields: string[] default []  // Field names required before advancing
  checklist: jsonb default []      // [{ label, required }] items to complete at this stage
  
  // Automation
  daysExpected: int nullable       // Expected days in this stage (for rotting alert)
  autoActions: jsonb default []    // Actions triggered on stage entry
  
  color: string(7) nullable       // Hex color for pipeline visualization
  isActive: boolean default true
  
  createdAt, updatedAt: timestamp
}
```

**Indexes**: `pipelineId`, `tenantId, pipelineId, sortOrder (UNIQUE)`

### 2.6 Opportunity (Enhanced — Core Sales Object)

> Inspired by: Salesforce Opportunity, Pipedrive Deal, HubSpot Deal, Close Deal

```
Opportunity {
  id: uuid PK
  tenantId: string(36)
  code: string UNIQUE              // OPP-YYYY-NNN (keep existing pattern)
  
  // Core details
  name: string(200)
  description: text nullable
  
  // Pipeline & stage
  pipelineId: uuid FK → SalesPipeline
  stageId: uuid FK → PipelineStage  // Current stage (replaces both status & stage enums)
  stageChangedAt: timestamp        // When stage last changed
  
  // Deal status (separate from stage, inspired by Close CRM)
  status: OpportunityStatus        // OPEN | WON | LOST | CONVERTED | ON_HOLD
  lostReason: string(500) nullable // Required when status = LOST
  
  // Financials
  estimatedValue: decimal(15,2) default 0
  weightedValue: decimal(15,2) default 0  // = estimatedValue × (probability / 100)
  probability: int                 // 0-100, defaults from stage but overridable
  currency: string(3) default 'USD'
  
  // Dates
  expectedCloseDate: date nullable
  actualCloseDate: date nullable
  pushCount: int default 0        // Times close date was pushed (Salesforce pattern)
  
  // Relationships
  accountId: uuid FK → Account nullable     // Company this deal is for
  primaryContactId: uuid FK → Contact nullable  // Main POC
  ownerId: uuid FK → User                   // Deal owner
  
  // Lead source tracking
  leadSource: LeadSource nullable  // How this opp originated
  sourceLeadId: uuid FK → Lead nullable  // Original lead (if converted)
  
  // Type & classification
  type: OpportunityType            // NEW_BUSINESS | EXISTING_BUSINESS | RENEWAL | EXPANSION | UPSELL
  priority: Priority               // LOW | MEDIUM | HIGH | CRITICAL
  tags: string[] default []
  
  // Deal health (inspired by Dynamics 365, Pipedrive)
  healthScore: int nullable        // 0-100, calculated by system
  healthStatus: DealHealth         // HEALTHY | AT_RISK | STALLED | CRITICAL
  lastActivityAt: timestamp nullable
  daysSinceLastActivity: int default 0  // Calculated, for rotting alerts
  daysInCurrentStage: int default 0     // Calculated
  
  // Forecasting (Salesforce forecast categories)
  forecastCategory: ForecastCategory  // PIPELINE | BEST_CASE | COMMIT | CLOSED | OMITTED
  
  // Conversion to project
  convertedProjectId: uuid FK → Project nullable
  convertedAt: timestamp nullable
  
  // Next steps (Salesforce pattern)
  nextStep: string(500) nullable
  nextStepDueDate: date nullable
  
  metadata: jsonb default {}
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Indexes**: `tenantId`, `accountId`, `ownerId`, `stageId`, `pipelineId`, `status`, `expectedCloseDate`, `healthStatus`, `forecastCategory`, `priority`, `tags (GIN)`, `metadata (GIN)`

### 2.7 Opportunity Stakeholder (Contact Roles on Deals)

> Inspired by: Salesforce OpportunityContactRole, Dynamics 365 Connection, Freshsales Stakeholder

```
OpportunityStakeholder {
  id: uuid PK
  opportunityId: uuid FK → Opportunity
  contactId: uuid FK → Contact
  
  role: StakeholderRole            // DECISION_MAKER | INFLUENCER | CHAMPION | BLOCKER | EVALUATOR | ECONOMIC_BUYER | TECHNICAL_BUYER | END_USER | LEGAL | PROCUREMENT
  influence: StakeholderInfluence  // HIGH | MEDIUM | LOW
  sentiment: StakeholderSentiment  // POSITIVE | NEUTRAL | NEGATIVE | UNKNOWN
  isPrimary: boolean default false // Primary contact on this deal
  
  notes: text nullable
  
  createdAt, updatedAt: timestamp
  
  UNIQUE(opportunityId, contactId)
}
```

### 2.8 Opportunity Team Member (Internal Team)

> Inspired by: Salesforce OpportunityTeamMember, Dynamics 365 Account Team

```
OpportunityTeamMember {
  id: uuid PK
  opportunityId: uuid FK → Opportunity
  userId: uuid FK → User
  
  role: TeamMemberRole             // OWNER | CO_OWNER | SALES_ENGINEER | SOLUTION_ARCHITECT | ACCOUNT_MANAGER | EXECUTIVE_SPONSOR | SUBJECT_MATTER_EXPERT
  
  createdAt: timestamp
  
  UNIQUE(opportunityId, userId)
}
```

### 2.9 Product Catalog

> Inspired by: Salesforce Product2 + Pricebook2, Freshsales CPQ

```
Product {
  id: uuid PK
  tenantId: string(36)
  code: string UNIQUE              // PROD-NNN
  name: string(200)
  description: text nullable
  
  category: ProductCategory        // SERVICE | PRODUCT | SUBSCRIPTION | LICENSE | CONSULTING | TRAINING | SUPPORT | OTHER
  family: string(100) nullable     // Product family grouping
  
  unitPrice: decimal(15,2) default 0
  currency: string(3) default 'USD'
  unit: string(50) default 'unit'  // unit, hour, month, license, etc.
  
  // Pricing flexibility
  isRecurring: boolean default false
  recurringInterval: RecurringInterval nullable  // MONTHLY | QUARTERLY | ANNUALLY
  minQuantity: int default 1
  maxDiscount: decimal(5,2) default 0  // Max allowed discount %
  
  isActive: boolean default true
  metadata: jsonb default {}
  
  createdAt, updatedAt: timestamp
}
```

### 2.10 Opportunity Line Item (Products on Deals)

> Inspired by: Salesforce OpportunityLineItem, Freshsales CPQ

```
OpportunityLineItem {
  id: uuid PK
  opportunityId: uuid FK → Opportunity
  productId: uuid FK → Product nullable  // nullable for custom line items
  
  name: string(200)               // Auto-filled from product, editable
  description: text nullable
  
  quantity: decimal(10,2) default 1
  unitPrice: decimal(15,2)
  discount: decimal(5,2) default 0  // Discount %
  totalPrice: decimal(15,2)        // = quantity × unitPrice × (1 - discount/100)
  
  // Scheduling
  serviceStartDate: date nullable
  serviceEndDate: date nullable
  
  sortOrder: int default 0
  
  createdAt, updatedAt: timestamp
}
```

### 2.11 Quote

> Inspired by: Salesforce Quote, Freshsales CPQ, HubSpot Quote

```
Quote {
  id: uuid PK
  tenantId: string(36)
  code: string UNIQUE              // QUO-YYYY-NNN
  
  opportunityId: uuid FK → Opportunity
  accountId: uuid FK → Account nullable
  contactId: uuid FK → Contact nullable  // Recipient
  
  // Status
  status: QuoteStatus              // DRAFT | PENDING_APPROVAL | APPROVED | SENT | VIEWED | ACCEPTED | REJECTED | EXPIRED
  
  // Financials
  subtotal: decimal(15,2) default 0
  discountAmount: decimal(15,2) default 0
  taxAmount: decimal(15,2) default 0
  totalAmount: decimal(15,2) default 0
  currency: string(3) default 'USD'
  
  // Dates
  issueDate: date
  expirationDate: date
  acceptedAt: timestamp nullable
  
  // Sync with opportunity
  isSynced: boolean default false  // Primary quote synced to opportunity
  
  // Approval
  approvedBy: uuid FK → User nullable
  approvedAt: timestamp nullable
  rejectionReason: text nullable
  
  // Content
  terms: text nullable             // Terms & conditions
  notes: text nullable             // Internal notes
  customerNotes: text nullable     // Notes visible to customer
  
  preparedBy: uuid FK → User
  metadata: jsonb default {}
  
  createdAt, updatedAt: timestamp
}
```

### 2.12 Quote Line Item

```
QuoteLineItem {
  id: uuid PK
  quoteId: uuid FK → Quote
  productId: uuid FK → Product nullable
  
  name: string(200)
  description: text nullable
  
  quantity: decimal(10,2) default 1
  unitPrice: decimal(15,2)
  discount: decimal(5,2) default 0
  totalPrice: decimal(15,2)
  
  sortOrder: int default 0
  
  createdAt, updatedAt: timestamp
}
```

### 2.13 Activity (Unified Activity Log)

> Inspired by: Salesforce Task/Event, HubSpot Timeline, Pipedrive Activity, Close Activity Log

```
Activity {
  id: uuid PK
  tenantId: string(36)
  
  // Activity type
  type: ActivityType               // CALL | EMAIL | MEETING | NOTE | TASK | DOCUMENT | STAGE_CHANGE | STATUS_CHANGE | SYSTEM
  subtype: string(50) nullable     // e.g., "outbound_call", "follow_up_email"
  
  // What this activity is about
  subject: string(500)
  description: text nullable
  
  // Polymorphic associations (at least one required)
  opportunityId: uuid FK → Opportunity nullable
  accountId: uuid FK → Account nullable
  contactId: uuid FK → Contact nullable
  leadId: uuid FK → Lead nullable
  quoteId: uuid FK → Quote nullable
  
  // Task-specific fields
  status: ActivityStatus nullable  // PLANNED | IN_PROGRESS | COMPLETED | CANCELLED
  priority: Priority nullable
  dueDate: timestamp nullable
  completedAt: timestamp nullable
  
  // Meeting-specific fields
  startTime: timestamp nullable
  endTime: timestamp nullable
  location: string(500) nullable
  
  // Call-specific fields
  duration: int nullable           // Duration in seconds
  outcome: string(100) nullable    // connected, voicemail, no_answer, etc.
  
  // Assignment
  assignedToId: uuid FK → User nullable
  
  // Tracking
  isAutomated: boolean default false  // System-generated vs user-created
  
  metadata: jsonb default {}       // Flexible data (email tracking, meeting attendees, etc.)
  
  createdBy: uuid FK → User
  createdAt: timestamp
  // NO updatedAt — activities are APPEND-ONLY (immutable audit trail)
}
```

**Indexes**: `tenantId`, `opportunityId`, `accountId`, `contactId`, `leadId`, `type`, `assignedToId`, `dueDate`, `createdAt`

### 2.14 Competitor (on Deals)

> Inspired by: Salesforce OpportunityCompetitor

```
OpportunityCompetitor {
  id: uuid PK
  opportunityId: uuid FK → Opportunity
  
  competitorName: string(200)      // Free-text or linked to Account
  competitorAccountId: uuid FK → Account nullable  // Optional link
  
  strengths: text nullable
  weaknesses: text nullable
  threatLevel: ThreatLevel         // LOW | MEDIUM | HIGH
  status: CompetitorStatus         // ACTIVE | WON_AGAINST | LOST_TO | WITHDRAWN
  
  notes: text nullable
  
  createdAt, updatedAt: timestamp
}
```

---

## 3. Enum Definitions

```typescript
// Account
enum AccountType { PROSPECT, CUSTOMER, PARTNER, COMPETITOR, VENDOR, OTHER }
enum AccountTier { ENTERPRISE, MID_MARKET, SMB, STARTUP }

// Contact
enum ContactChannel { EMAIL, PHONE, IN_PERSON, VIDEO }
enum ContactType { PRIMARY, BILLING, TECHNICAL, EXECUTIVE, OTHER }
enum ContactInfluence { DECISION_MAKER, INFLUENCER, CHAMPION, BLOCKER, END_USER, EVALUATOR, ECONOMIC_BUYER }

// Lead
enum LeadStatus { NEW, CONTACTED, ENGAGED, QUALIFIED, UNQUALIFIED, CONVERTED }
enum LeadSource { WEB_FORM, REFERRAL, EVENT, COLD_OUTREACH, PARTNER, SOCIAL, AD_CAMPAIGN, INBOUND_CALL, OTHER }
enum LeadRating { HOT, WARM, COLD }

// Opportunity
enum OpportunityStatus { OPEN, WON, LOST, CONVERTED, ON_HOLD }
enum OpportunityType { NEW_BUSINESS, EXISTING_BUSINESS, RENEWAL, EXPANSION, UPSELL }
enum DealHealth { HEALTHY, AT_RISK, STALLED, CRITICAL }
enum ForecastCategory { PIPELINE, BEST_CASE, COMMIT, CLOSED, OMITTED }

// Pipeline Stage
// (No enum — stages are configurable per pipeline via PipelineStage entity)

// Stakeholder
enum StakeholderRole { DECISION_MAKER, INFLUENCER, CHAMPION, BLOCKER, EVALUATOR, ECONOMIC_BUYER, TECHNICAL_BUYER, END_USER, LEGAL, PROCUREMENT }
enum StakeholderInfluence { HIGH, MEDIUM, LOW }
enum StakeholderSentiment { POSITIVE, NEUTRAL, NEGATIVE, UNKNOWN }

// Team Member
enum TeamMemberRole { OWNER, CO_OWNER, SALES_ENGINEER, SOLUTION_ARCHITECT, ACCOUNT_MANAGER, EXECUTIVE_SPONSOR, SUBJECT_MATTER_EXPERT }

// Product
enum ProductCategory { SERVICE, PRODUCT, SUBSCRIPTION, LICENSE, CONSULTING, TRAINING, SUPPORT, OTHER }
enum RecurringInterval { MONTHLY, QUARTERLY, ANNUALLY }

// Quote
enum QuoteStatus { DRAFT, PENDING_APPROVAL, APPROVED, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED }

// Activity
enum ActivityType { CALL, EMAIL, MEETING, NOTE, TASK, DOCUMENT, STAGE_CHANGE, STATUS_CHANGE, SYSTEM }
enum ActivityStatus { PLANNED, IN_PROGRESS, COMPLETED, CANCELLED }

// Competitor
enum ThreatLevel { LOW, MEDIUM, HIGH }
enum CompetitorStatus { ACTIVE, WON_AGAINST, LOST_TO, WITHDRAWN }

// Shared (reuse from existing enums)
enum Priority { LOW, MEDIUM, HIGH, CRITICAL }
```

---

## 4. API Endpoints Design

### 4.1 Accounts
```
GET    /api/v1/accounts                         List accounts (paginated, searchable)
POST   /api/v1/accounts                         Create account
GET    /api/v1/accounts/:id                     Get account detail
PATCH  /api/v1/accounts/:id                     Update account
DELETE /api/v1/accounts/:id                     Soft delete (isActive=false)
GET    /api/v1/accounts/:id/contacts            List contacts for account
GET    /api/v1/accounts/:id/opportunities       List opportunities for account
GET    /api/v1/accounts/:id/activities          Activity timeline for account
GET    /api/v1/accounts/:id/hierarchy           Account hierarchy (parent/children)
```

### 4.2 Contacts
```
GET    /api/v1/contacts                         List contacts (paginated)
POST   /api/v1/contacts                         Create contact
GET    /api/v1/contacts/:id                     Get contact detail
PATCH  /api/v1/contacts/:id                     Update contact
DELETE /api/v1/contacts/:id                     Soft delete
GET    /api/v1/contacts/:id/activities          Activity timeline for contact
GET    /api/v1/contacts/:id/opportunities       Opportunities where contact is stakeholder
```

### 4.3 Leads
```
GET    /api/v1/leads                            List leads (paginated)
POST   /api/v1/leads                            Create lead
GET    /api/v1/leads/:id                        Get lead detail
PATCH  /api/v1/leads/:id                        Update lead
DELETE /api/v1/leads/:id                        Soft delete
POST   /api/v1/leads/:id/convert               Convert lead → Account + Contact + Opportunity
POST   /api/v1/leads/:id/qualify               Quick qualify (status → QUALIFIED)
POST   /api/v1/leads/:id/disqualify            Disqualify lead
GET    /api/v1/leads/stats                      Lead stats (by status, source, rating)
```

### 4.4 Pipelines & Stages
```
GET    /api/v1/pipelines                        List pipelines
POST   /api/v1/pipelines                        Create pipeline
GET    /api/v1/pipelines/:id                    Get pipeline with stages
PATCH  /api/v1/pipelines/:id                    Update pipeline
DELETE /api/v1/pipelines/:id                    Deactivate pipeline
POST   /api/v1/pipelines/:id/stages             Add stage
PATCH  /api/v1/pipelines/:id/stages/:stageId    Update stage
DELETE /api/v1/pipelines/:id/stages/:stageId    Remove stage
PATCH  /api/v1/pipelines/:id/stages/reorder     Reorder stages
```

### 4.5 Opportunities (Enhanced)
```
GET    /api/v1/opportunities                    List (enhanced filters: pipeline, stage, owner, account, health, forecast, date range, value range)
POST   /api/v1/opportunities                    Create
GET    /api/v1/opportunities/:id                Get detail (with stakeholders, team, line items, activities)
PATCH  /api/v1/opportunities/:id                Update
DELETE /api/v1/opportunities/:id                Soft delete
PATCH  /api/v1/opportunities/:id/stage          Advance/change stage (validates requirements, logs activity)
PATCH  /api/v1/opportunities/:id/status         Change status (win/lose/hold)
POST   /api/v1/opportunities/:id/convert        Convert to project (enhanced)

# Stakeholders
GET    /api/v1/opportunities/:id/stakeholders   List stakeholders
POST   /api/v1/opportunities/:id/stakeholders   Add stakeholder
PATCH  /api/v1/opportunities/:id/stakeholders/:sid  Update stakeholder role/sentiment
DELETE /api/v1/opportunities/:id/stakeholders/:sid  Remove stakeholder

# Team
GET    /api/v1/opportunities/:id/team           List team members
POST   /api/v1/opportunities/:id/team           Add team member
DELETE /api/v1/opportunities/:id/team/:tmid     Remove team member

# Line Items
GET    /api/v1/opportunities/:id/line-items     List line items
POST   /api/v1/opportunities/:id/line-items     Add line item
PATCH  /api/v1/opportunities/:id/line-items/:liid  Update line item
DELETE /api/v1/opportunities/:id/line-items/:liid  Remove line item

# Competitors
GET    /api/v1/opportunities/:id/competitors    List competitors
POST   /api/v1/opportunities/:id/competitors    Add competitor
PATCH  /api/v1/opportunities/:id/competitors/:cid  Update competitor
DELETE /api/v1/opportunities/:id/competitors/:cid  Remove competitor

# Activities
GET    /api/v1/opportunities/:id/activities     Activity timeline
POST   /api/v1/opportunities/:id/activities     Log activity

# Analytics
GET    /api/v1/opportunities/pipeline-summary   Pipeline summary (by stage, values, counts)
GET    /api/v1/opportunities/forecast            Forecast by category and period
GET    /api/v1/opportunities/health-overview     Deal health distribution
GET    /api/v1/opportunities/win-loss-analysis   Win/loss metrics
GET    /api/v1/opportunities/sales-cycle         Sales cycle analytics (avg days per stage)
```

### 4.6 Products
```
GET    /api/v1/products                         List products
POST   /api/v1/products                         Create product
GET    /api/v1/products/:id                     Get product detail
PATCH  /api/v1/products/:id                     Update product
DELETE /api/v1/products/:id                     Deactivate product
```

### 4.7 Quotes
```
GET    /api/v1/quotes                           List quotes
POST   /api/v1/quotes                           Create quote (from opportunity)
GET    /api/v1/quotes/:id                       Get quote detail
PATCH  /api/v1/quotes/:id                       Update quote
DELETE /api/v1/quotes/:id                       Delete draft quote
POST   /api/v1/quotes/:id/submit-for-approval   Submit for approval
POST   /api/v1/quotes/:id/approve              Approve quote
POST   /api/v1/quotes/:id/reject               Reject quote
POST   /api/v1/quotes/:id/send                 Mark as sent
POST   /api/v1/quotes/:id/sync                 Sync to opportunity (set as primary)
GET    /api/v1/quotes/:id/line-items            List line items
POST   /api/v1/quotes/:id/line-items            Add line item
PATCH  /api/v1/quotes/:id/line-items/:liid      Update line item
DELETE /api/v1/quotes/:id/line-items/:liid      Remove line item
```

### 4.8 Activities
```
GET    /api/v1/activities                       List activities (global, filtered)
POST   /api/v1/activities                       Create activity
GET    /api/v1/activities/:id                   Get activity detail
GET    /api/v1/activities/upcoming              Upcoming tasks/meetings for current user
GET    /api/v1/activities/overdue               Overdue tasks for current user
```

---

## 5. Business Logic & Automation

### 5.1 Deal Health Engine (inspired by Dynamics 365 + Pipedrive)

```
Deal Health Score (0-100), calculated automatically:

Factors:
+25  Recent activity (activity within last 7 days)
+20  Stakeholder coverage (at least 1 DECISION_MAKER identified)
+15  Next step defined (nextStep field populated)
+15  Close date is in future (not overdue)
+10  Has line items / estimated value
+10  Contact engagement (multiple contacts engaged)
+5   Quote sent or accepted

Penalties:
-20  No activity in 14+ days
-15  Close date in past
-10  No stakeholders defined
-10  Stage > expected days (rotting)
-5   Close date pushed 2+ times

Health Status:
HEALTHY  = score >= 70
AT_RISK  = score 40-69
STALLED  = score 20-39
CRITICAL = score < 20
```

**Trigger events**: Activity logged, stage changed, close date updated, stakeholder added/removed. Runs as a service method called by opportunity update hooks.

### 5.2 Stage Change Logic

When an opportunity stage changes:
1. **Validate required fields** (from `PipelineStage.requiredFields`)
2. **Auto-set probability** (from `PipelineStage.defaultProbability`) unless manually overridden
3. **Auto-set forecastCategory** (from `PipelineStage.forecastCategory`)
4. **Calculate weightedValue** = estimatedValue × (probability / 100)
5. **Log Activity** (type: STAGE_CHANGE, automated)
6. **Update stageChangedAt**, reset `daysInCurrentStage`
7. **Check terminal stage** (isClosed/isWon) → auto-set status
8. If marking WON: require `actualCloseDate`, set status=WON
9. If marking LOST: require `lostReason`, set status=LOST

### 5.3 Lead Conversion Logic

When converting a lead:
1. **Create Account** (from lead company fields) — or match existing by name
2. **Create Contact** (from lead person fields) — linked to account
3. **Create Opportunity** (optional) — set `sourceLeadId`, inherit lead source/budget
4. **Update Lead**: status=CONVERTED, set converted* fields
5. **Log Activity** on lead (SYSTEM type: "Lead converted")
6. Lead becomes read-only after conversion

### 5.4 Opportunity → Project Conversion (Enhanced)

When converting a WON opportunity to a project:
1. **Create Project** with:
   - Budget from opportunity estimated value (or line items total)
   - Description from opportunity description
   - Metadata link to opportunity
2. **Map stakeholders → project contacts** (carry forward contact info)
3. **Map team members → project members** (carry forward team assignments)
4. **Copy activities** (reference, not duplicate — link via metadata)
5. **Update Opportunity**: status=CONVERTED, convertedProjectId, convertedAt
6. **Log Activity** (SYSTEM: "Converted to project {code}")

### 5.5 Deal Rotting Detection (Pipedrive-inspired)

Scheduled job (daily or on activity check):
- Compare `daysInCurrentStage` against `PipelineStage.daysExpected`
- If exceeded: flag deal health, create notification
- If no activity in 14+ days: auto-create reminder task for owner

### 5.6 Weighted Pipeline Forecasting

```
Forecast calculation per period (month/quarter):

For each opportunity in the period:
  weightedValue = estimatedValue × (probability / 100)

Group by forecastCategory:
  PIPELINE:   Sum of weighted values where forecastCategory = PIPELINE
  BEST_CASE:  Sum of weighted values where forecastCategory = BEST_CASE
  COMMIT:     Sum of weighted values where forecastCategory = COMMIT
  CLOSED:     Sum of actual closed-won amount

Rollup by: Owner → Team → Organization
Period grouping: by expectedCloseDate into fiscal months/quarters
```

### 5.7 Close Date Push Tracking

When `expectedCloseDate` is updated:
- If new date > old date by 30+ days: increment `pushCount`
- Log Activity (SYSTEM: "Close date pushed from {old} to {new}")
- Apply health score penalty if pushCount > 1

---

## 5A. Activity Tracking — Deep Dive

> Inspired by: Salesforce Task/Event + Einstein Activity Capture, HubSpot Timeline + Sequences, Pipedrive Activity-Based Selling, Close Built-In Communication

### 5A.1 Activity Philosophy

Pipedrive's core insight: **deals close when activities close**. Activity tracking isn't a passive log — it's the primary driver of sales execution. Every deal should always have a "next activity" scheduled. If it doesn't, the deal is rotting.

**Core principles:**
1. **Every deal has a next scheduled activity** — the system enforces this
2. **Activities are append-only** — immutable audit trail (same pattern as `InventoryTransaction`)
3. **Auto-logging reduces rep friction** — system events are captured without manual entry
4. **Activity metrics drive coaching** — reps are measured on activity volume and quality, not just outcomes

### 5A.2 Activity Types — Detailed Specifications

#### 5A.2.1 Call Logging

```
Activity (type = CALL) {
  // Base fields from Activity entity
  subject: "Call with {contactName}"         // Auto-generated or manual
  
  // Call-specific fields (in metadata JSONB)
  metadata: {
    direction: "OUTBOUND" | "INBOUND",       // Call direction
    phoneNumber: "+1234567890",              // Number dialed/received
    contactPhone: "mobile" | "office" | "other",  // Which phone was used
    
    // Outcome tracking
    outcome: "CONNECTED" | "VOICEMAIL" | "NO_ANSWER" | "BUSY" | "WRONG_NUMBER" | "LEFT_MESSAGE" | "GATEKEEPER",
    disposition: string,                      // Free-form call result summary
    
    // Timing
    duration: 180,                            // Seconds (manual entry or timer)
    scheduledDuration: 300,                   // Originally planned duration
    
    // Follow-up
    followUpRequired: true,
    followUpType: "CALL" | "EMAIL" | "MEETING",
    followUpDate: "2026-04-03T10:00:00Z",    // Creates new planned Activity
    followUpNotes: "Discuss pricing with CFO",
    
    // Participants
    participants: [
      { contactId: "uuid", name: "Jane Smith", role: "DECISION_MAKER" }
    ],
    
    // Sentiment (manual or future AI)
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE",
    keyTopics: ["pricing", "timeline", "competition"]
  }
}
```

**Auto-behaviors on call logging:**
- Update `Contact.lastContactedAt` and `Opportunity.lastActivityAt`
- If outcome = CONNECTED: positive health score impact
- If outcome = NO_ANSWER/BUSY: no impact (but tracks attempt)
- If `followUpRequired = true`: auto-create planned CALL/EMAIL/MEETING activity
- Recalculate deal health score

#### 5A.2.2 Email Tracking

```
Activity (type = EMAIL) {
  subject: "Email: {emailSubject}"
  
  metadata: {
    direction: "SENT" | "RECEIVED",
    
    // Recipients
    to: [{ email: "jane@acme.com", contactId: "uuid", name: "Jane Smith" }],
    cc: [{ email: "bob@acme.com", contactId: "uuid", name: "Bob Jones" }],
    
    // Content
    emailSubject: "Proposal for Project Alpha",
    bodyPreview: "First 200 chars of email body...",   // Not full body for privacy
    templateId: "uuid" | null,                          // If sent from template
    templateName: "Initial Proposal",
    
    // Tracking (future enhancement)
    opened: false,
    openedAt: null,
    openCount: 0,
    linkClicks: [],
    
    // Attachments
    attachments: [
      { name: "Proposal_v2.pdf", size: 245000, type: "application/pdf" }
    ],
    
    // Thread
    threadId: "email-thread-123",              // Group related emails
    isReply: false,
    parentActivityId: "uuid" | null,           // Links to previous email in thread
    
    // Follow-up
    followUpRequired: true,
    followUpDate: "2026-04-05T09:00:00Z",
    followUpNotes: "Follow up if no response by Friday"
  }
}
```

**Auto-behaviors on email logging:**
- Update `Contact.lastContactedAt` for all recipients
- Update `Opportunity.lastActivityAt`
- If `followUpRequired`: create planned TASK activity for follow-up
- Track email threads (group by `threadId`)

#### 5A.2.3 Meeting Tracking

```
Activity (type = MEETING) {
  subject: "Meeting: {meetingTitle}"
  startTime: "2026-04-02T14:00:00Z",
  endTime: "2026-04-02T15:00:00Z",
  location: "Teams Call / Office Room 301 / Client Site",
  
  metadata: {
    meetingType: "DISCOVERY" | "DEMO" | "PROPOSAL_REVIEW" | "NEGOTIATION" | "TECHNICAL_REVIEW" | "EXECUTIVE_BRIEFING" | "CHECK_IN" | "ONBOARDING" | "OTHER",
    
    // Attendees
    internalAttendees: [
      { userId: "uuid", name: "Sales Rep", role: "PRESENTER" }
    ],
    externalAttendees: [
      { contactId: "uuid", name: "Jane Smith", email: "jane@acme.com", role: "DECISION_MAKER", attended: true }
    ],
    
    // Virtual meeting
    meetingLink: "https://teams.microsoft.com/...",
    isVirtual: true,
    
    // Agenda & Notes
    agenda: "1. Review proposal\n2. Discuss timeline\n3. Address technical concerns",
    meetingNotes: "Client was receptive to pricing. Key concern: implementation timeline...",
    
    // Outcomes
    outcome: "COMPLETED" | "NO_SHOW" | "RESCHEDULED" | "CANCELLED",
    actionItems: [
      { description: "Send revised timeline", assignedTo: "uuid", dueDate: "2026-04-04" },
      { description: "Schedule follow-up with CTO", assignedTo: "uuid", dueDate: "2026-04-07" }
    ],
    
    // Follow-up
    nextMeetingDate: "2026-04-10T14:00:00Z",
    nextMeetingPurpose: "Technical deep-dive with CTO",
    
    // Recurring
    isRecurring: false,
    recurrencePattern: null                    // "WEEKLY" | "BIWEEKLY" | "MONTHLY"
  }
}
```

**Auto-behaviors on meeting logging:**
- If `actionItems` present: auto-create TASK activities for each, assigned to specified users
- If `nextMeetingDate` set: auto-create planned MEETING activity
- If `outcome = NO_SHOW`: negative health score impact; create follow-up task
- If `outcome = RESCHEDULED`: update the meeting, no health penalty
- Update attendance tracking on contacts

#### 5A.2.4 Note Logging

```
Activity (type = NOTE) {
  subject: "Note on {opportunityName}",
  description: "Full note content — rich text supported (markdown)",
  
  metadata: {
    noteType: "GENERAL" | "INTERNAL_UPDATE" | "CLIENT_FEEDBACK" | "COMPETITIVE_INTEL" | "RISK_FLAG" | "WIN_STRATEGY",
    isPinned: false,                           // Pinned notes appear at top of timeline
    mentions: ["uuid1", "uuid2"],              // @mentioned team members (triggers notification)
    tags: ["pricing", "objection", "technical"]
  }
}
```

#### 5A.2.5 System-Generated Activities (Auto-Logged)

The following events automatically create Activity records (isAutomated = true):

| Trigger Event | Activity Type | Subject Template |
|--------------|--------------|-----------------|
| Stage changed | STAGE_CHANGE | "Stage changed from {old} to {new}" |
| Status changed (won/lost/hold) | STATUS_CHANGE | "Deal marked as {status}" |
| Close date pushed | SYSTEM | "Close date pushed from {old} to {new}" |
| Stakeholder added | SYSTEM | "Added {contactName} as {role}" |
| Quote created | SYSTEM | "Quote {code} created (${amount})" |
| Quote sent | SYSTEM | "Quote {code} sent to {contactName}" |
| Quote accepted/rejected | SYSTEM | "Quote {code} {accepted/rejected}" |
| Deal assigned/reassigned | SYSTEM | "Deal reassigned from {old} to {new}" |
| Lead converted | SYSTEM | "Lead converted to Opportunity" |
| Competitor added | SYSTEM | "Competitor {name} added" |
| Line item changed | SYSTEM | "Deal value updated: ${old} → ${new}" |

### 5A.3 Activity Templates

> Inspired by: HubSpot Playbooks, Close Workflows

Pre-defined templates that reduce manual entry friction:

```
ActivityTemplate {
  id: uuid PK
  tenantId: string(36)
  
  name: string(100)                // "Discovery Call", "Follow-Up Email", "Proposal Meeting"
  type: ActivityType               // CALL, EMAIL, MEETING, TASK
  
  // Pre-filled content
  subjectTemplate: string(500)     // "Discovery call with {{contactName}} at {{accountName}}"
  descriptionTemplate: text nullable  // With merge variables
  defaultDuration: int nullable    // Minutes (for calls/meetings)
  
  // Default metadata values
  defaultMetadata: jsonb           // Pre-filled metadata fields per type
  
  // Scheduling
  defaultTimeOfDay: string nullable  // "09:00" — preferred time
  defaultDaysFromNow: int default 1  // When to schedule
  
  // Template context
  applicableStages: uuid[] default []  // Pipeline stages where this template is relevant
  category: string(50) nullable    // "discovery", "closing", "follow_up", "onboarding"
  
  isActive: boolean default true
  sortOrder: int default 0
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Merge variables for templates:**
- `{{contactName}}`, `{{contactFirstName}}`, `{{contactEmail}}`
- `{{accountName}}`, `{{accountIndustry}}`
- `{{opportunityName}}`, `{{opportunityValue}}`, `{{opportunityStage}}`
- `{{ownerName}}`, `{{ownerEmail}}`
- `{{todayDate}}`, `{{nextWeekDate}}`

**Example templates (seeded per tenant):**

| Template | Type | Subject | Default Duration |
|----------|------|---------|-----------------|
| Discovery Call | CALL | "Discovery: {{accountName}}" | 30 min |
| Demo Meeting | MEETING | "Demo for {{contactName}} at {{accountName}}" | 60 min |
| Proposal Follow-Up | EMAIL | "Following up on our proposal — {{accountName}}" | — |
| Technical Review | MEETING | "Technical Review: {{opportunityName}}" | 90 min |
| Check-In Call | CALL | "Check-in: {{contactFirstName}}" | 15 min |
| Pricing Discussion | MEETING | "Pricing discussion — {{accountName}}" | 45 min |
| Contract Review Task | TASK | "Review contract for {{opportunityName}}" | — |
| Post-Meeting Notes | NOTE | "Notes: {{lastMeetingSubject}}" | — |

### 5A.4 Activity Sequences (Multi-Step Follow-Up Plans)

> Inspired by: HubSpot Sequences, Freshsales Sales Sequences, Close Workflows

A sequence is a series of pre-planned activities executed in order, with configurable delays between steps. This is the most powerful automation for multi-stakeholder, complex B2B deals.

```
ActivitySequence {
  id: uuid PK
  tenantId: string(36)
  
  name: string(100)                // "New Enterprise Lead Outreach", "Post-Demo Follow-Up"
  description: text nullable
  
  // Targeting
  triggerType: SequenceTrigger     // MANUAL | ON_STAGE_ENTER | ON_LEAD_STATUS | ON_DEAL_CREATE
  triggerStageId: uuid nullable    // If triggerType = ON_STAGE_ENTER
  triggerLeadStatus: LeadStatus nullable
  
  // Sequence config
  stopOnReply: boolean default true    // Stop sequence if contact replies
  stopOnStageChange: boolean default false
  stopOnDealWon: boolean default true
  stopOnDealLost: boolean default true
  
  isActive: boolean default true
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}

ActivitySequenceStep {
  id: uuid PK
  sequenceId: uuid FK → ActivitySequence
  
  stepNumber: int                  // Execution order (1, 2, 3...)
  
  // Action
  activityType: ActivityType       // CALL, EMAIL, TASK, MEETING (not SYSTEM types)
  templateId: uuid FK → ActivityTemplate nullable  // Use template or custom
  
  // Custom content (if no template)
  subject: string(500) nullable
  description: text nullable
  defaultMetadata: jsonb default {}
  
  // Timing
  delayDays: int default 0         // Days to wait after previous step completes
  delayHours: int default 0        // Hours offset within the day
  preferredTime: string nullable   // "09:00" — schedule for this time
  
  // Conditions
  skipIfCondition: jsonb nullable  // e.g., { "field": "opportunity.stage", "op": "eq", "value": "NEGOTIATION" }
  
  isRequired: boolean default true // If false, step can be skipped by rep
  
  createdAt, updatedAt: timestamp
}
```

**Sequence Execution Engine:**

```
SequenceEnrollment {
  id: uuid PK
  sequenceId: uuid FK → ActivitySequence
  
  // What's enrolled
  opportunityId: uuid FK → Opportunity nullable
  leadId: uuid FK → Lead nullable
  contactId: uuid FK → Contact nullable
  
  // Progress
  currentStepNumber: int default 1
  status: EnrollmentStatus         // ACTIVE | PAUSED | COMPLETED | STOPPED | FAILED
  stoppedReason: string nullable   // "contact_replied", "deal_won", "manual_stop"
  
  // Tracking
  enrolledBy: uuid FK → User
  enrolledAt: timestamp
  completedAt: timestamp nullable
  lastStepExecutedAt: timestamp nullable
  nextStepDueAt: timestamp nullable
  
  createdAt: timestamp
}
```

**Example sequences:**

**Sequence: "New Enterprise Outreach"** (trigger: manual enrollment)
| Step | Day | Type | Action |
|------|-----|------|--------|
| 1 | 0 | EMAIL | Send intro email (template: Intro Outreach) |
| 2 | 2 | CALL | Follow-up call (template: Discovery Call) |
| 3 | 3 | EMAIL | Send case study if no answer (template: Value Prop) |
| 4 | 5 | CALL | Second call attempt |
| 5 | 7 | EMAIL | Breakup email if no response (template: Final Follow-Up) |
| 6 | 10 | TASK | Review — qualify or disqualify lead |

**Sequence: "Post-Demo Follow-Up"** (trigger: stage enters "Demo Completed")
| Step | Day | Type | Action |
|------|-----|------|--------|
| 1 | 0 | EMAIL | Send demo recap + recording link |
| 2 | 1 | TASK | Send tailored proposal |
| 3 | 3 | CALL | Check-in call — address questions |
| 4 | 5 | EMAIL | Share customer success story |
| 5 | 7 | MEETING | Schedule proposal review meeting |

**Sequence execution rules:**
1. Scheduler runs every hour, checks `nextStepDueAt` against current time
2. When step is due: create the Activity record as PLANNED, assign to deal owner
3. Rep completes the activity → engine advances to next step, calculates `nextStepDueAt`
4. If `stopOnReply` and contact responds (EMAIL type): enrollment status → STOPPED
5. If step is `isRequired = false` and rep skips it: advance to next step
6. If all steps complete: enrollment status → COMPLETED

### 5A.5 Activity Reminders & Follow-Up System

> Inspired by: Pipedrive "Never forget a follow-up", Close task management

**Automatic Reminder Generation:**

| Trigger | Reminder Created | Due Date |
|---------|-----------------|----------|
| Call logged with `followUpRequired` | TASK: "Follow up on call with {contact}" | `followUpDate` from call |
| Email sent with `followUpRequired` | TASK: "Follow up on email to {contact}" | `followUpDate` from email |
| Meeting with action items | TASK per action item | `dueDate` per action item |
| Meeting with `nextMeetingDate` | MEETING: "{nextMeetingPurpose}" | `nextMeetingDate` |
| Deal with no next activity | TASK: "Schedule next activity for {opportunity}" | Tomorrow |
| Overdue task | SYSTEM notification | Immediately |
| Task due today | SYSTEM notification | Morning of due date |
| Task due tomorrow | SYSTEM notification | Evening before |

**Reminder Delivery Channels:**
1. **In-app notification badge** (via existing notifications module) — always on
2. **Dashboard "Today's Tasks" widget** — shows all due/overdue activities for current user
3. **Pipeline board visual cues** — cards without next activity get warning dot

**"No Activity" Enforcement:**
- After completing any activity on a deal, the system prompts: "Schedule next activity?"
- If rep dismisses, after 24h: auto-create TASK "Schedule follow-up for {deal}"
- If rep ignores for 48h: notify deal owner's manager (if exists)
- Configurable per pipeline (some pipelines don't need strict enforcement)

### 5A.6 Activity Metrics & Analytics

**Per-Rep Metrics (coaching dashboard):**

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total activities this week/month | COUNT(activities WHERE createdBy = user AND period) | Number + sparkline trend |
| Calls made | COUNT(type=CALL AND direction=OUTBOUND) | Number + daily breakdown |
| Emails sent | COUNT(type=EMAIL AND direction=SENT) | Number |
| Meetings held | COUNT(type=MEETING AND outcome=COMPLETED) | Number |
| Avg calls per deal | AVG(call count per active opportunity) | Number |
| Connect rate | CONNECTED calls / total OUTBOUND calls | Percentage |
| Avg call duration | AVG(duration WHERE outcome=CONNECTED) | Minutes |
| Response time | AVG(time from inbound activity to rep's first outbound) | Hours |
| Activities per deal won | Total activities on WON deals / WON count | Number |
| Sequence completion rate | COMPLETED enrollments / total enrollments | Percentage |

**Per-Deal Metrics (opportunity detail):**

| Metric | Display |
|--------|---------|
| Total activities | Count badge |
| Days since last activity | Number + color (green <3d, yellow 3-7d, orange 7-14d, red >14d) |
| Engagement score | Based on activity frequency + stakeholder variety |
| Activity velocity | Activities per week (trending up/down arrow) |
| Stakeholder coverage | % of known decision-makers with recent activity |
| Response pattern | Avg days between outreach and reply |

**Activity Analytics API Endpoints:**

```
GET /api/v1/activities/metrics/my-summary       Current user's activity summary
GET /api/v1/activities/metrics/team-summary      Manager view: team activity summary
GET /api/v1/activities/metrics/by-opportunity/:id  Activity metrics for specific deal
GET /api/v1/activities/metrics/by-type            Breakdown by activity type
GET /api/v1/activities/metrics/response-times     Response time analytics
```

### 5A.7 Activity Timeline UI — Detailed Spec

**Timeline Component Features:**
- Chronological reverse-order (newest first)
- Activity type icons: 📞 Call, ✉️ Email, 🤝 Meeting, 📝 Note, ✅ Task, ⚙️ System
- Color-coded left border by type
- Expandable cards (collapsed: type + subject + date + contact; expanded: full details)
- Filter bar: type toggles (show/hide calls, emails, etc.), date range, user filter
- Infinite scroll (load 20 at a time, paginated API)
- "Pin to top" for important notes
- Quick actions on each card: "Follow up", "Log related activity", "Add note"

**Quick-Log Toolbar (always visible at top of timeline):**

```
[📞 Log Call] [✉️ Log Email] [🤝 Log Meeting] [📝 Add Note] [✅ Create Task]
```

Each button opens a slide-out form with:
- Template selector dropdown (from ActivityTemplate)
- Pre-filled merge fields
- Contact selector (from opportunity stakeholders)
- Duration/date inputs per type
- Follow-up toggle + date picker
- "Save & Schedule Next" button (creates activity + opens next activity form)

---

## 5B. Sales Automation Engine — Deep Dive

> Inspired by: Salesforce Flows + Process Builder, HubSpot Workflows, Pipedrive Automations, Close Smart Views + Workflows, Freshsales Freddy AI

### 5B.1 Automation Architecture Overview

The automation engine consists of four layers:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 4: SCHEDULED JOBS (cron-based)                   │
│  - Deal rotting check (daily 02:00 UTC)                 │
│  - Overdue task alerts (daily 07:00 UTC)                │
│  - Sequence step execution (hourly)                     │
│  - Health score batch recalculation (daily 03:00 UTC)   │
│  - Forecast snapshot (weekly Sunday 23:00 UTC)          │
├─────────────────────────────────────────────────────────┤
│  Layer 3: WORKFLOW RULES (event-driven)                 │
│  - If/then automation rules defined by admin            │
│  - Triggered by entity events (create, update, delete)  │
│  - Execute actions: create activity, send notification, │
│    update field, assign record, enroll in sequence      │
├─────────────────────────────────────────────────────────┤
│  Layer 2: BUILT-IN TRIGGERS (hardcoded business logic)  │
│  - Stage change → auto-probability, auto-forecast cat   │
│  - Activity logged → recalc health, update timestamps   │
│  - Close date pushed → increment pushCount, log event   │
│  - Lead qualified → notify sales, create task           │
│  - Quote accepted → auto-advance stage                  │
│  - Deal won/lost → system logging + notifications       │
├─────────────────────────────────────────────────────────┤
│  Layer 1: EVENT BUS (foundation)                        │
│  - NestJS EventEmitter for intra-process events         │
│  - All entity changes emit typed events                 │
│  - Listeners process asynchronously (non-blocking)      │
└─────────────────────────────────────────────────────────┘
```

### 5B.2 Event Bus — Foundation Layer

Every significant entity change emits a typed event via NestJS `EventEmitter2`:

```typescript
// Event types
interface SalesEvent {
  tenantId: string;
  userId: string;        // Who triggered the event
  timestamp: Date;
  entityType: 'opportunity' | 'lead' | 'account' | 'contact' | 'quote' | 'activity';
  entityId: string;
  eventType: string;     // e.g., 'opportunity.stage_changed'
  payload: Record<string, unknown>;
}

// Specific event examples
'opportunity.created'        → { opportunity }
'opportunity.stage_changed'  → { opportunity, oldStageId, newStageId, oldStageName, newStageName }
'opportunity.status_changed' → { opportunity, oldStatus, newStatus, reason }
'opportunity.value_changed'  → { opportunity, oldValue, newValue }
'opportunity.owner_changed'  → { opportunity, oldOwnerId, newOwnerId }
'opportunity.close_date_pushed' → { opportunity, oldDate, newDate, pushCount }
'lead.created'               → { lead }
'lead.qualified'             → { lead }
'lead.converted'             → { lead, account, contact, opportunity }
'quote.created'              → { quote, opportunity }
'quote.status_changed'       → { quote, oldStatus, newStatus }
'quote.accepted'             → { quote, opportunity }
'activity.created'           → { activity }
'activity.completed'         → { activity }
'activity.overdue'           → { activity }
```

**Implementation: NestJS EventEmitter2 module**
- Register `@nestjs/event-emitter` in AppModule
- Services emit events after successful DB operations
- Listeners decorated with `@OnEvent('opportunity.stage_changed')` 
- Listeners run asynchronously (don't block the API response)

### 5B.3 Built-In Triggers — Hardcoded Business Logic

These are non-configurable automations that always run:

#### Opportunity Triggers

| Event | Actions |
|-------|---------|
| **Stage changed** | 1. Set `probability` from stage default (unless manually overridden) |
| | 2. Set `forecastCategory` from stage |
| | 3. Recalculate `weightedValue` |
| | 4. Log STAGE_CHANGE activity |
| | 5. Reset `daysInCurrentStage` to 0 |
| | 6. If terminal won: set `status=WON`, `actualCloseDate=now` |
| | 7. If terminal lost: require `lostReason` |
| | 8. Fire `opportunity.stage_changed` event |
| **Value changed** | 1. Recalculate `weightedValue` |
| | 2. Log SYSTEM activity |
| | 3. If has synced quote: flag mismatch warning |
| **Owner changed** | 1. Log SYSTEM activity |
| | 2. Notify old owner: "Deal {name} reassigned to {new}" |
| | 3. Notify new owner: "Deal {name} assigned to you" |
| | 4. Create TASK for new owner: "Review deal {name}" |
| **Close date pushed** | 1. If pushed by 30+ days: increment `pushCount` |
| | 2. Log SYSTEM activity |
| | 3. If pushCount >= 2: send notification to manager |
| **Activity logged** | 1. Update `lastActivityAt` on opportunity |
| | 2. Update `daysSinceLastActivity` to 0 |
| | 3. Recalculate `healthScore` |
| | 4. If deal was STALLED/CRITICAL: re-evaluate health status |
| **Deal won** | 1. Log STATUS_CHANGE activity |
| | 2. Notify all team members: "Deal {name} WON! 🎉" |
| | 3. Create TASK: "Initiate onboarding / conversion for {name}" |
| | 4. Update Account.type to CUSTOMER (if was PROSPECT) |
| **Deal lost** | 1. Log STATUS_CHANGE activity with `lostReason` |
| | 2. Notify team members |
| | 3. Cancel all active sequence enrollments |
| | 4. Cancel all PLANNED activities (mark as CANCELLED) |

#### Lead Triggers

| Event | Actions |
|-------|---------|
| **Lead created** | 1. Log SYSTEM activity: "Lead created" |
| | 2. If assignment rules exist: run assignment engine |
| | 3. Notify assigned owner: "New lead: {name} at {company}" |
| | 4. Create TASK: "Qualify lead {name}" due in 1 business day |
| **Lead qualified** | 1. Log SYSTEM activity: "Lead qualified" |
| | 2. Notify sales team: "Lead {name} qualified — ready for outreach" |
| | 3. If auto-sequence configured: enroll in outreach sequence |
| **Lead converted** | 1. Log SYSTEM activity on lead, account, contact, opportunity |
| | 2. Mark all lead PLANNED activities as CANCELLED |
| | 3. Transfer activity history references to new opportunity |

#### Quote Triggers

| Event | Actions |
|-------|---------|
| **Quote sent** | 1. Log SYSTEM activity on opportunity |
| | 2. Create TASK: "Follow up on quote {code}" due in 3 days |
| | 3. Update deal health (positive signal) |
| **Quote accepted** | 1. Log SYSTEM activity |
| | 2. If opportunity stage is before "Negotiation": auto-advance |
| | 3. Notify deal owner + team |
| **Quote rejected** | 1. Log SYSTEM activity with rejection reason |
| | 2. Create TASK: "Address quote rejection for {opportunity}" |
| | 3. Negative health score impact |
| **Quote expired** | 1. Log SYSTEM activity |
| | 2. Create TASK: "Renew or update expired quote {code}" |

### 5B.4 Workflow Rules — Configurable Automation

> Inspired by: Salesforce Workflow Rules, HubSpot Workflows, Pipedrive Automations

Tenant-admins can create custom if/then automation rules:

```
WorkflowRule {
  id: uuid PK
  tenantId: string(36)
  
  name: string(200)               // "Auto-assign Enterprise leads to Senior Rep"
  description: text nullable
  isActive: boolean default true
  
  // Trigger
  triggerEntity: WorkflowEntity    // OPPORTUNITY | LEAD | ACCOUNT | CONTACT | QUOTE | ACTIVITY
  triggerEvent: WorkflowTriggerEvent  // CREATED | UPDATED | FIELD_CHANGED | STATUS_CHANGED | STAGE_CHANGED
  
  // Conditions (AND logic — all must match)
  conditions: jsonb                // Array of condition objects
  // Example:
  // [
  //   { "field": "estimatedValue", "operator": "gte", "value": 100000 },
  //   { "field": "type", "operator": "eq", "value": "NEW_BUSINESS" },
  //   { "field": "accountTier", "operator": "in", "values": ["ENTERPRISE", "MID_MARKET"] }
  // ]
  
  // Supported operators: eq, neq, gt, gte, lt, lte, in, not_in, contains, 
  //                      is_empty, is_not_empty, changed_to, changed_from
  
  // Actions (execute in order)
  actions: jsonb                   // Array of action objects
  // [
  //   { "type": "UPDATE_FIELD", "field": "ownerId", "value": "{{seniorRepUserId}}" },
  //   { "type": "CREATE_ACTIVITY", "activityType": "TASK", "subject": "Qualify enterprise lead", "dueInDays": 1 },
  //   { "type": "SEND_NOTIFICATION", "userIds": ["uuid"], "message": "Enterprise lead assigned" },
  //   { "type": "ENROLL_SEQUENCE", "sequenceId": "uuid" }
  // ]
  
  // Execution limits
  executionLimit: int nullable     // Max times to fire per record (null = unlimited)
  cooldownMinutes: int default 0   // Min time between firings for same record
  
  // Audit
  lastTriggeredAt: timestamp nullable
  triggerCount: int default 0
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Supported Action Types:**

| Action | Parameters | Effect |
|--------|-----------|--------|
| `UPDATE_FIELD` | field, value | Update a field on the triggering entity |
| `CREATE_ACTIVITY` | activityType, subject, description, dueInDays, assignToOwner | Create a planned activity |
| `CREATE_TASK` | subject, description, dueInDays, assignedToId, priority | Create a task (shortcut for activity) |
| `SEND_NOTIFICATION` | userIds or "owner" or "team", message | Send in-app notification |
| `ASSIGN_OWNER` | userId or "round_robin" or rule criteria | Reassign record owner |
| `ENROLL_SEQUENCE` | sequenceId | Enroll in activity sequence |
| `STOP_SEQUENCE` | sequenceId or "all" | Stop active sequence enrollments |
| `ADD_TAG` | tag | Add tag to entity |
| `UPDATE_HEALTH` | — | Force health score recalculation |

**Pre-built workflow rule templates (seeded per tenant):**

| Rule Name | Trigger | Condition | Actions |
|-----------|---------|-----------|---------|
| "Enterprise Lead Alert" | Lead created | estimatedBudget >= $100k | Assign to senior rep, create priority task, notify manager |
| "Stale Deal Reminder" | Opportunity updated | daysInCurrentStage > 14 AND status = OPEN | Create task "Review stale deal", notify owner |
| "Won Deal Handoff" | Opportunity status changed | status changed to WON | Create task "Initiate project conversion", notify ops team |
| "Quote Follow-Up" | Quote status changed | status changed to SENT | Create task "Follow up on quote" due in 3 days |
| "High-Value Deal Alert" | Opportunity value changed | estimatedValue >= $500k | Notify VP of Sales, add tag "high-value" |
| "Deal At Risk" | Opportunity updated | healthStatus changed to CRITICAL | Notify owner + manager, create urgent task |

### 5B.5 Scheduled Jobs — Cron-Based Automation

```
┌─────────────────────────────────────────────────────────────────────┐
│ SCHEDULER: NestJS @nestjs/schedule (cron decorators)                │
├─────────────────────┬───────────────────────────────────────────────┤
│ Job                 │ Schedule        │ Logic                       │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ DealRotting         │ Daily 02:00 UTC │ For each OPEN opportunity:  │
│                     │                 │ - Calc daysInCurrentStage   │
│                     │                 │ - Calc daysSinceLastActivity│
│                     │                 │ - If stage > daysExpected:  │
│                     │                 │   create notification       │
│                     │                 │ - If no activity 14+ days:  │
│                     │                 │   create reminder TASK      │
│                     │                 │ - Update healthScore        │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ OverdueTaskAlert    │ Daily 07:00 UTC │ Find activities where:      │
│                     │                 │ - status = PLANNED          │
│                     │                 │ - dueDate < now             │
│                     │                 │ Send notification to owner  │
│                     │                 │ Mark activity as overdue    │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ UpcomingTaskReminder│ Daily 07:00 UTC │ Find activities where:      │
│                     │                 │ - status = PLANNED          │
│                     │                 │ - dueDate = today or tmrw   │
│                     │                 │ Send reminder notification  │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ SequenceExecutor    │ Every hour      │ Find enrollments where:     │
│                     │                 │ - status = ACTIVE           │
│                     │                 │ - nextStepDueAt <= now      │
│                     │                 │ Execute step: create the    │
│                     │                 │ activity, advance cursor,   │
│                     │                 │ calc next step due date     │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ HealthBatchRecalc   │ Daily 03:00 UTC │ Recalculate healthScore for │
│                     │                 │ ALL open opportunities      │
│                     │                 │ (catches drift from time-   │
│                     │                 │ based factors like days in  │
│                     │                 │ stage, days since activity) │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ ForecastSnapshot    │ Weekly Sun 23:00│ Save current forecast state │
│                     │                 │ for historical comparison   │
│                     │                 │ (variance tracking)         │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ QuoteExpiration     │ Daily 06:00 UTC │ Find quotes where:          │
│                     │                 │ - status = SENT             │
│                     │                 │ - expirationDate <= today   │
│                     │                 │ Set status = EXPIRED        │
│                     │                 │ Create follow-up task       │
├─────────────────────┼─────────────────┼─────────────────────────────┤
│ NoActivityEnforce   │ Daily 08:00 UTC │ Find OPEN opportunities w/  │
│                     │                 │ no PLANNED activities:      │
│                     │                 │ - Auto-create task "Schedule│
│                     │                 │   next activity for {deal}" │
│                     │                 │ - Mark deal health penalty  │
└─────────────────────┴─────────────────┴─────────────────────────────┘
```

**Implementation: `@nestjs/schedule` module**
- Register `ScheduleModule` in AppModule
- Each job is a `@Injectable()` service with `@Cron()` decorator
- Jobs iterate per tenant (multi-tenant aware)
- Jobs log execution time and records processed
- Jobs are idempotent (safe to re-run)

### 5B.6 Assignment Rules Engine

> Inspired by: Salesforce Assignment Rules, Freshsales Territory Management

```
AssignmentRule {
  id: uuid PK
  tenantId: string(36)
  
  name: string(200)
  entityType: 'LEAD' | 'OPPORTUNITY'
  isActive: boolean default true
  priority: int default 0         // Higher = evaluated first
  
  // Conditions (AND logic)
  conditions: jsonb
  // [
  //   { "field": "companySize", "operator": "in", "values": ["201-1000", "1000+"] },
  //   { "field": "industry", "operator": "eq", "value": "Technology" }
  // ]
  
  // Assignment action
  assignmentType: AssignmentType   // SPECIFIC_USER | ROUND_ROBIN | LEAST_LOADED
  
  // For SPECIFIC_USER
  assignToUserId: uuid nullable
  
  // For ROUND_ROBIN
  roundRobinUserIds: uuid[] default []   // Users in the rotation pool
  lastAssignedIndex: int default 0       // Track round-robin position
  
  // For LEAST_LOADED
  leastLoadedUserIds: uuid[] default []  // Pool of users
  loadMetric: 'OPEN_DEALS' | 'DEAL_VALUE' | 'OPEN_LEADS'  // What to count
  
  // Fallback
  fallbackUserId: uuid nullable     // If no match or pool exhausted
  
  createdBy: uuid FK → User
  createdAt, updatedAt: timestamp
}
```

**Execution logic:**
1. On lead/opportunity create: fetch active assignment rules for tenant, ordered by priority
2. Evaluate conditions against the new record
3. First matching rule wins
4. Execute assignment: set `ownerId` on the entity
5. Log SYSTEM activity: "Auto-assigned to {userName} via rule {ruleName}"
6. Create welcome TASK for new owner
7. If no rules match: assign to fallback user or leave unassigned (notify admin)

### 5B.7 Notification Integration

All automation actions that "send notification" use the existing `notifications` module:

**Notification types generated by sales automation:**

| Event | Recipients | Priority | Channel |
|-------|-----------|----------|---------|
| New lead assigned | Assigned owner | NORMAL | In-app |
| Lead qualified | Sales team | NORMAL | In-app |
| Deal stage advanced | Deal owner + team | LOW | In-app |
| Deal won | Owner + team + manager | HIGH | In-app |
| Deal lost | Owner + manager | NORMAL | In-app |
| Deal at risk (health CRITICAL) | Owner + manager | HIGH | In-app |
| Deal rotting (no activity 14d) | Owner | HIGH | In-app |
| Task overdue | Assigned user | HIGH | In-app |
| Task due today | Assigned user | NORMAL | In-app |
| Quote accepted | Deal owner + team | HIGH | In-app |
| Quote rejected | Deal owner | NORMAL | In-app |
| Quote expired | Deal owner | NORMAL | In-app |
| Close date pushed 2+ times | Owner + manager | NORMAL | In-app |
| High-value deal created ($500k+) | VP / manager | HIGH | In-app |
| Sequence step created | Assigned user | LOW | In-app |

### 5B.8 Workflow Rules API Endpoints

```
# Workflow Rules (admin-only)
GET    /api/v1/workflow-rules                    List rules
POST   /api/v1/workflow-rules                    Create rule
GET    /api/v1/workflow-rules/:id                Get rule detail
PATCH  /api/v1/workflow-rules/:id                Update rule
DELETE /api/v1/workflow-rules/:id                Delete rule
POST   /api/v1/workflow-rules/:id/test           Dry-run rule against sample record
GET    /api/v1/workflow-rules/:id/history         Execution history

# Activity Sequences (sales team)
GET    /api/v1/sequences                         List sequences
POST   /api/v1/sequences                         Create sequence
GET    /api/v1/sequences/:id                     Get sequence with steps
PATCH  /api/v1/sequences/:id                     Update sequence
DELETE /api/v1/sequences/:id                     Deactivate sequence
POST   /api/v1/sequences/:id/steps               Add step
PATCH  /api/v1/sequences/:id/steps/:stepId       Update step
DELETE /api/v1/sequences/:id/steps/:stepId       Remove step

# Sequence Enrollments
POST   /api/v1/sequences/:id/enroll              Enroll opportunity/lead/contact
GET    /api/v1/sequences/:id/enrollments          List enrollments
PATCH  /api/v1/enrollments/:id/pause              Pause enrollment
PATCH  /api/v1/enrollments/:id/resume             Resume enrollment
PATCH  /api/v1/enrollments/:id/stop               Stop enrollment

# Activity Templates
GET    /api/v1/activity-templates                 List templates
POST   /api/v1/activity-templates                 Create template
PATCH  /api/v1/activity-templates/:id             Update template
DELETE /api/v1/activity-templates/:id             Delete template

# Assignment Rules (admin-only)
GET    /api/v1/assignment-rules                   List rules
POST   /api/v1/assignment-rules                   Create rule
PATCH  /api/v1/assignment-rules/:id               Update rule
DELETE /api/v1/assignment-rules/:id               Delete rule
```

### 5B.9 Frontend Components for Automation

| Component | Page | Purpose |
|-----------|------|---------|
| `WorkflowRuleEditor` | Admin Settings | Visual rule builder: entity selector, condition builder (field + operator + value rows), action list |
| `SequenceBuilder` | Sales Settings | Step-by-step sequence editor: add steps, set delays, assign templates, preview timeline |
| `SequenceEnrollmentPanel` | Opportunity / Lead Detail | Show active enrollments, progress bar, next step due, pause/stop controls |
| `AssignmentRuleEditor` | Admin Settings | Rule builder with user pool selector, round-robin config |
| `UpcomingTasksWidget` | Dashboard | List of due/overdue tasks with quick-complete actions |
| `ActivityMetricsCards` | Dashboard / Sales Analytics | Rep activity KPIs: calls, emails, meetings, connect rate |
| `AutomationLogViewer` | Admin Settings | Audit log showing all automation executions |

### 5B.10 Implementation Note: Database Entities for Automation

New entities needed for the automation engine (in addition to §2 entities):

```
New entities:
- ActivityTemplate         (§5A.3)  — Wave 3
- ActivitySequence         (§5A.4)  — Wave 7
- ActivitySequenceStep     (§5A.4)  — Wave 7
- SequenceEnrollment       (§5A.4)  — Wave 7
- WorkflowRule             (§5B.4)  — Wave 7
- AssignmentRule           (§5B.6)  — Wave 7

Updated implementation waves:
- Wave 3: Activity entity, ActivityTemplate, timeline UI, auto-logging, deal rotting, reminders
- Wave 7: WorkflowRule, ActivitySequence + Steps + Enrollments, AssignmentRule, scheduler jobs, automation UI
```

---

## 6. Frontend Pages & Components

### 6.1 New Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Accounts** | `/accounts` | Account list with search, filters, tier badges |
| **Account Detail** | `/accounts/:id` | Account info, contacts, opportunities, activity timeline, hierarchy |
| **Contacts** | `/contacts` | Contact list with search, account filter |
| **Contact Detail** | `/contacts/:id` | Contact info, opportunities, activity timeline |
| **Leads** | `/leads` | Lead list with status/source/rating filters, kanban view option |
| **Lead Detail** | `/leads/:id` | Lead info, BANT fields, convert action, activity timeline |
| **Pipeline Board** | `/pipeline` | **PRIMARY** — Drag-and-drop Kanban board (Pipedrive UX) |
| **Opportunity Detail** | `/opportunities/:id` | **Enhanced** — Tabbed layout: Overview, Stakeholders, Line Items, Quotes, Activities, Competitors |
| **Products** | `/products` | Product catalog management |
| **Quotes** | `/quotes` | Quote list, status filters |
| **Quote Detail** | `/quotes/:id` | Quote editor, line items, approval status, send action |
| **Sales Forecast** | `/forecast` | Forecast view by category, period, owner |
| **Sales Analytics** | `/analytics/sales` | Win/loss, cycle time, pipeline health, rep performance |

### 6.2 Enhanced Dashboard Integration

Add to existing Dashboard.tsx:
- **Pipeline health widget** — donut chart showing HEALTHY/AT_RISK/STALLED/CRITICAL distribution
- **Forecast summary** — bar chart: Pipeline vs Best Case vs Commit vs Target
- **Top deals** — list of highest-value open opportunities
- **Upcoming activities** — next 5 tasks/meetings for current user
- **Lead funnel** — NEW → CONTACTED → ENGAGED → QUALIFIED → CONVERTED counts
- **Win rate** — percentage badge with trend arrow

### 6.3 Pipeline Board (Primary Sales View)

> Inspired by: Pipedrive's drag-and-drop visual pipeline

**Features:**
- Columns = pipeline stages (from PipelineStage entity)
- Cards = opportunities, showing: name, account, value, owner avatar, health indicator, days in stage
- **Drag-and-drop** to advance stages (validates requirements on drop)
- Color-coded health dots (green/yellow/orange/red)
- Deal rotting indicator (orange border if > expected days)
- **Pipeline selector** dropdown (for multi-pipeline)
- **Filters**: Owner, account, date range, value range, health status
- **Summary bar**: total count, total value, weighted value per stage
- **Quick actions** on cards: Log activity, change owner, quick note

### 6.4 Opportunity Detail (Tabbed Layout)

**Tabs:**
1. **Overview**: Key fields, stage progress bar (Business Process Flow inspired by Dynamics 365), next step, deal health card
2. **Stakeholders**: Contact list with roles, influence, sentiment badges. Add/edit stakeholder interactions
3. **Line Items**: Product table with quantities, pricing, discounts, totals. Add from catalog or custom
4. **Quotes**: List of quotes, create new, status tracking, sync indicator
5. **Activities**: Timeline view (chronological, filterable by type). Log call, email, meeting, note inline
6. **Competitors**: Competitor list with threat level, strengths/weaknesses
7. **History**: Full audit trail of all changes (from Activity entity, type=SYSTEM)

### 6.5 Key UI Components

| Component | Purpose |
|-----------|---------|
| `PipelineBoard` | Drag-and-drop Kanban board |
| `DealCard` | Opportunity card for pipeline board |
| `StageProgressBar` | Horizontal stage visualization (Dynamics 365 BPF style) |
| `DealHealthBadge` | Color-coded health indicator |
| `StakeholderList` | Contact roles on opportunity |
| `ActivityTimeline` | Chronological activity list |
| `ActivityLogForm` | Quick activity entry (call/email/meeting/note) |
| `QuoteEditor` | Quote creation/editing with line items |
| `LeadConvertDialog` | Lead conversion wizard |
| `ForecastChart` | Stacked bar chart by forecast category |
| `WinLossChart` | Win/loss analysis visualization |
| `AccountHierarchy` | Tree view of parent/child accounts |
| `ContactOrgChart` | Visual org chart for contacts |

---

## 7. Implementation Waves

### Wave 1 — Foundation: Accounts, Contacts, Pipeline Configuration
**Scope**: New entities, migrations, CRUD, basic UI
- [ ] Account entity + CRUD API + page + form
- [ ] Contact entity + CRUD API + page + form
- [ ] SalesPipeline + PipelineStage entities + CRUD API
- [ ] Pipeline configuration UI (admin page)
- [ ] Migrate existing Opportunity entity (add new fields, keep backward compat)
- [ ] Shared types + Zod schemas for all new entities
- [ ] Database migrations (additive — no breaking changes)

### Wave 2 — Enhanced Opportunity Management
**Scope**: Stakeholders, line items, stage logic, pipeline board
- [ ] OpportunityStakeholder entity + API
- [ ] OpportunityTeamMember entity + API
- [ ] OpportunityLineItem entity + Product catalog
- [ ] OpportunityCompetitor entity + API
- [ ] Enhanced stage change logic (validation, auto-probability, activity logging)
- [ ] Pipeline Board (Kanban) — drag-and-drop UI
- [ ] Opportunity Detail tabbed layout (Overview, Stakeholders, Line Items, Competitors)
- [ ] Stage Progress Bar component
- [ ] Deal health score calculation engine

### Wave 3 — Activities, Timeline & Reminders
**Scope**: Activity entity, templates, timeline UI, auto-logging, reminders, deal health automation
- [ ] Activity entity + CRUD API (with type-specific metadata: call, email, meeting, note)
- [ ] ActivityTemplate entity + CRUD API (pre-built templates per type)
- [ ] Seed default activity templates per tenant (Discovery Call, Demo, Follow-Up, etc.)
- [ ] Activity Timeline component (reverse-chronological, filterable, expandable cards)
- [ ] Activity Log Form — type-specific (call: duration/outcome, email: recipients/thread, meeting: attendees/agenda)
- [ ] Quick-Log Toolbar (📞 Call, ✉️ Email, 🤝 Meeting, 📝 Note, ✅ Task — always visible on timeline)
- [ ] Template selector in Activity Log Form (auto-fill merge variables)
- [ ] NestJS EventEmitter2 integration — event bus foundation (§5B.2)
- [ ] Built-in triggers: auto-log on stage changes, status changes, owner changes, value changes (§5B.3)
- [ ] Follow-up system: activities with followUpRequired auto-create next TASK (§5A.5)
- [ ] Meeting action items → auto-create TASK per action item
- [ ] "No next activity" enforcement: prompt after completing any activity, auto-task if ignored 24h
- [ ] Deal rotting detection scheduler (daily cron, §5B.5)
- [ ] Overdue task alert scheduler (daily cron)
- [ ] Upcoming task reminder scheduler (daily cron)
- [ ] Health score recalculation triggers (on activity, stage change, etc.)
- [ ] Upcoming Tasks / Overdue Tasks dashboard widgets
- [ ] Activity tab on opportunity, account, contact detail pages
- [ ] Activity metrics endpoints: my-summary, by-opportunity (§5A.6)
- [ ] Activity metrics UI: per-rep KPIs (calls, emails, meetings, connect rate)

### Wave 4 — Leads & Conversion
**Scope**: Lead management, lead conversion workflow
- [ ] Lead entity + CRUD API
- [ ] Lead list page with status/source/rating filters
- [ ] Lead detail page with BANT fields
- [ ] Lead conversion endpoint (→ Account + Contact + Opportunity)
- [ ] Lead conversion wizard UI
- [ ] Lead funnel widget on Dashboard
- [ ] Source tracking on opportunities (leadSource, sourceLeadId)

### Wave 5 — Quoting
**Scope**: Quote management, line items, approval workflow
- [ ] Quote + QuoteLineItem entities + API
- [ ] Quote creation from opportunity (copy line items)
- [ ] Quote editor page with line item management
- [ ] Quote status workflow (draft → approval → sent → accepted/rejected)
- [ ] Quote approval endpoints
- [ ] Quote sync to opportunity (primary quote)
- [ ] Quote list page with status filters

### Wave 6 — Forecasting & Analytics
**Scope**: Forecast engine, analytics dashboards, enhanced reporting
- [ ] Forecast calculation engine (weighted pipeline by category/period)
- [ ] Forecast API endpoints (by owner, team, period)
- [ ] Sales Forecast page with category breakdown
- [ ] Win/loss analysis endpoint + visualization
- [ ] Sales cycle analytics (avg days per stage, bottleneck detection)
- [ ] Pipeline health overview dashboard
- [ ] Enhanced Dashboard widgets (forecast, health, top deals, win rate)
- [ ] Rep performance metrics

### Wave 7 — Sales Automation Engine
**Scope**: Workflow rules, sequences, assignment rules, advanced scheduling, automation UI
- [ ] WorkflowRule entity + CRUD API (configurable if/then rules, §5B.4)
- [ ] Workflow Rule Editor UI: entity selector, condition builder, action list (Admin Settings)
- [ ] Pre-built workflow rule templates seeded per tenant (6 templates, §5B.4)
- [ ] ActivitySequence + ActivitySequenceStep entities + API (§5A.4)
- [ ] SequenceEnrollment entity + API (enroll, pause, resume, stop)
- [ ] Sequence Builder UI: step-by-step editor with delay config, template selection (Sales Settings)
- [ ] Sequence Enrollment Panel on Opportunity/Lead detail (progress bar, next step)
- [ ] Sequence Executor scheduler (hourly cron — execute due steps, advance cursors, §5B.5)
- [ ] AssignmentRule entity + API (SPECIFIC_USER / ROUND_ROBIN / LEAST_LOADED, §5B.6)
- [ ] Assignment Rule Editor UI (Admin Settings)
- [ ] Lead/opportunity auto-assignment on create (run assignment engine)
- [ ] Stage checklist enforcement (guided selling — PipelineStage.checklist)
- [ ] Close date push tracking and alerts (§5.7 + manager notification on pushCount >= 2)
- [ ] Quote expiration scheduler (daily cron — auto-expire, create follow-up tasks)
- [ ] No-activity enforcement scheduler (daily cron — auto-task for deals with no planned activity)
- [ ] Forecast snapshot scheduler (weekly cron — save state for variance tracking)
- [ ] Health batch recalculation scheduler (daily cron — catch time-based drift)
- [ ] Notification integration for all automation events (§5B.7 — 15+ notification types)
- [ ] Automation Log Viewer UI (Admin Settings — audit log of all rule executions)
- [ ] Enhanced opportunity→project conversion (stakeholder→team mapping, activity history)
- [ ] Bulk operations (bulk status change, bulk reassign, bulk enroll in sequence)
- [ ] Import/export (CSV for accounts, contacts, leads)

---

## 8. Migration Strategy

### Handling Existing Data

The existing `opportunities` table has data. Migration approach:

1. **Additive columns only** — new nullable columns on existing `opportunities` table
2. **New tables** for Account, Contact, Lead, etc. — no data migration needed
3. **Default pipeline** — create a default SalesPipeline with stages matching current status enum
4. **Map existing status → stage**: 
   - IDENTIFIED → stage "Prospecting" (pipeline stage)
   - QUALIFYING → stage "Qualification"
   - PROPOSAL → stage "Proposal"
   - NEGOTIATION → stage "Negotiation"
   - WON → stage "Closed Won" (isClosed=true, isWon=true)
   - LOST → status LOST (keep as status, not stage)
   - CONVERTED → status CONVERTED
5. **Keep old columns** — mark as deprecated, remove in future migration
6. **Backfill ownerId** → team member (OWNER role) in OpportunityTeamMember

### Breaking Changes

**None in Wave 1-3.** Existing API endpoints continue working — new endpoints are additive. Frontend pages are new routes. Existing `/opportunities` page works until Pipeline Board replaces it.

**Wave 4+** may deprecate old fields (`clientName`, `clientContact`, `stage` enum) in favor of new Account/Contact relations and PipelineStage FK. Old fields will be nullable but maintained for backward compatibility.

---

## 9. Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Drag-and-drop lib | `@dnd-kit/core` | Best React DnD library, accessible, performant |
| Activity entity | Append-only | Matches existing InventoryTransaction pattern (immutable audit log) |
| Pipeline stages | Database-driven (not enum) | Multi-tenant customization, no migration for stage changes |
| Deal health | Calculated on access + cached | No separate entity; computed from opportunity + activity data |
| Forecast | Calculated endpoint | No materialized view needed at this scale; real-time aggregation |
| Quote PDF | Future scope | Start with data model; PDF generation can be added later with `@react-pdf/renderer` or server-side |
| Old status enum | Keep temporarily | Backward compat; deprecate after pipeline stage migration |
| Product catalog | Tenant-scoped | Each tenant has own products/pricing |

---

## 10. RBAC — Extended Permissions

| Resource | ADMIN | OPS_DIRECTOR | SALES_EXEC | PROJECT_LEAD | PERSONNEL | INVENTORY_MGR |
|----------|-------|-------------|------------|--------------|-----------|---------------|
| Accounts | CRUD | CRUD | CRUD | R | R (own) | - |
| Contacts | CRUD | CRUD | CRUD | R | R (own) | - |
| Leads | CRUD | CRUD | CRUD | R | - | - |
| Pipelines/Stages | CRUD | R | R | R | - | - |
| Opportunities | CRUD | CRUD | CRUD | R (assigned) | R (own) | - |
| Stakeholders | CRUD | CRUD | CRU | R | - | - |
| Opp Team | CRUD | CRUD | CRU (own) | R | - | - |
| Line Items | CRUD | CRUD | CRUD | R | - | - |
| Products | CRUD | CRUD | R | R | - | - |
| Quotes | CRUD | CRUD | CRUD | R | - | - |
| Quote Approval | ✓ | ✓ | - | - | - | - |
| Activities | CRUD | CRUD | CRUD | CRU (own) | CR (own) | - |
| Competitors | CRUD | CRUD | CRUD | R | - | - |
| Forecasting | R (all) | R (all) | R (own) | R (own) | - | - |
| Analytics | R (all) | R (all) | R (own) | R (own) | - | - |

---

## 11. CRM Features Sourcing Map

| Feature | Sourced From | Implementation Priority |
|---------|-------------|------------------------|
| Multi-pipeline support | Pipedrive | Wave 1 |
| Configurable stages with requirements | Salesforce + Dynamics 365 | Wave 1 |
| Stage probability mapping | Salesforce | Wave 2 |
| Drag-and-drop pipeline board | Pipedrive | Wave 2 |
| Stakeholder roles (decision-maker, etc.) | Salesforce + Freshsales | Wave 2 |
| Opportunity line items / products | Salesforce + Freshsales CPQ | Wave 2 |
| Deal health scoring | Dynamics 365 + Pipedrive | Wave 2 |
| Business Process Flow (stage bar) | Dynamics 365 | Wave 2 |
| Activity timeline (reverse-chrono, filterable) | HubSpot + Salesforce | Wave 3 |
| Type-specific activity logging (call/email/meeting) | Close + HubSpot + Salesforce Task/Event | Wave 3 |
| Activity templates with merge variables | HubSpot Playbooks + Close Workflows | Wave 3 |
| Quick-log toolbar (one-click activity entry) | Pipedrive + Close | Wave 3 |
| Follow-up enforcement (every deal has next activity) | Pipedrive "Never forget a follow-up" | Wave 3 |
| Auto-logged system activities (30+ trigger types) | Salesforce Activity History | Wave 3 |
| Event bus (NestJS EventEmitter2) | Salesforce Flows trigger architecture | Wave 3 |
| Deal rotting alerts (stage expected days) | Pipedrive | Wave 3 |
| Overdue task + upcoming task reminders | Pipedrive + Close | Wave 3 |
| Activity metrics per rep + per deal | HubSpot + Salesforce Einstein Activity | Wave 3 |
| Close date push tracking | Salesforce PushCount | Wave 3 |
| Lead management & scoring | Salesforce + Freshsales | Wave 4 |
| Lead conversion wizard | Salesforce + Dynamics 365 | Wave 4 |
| BANT qualification fields | Salesforce | Wave 4 |
| Quoting with line items | Salesforce + Freshsales CPQ | Wave 5 |
| Quote approval workflow | Salesforce | Wave 5 |
| Weighted pipeline forecasting | Salesforce + Dynamics 365 | Wave 6 |
| Forecast categories (Pipeline/Best Case/Commit) | Salesforce | Wave 6 |
| Win/loss analysis | Salesforce + HubSpot | Wave 6 |
| Sales cycle analytics | Salesforce + Dynamics 365 | Wave 6 |
| Competitor tracking | Salesforce | Wave 2 |
| Configurable workflow rules (if/then) | Salesforce Workflow Rules + HubSpot Workflows | Wave 7 |
| Activity sequences (multi-step cadences) | HubSpot Sequences + Freshsales Sequences | Wave 7 |
| Sequence enrollment/pause/stop | HubSpot + Close Workflows | Wave 7 |
| Assignment rules (round-robin, least-loaded) | Salesforce + Freshsales Territory Mgmt | Wave 7 |
| Guided selling (stage checklists) | Salesforce Path + HubSpot Playbooks | Wave 7 |
| Scheduled automation jobs (8 cron tasks) | Salesforce + Dynamics 365 batch processing | Wave 7 |
| Automation audit log | Salesforce Process Instance History | Wave 7 |
| Bulk operations | HubSpot + Freshsales | Wave 7 |
| Opportunity→Project enhanced conversion | Dynamics 365 Project Operations | Wave 7 |

---

## 12. Naming Conventions (consistent with existing codebase)

| Layer | Convention | Example |
|-------|-----------|---------|
| Entity | `{name}.entity.ts` | `account.entity.ts` |
| Controller | `{name}.controller.ts` | `accounts.controller.ts` |
| Service | `{name}.service.ts` | `accounts.service.ts` |
| Module | `{name}.module.ts` | `accounts.module.ts` |
| DTO | `dto/{name}.dto.ts` | `dto/account.dto.ts` |
| Migration | `{timestamp}-{Description}.ts` | `1773500000000-AddAccountsAndContacts.ts` |
| Page | `{Name}.tsx` | `Accounts.tsx` |
| Component | `{Name}.tsx` | `PipelineBoard.tsx` |
| Hook | `use-{name}.ts` | `use-accounts.ts` |
| Shared type | In `packages/shared/src/types/index.ts` | `Account`, `AccountType` |
| Shared schema | In `packages/shared/src/schemas/index.ts` | `createAccountSchema` |
