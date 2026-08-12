Good. Since we are rebuilding from scratch, update the frontend requirements. We will use **Next.js instead of React + Vite** and define a proper enterprise AWS-style design system.

Add this section to the original project prompt.

---

# Frontend UI/UX Standards

## Framework

Use:

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* Lucide Icons
* React Hook Form
* Zod validation

Do NOT use plain React + Vite.

---

# Frontend Architecture

Create:

```
frontend/

├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── scans/
│   │   │   ├── page.tsx
│   │   │   └── [scanId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── findings/
│   │   │   ├── page.tsx
│   │   │   └── [findingId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── layout.tsx
│   ├── globals.css
│   └── providers.tsx
│
├── components/
│
│   ├── ui/
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   └── button.css
│   │   │
│   │   ├── card/
│   │   │   ├── card.tsx
│   │   │   └── card.css
│
│   ├── layout/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Sidebar.css
│   │   │
│   │   ├── Navbar/
│   │   │   ├── Navbar.tsx
│   │   │   └── Navbar.css
│
│   ├── dashboard/
│   │
│   │   ├── SecurityScoreCard/
│   │   │   ├── SecurityScoreCard.tsx
│   │   │   └── SecurityScoreCard.css
│   │   │
│   │   ├── FindingsChart/
│   │   │   ├── FindingsChart.tsx
│   │   │   └── FindingsChart.css
│   │   │
│   │   └── RecentScans/
│   │       ├── RecentScans.tsx
│   │       └── RecentScans.css
│
├── hooks/
│
├── services/
│
├── lib/
│
├── types/
│
├── utils/
│
├── public/
│
├── styles/
│
└── tailwind.config.ts
```

---

# Component Rules

Every component MUST have its own folder.

Example:

```
SecurityScoreCard/

├── SecurityScoreCard.tsx
├── SecurityScoreCard.css
└── index.ts
```

No large component files.

Avoid:

```
components/dashboard.tsx
```

Prefer:

```
components/dashboard/
       |
       ├── Cards/
       ├── Charts/
       ├── Tables/
```

---

# Design System

## Theme

Create an AWS-inspired enterprise theme.

Reference:

AWS Console style:

* Dark navigation
* Clean white workspace
* Blue primary actions
* Subtle borders
* Dense enterprise layouts

---

# Colors

## Primary

```
AWS Blue

#146EB4
```

---

## Dark Navigation

```
AWS Navy

#232F3E
```

---

## Background

```
#F7F8FA
```

---

## Cards

```
#FFFFFF
```

---

## Border

```
#E5E7EB
```

---

## Success

```
#1D8102
```

---

## Warning

```
#FF9900
```

---

## Danger

```
#D13212
```

---

# Typography

Use:

## Poppins

Install:

```
@import url(...)
```

Use everywhere.

Weights:

```
300
400
500
600
700
```

---

Example:

```
Dashboard Heading

font-family:
Poppins

font-weight:
600
```

---

# Tailwind Configuration

Configure:

```ts
theme:{
 extend:{
   colors:{
     aws:{
       blue:"#146EB4",
       navy:"#232F3E",
       orange:"#FF9900"
     }
   }
 }
}
```

---

# UI Library

Use:

## shadcn/ui

Components:

* Button
* Card
* Dialog
* Drawer
* Sheet
* Dropdown
* Table
* Tabs
* Badge
* Avatar
* Input
* Select
* Toast

---

# Animation Standards

Use:

## Framer Motion

Every major component should have:

* Entry animation
* Hover animation
* Loading animation

Example:

Cards:

```
opacity:0
y:20

↓

opacity:1
y:0
```

Duration:

```
0.3s - 0.5s
```

---

# Hover Effects

All interactive components require:

## Cards

Normal:

```
shadow-sm
```

Hover:

```
shadow-lg
scale-[1.02]
border-blue
```

---

Buttons:

Normal:

```
AWS Blue
```

Hover:

```
brightness-110
translate-y-[-1px]
```

---

Sidebar:

Active:

```
background:
#146EB4
```

Hover:

```
background:
rgba(20,110,180,.1)
```

---

# Dashboard UI

Design:

AWS Security Hub style.

Layout:

```
------------------------------------------------

Navbar

------------------------------------------------


Sidebar | Main Content


        Security Overview


[Score] [Critical] [High] [Medium]


------------------------------------------------


Finding Trends Chart


------------------------------------------------


Recent Scans Table


------------------------------------------------
```

---

# Dashboard Components

Create:

```
Dashboard/

├── SecurityScoreCard

├── ComplianceCard

├── SeverityCards

├── FindingsTrendChart

├── CloudAccountCard

├── RecentScansTable

└── ActivityTimeline
```

---

# Tables

All tables must support:

* Sorting
* Filtering
* Pagination
* Search
* Column visibility

Use:

TanStack Table

---

# Loading States

Never show blank screens.

Implement:

* Skeleton loaders
* Animated placeholders

Example:

```
CardSkeleton.tsx
TableSkeleton.tsx
ChartSkeleton.tsx
```

---

# Error Handling

Create:

```
components/common/

ErrorState/

EmptyState/

LoadingState/
```

---

# Responsive Design

Support:

Desktop:

```
1440px+
```

Tablet:

```
768px
```

Mobile:

```
320px
```

---

# Dark Mode

Support:

* AWS dark console style
* Light mode

Use:

```
next-themes
```

---

# Accessibility

Follow:

* Keyboard navigation
* ARIA labels
* Focus states
* WCAG compliance

---

# Enterprise UX Features

Add:

## Global Search

Search:

* Findings
* Scans
* Reports

---

## Notifications

Top navbar:

Bell icon

Dropdown:

```
Critical Finding Detected

Scan Completed

Report Generated
```

---

## User Menu

Navbar:

```
Avatar

Name

Role

Settings

Logout
```

---

# Frontend Development Order

Build:

## Phase 1

Foundation

* Next.js setup
* Tailwind
* shadcn
* Theme
* Fonts
* Layout

## Phase 2

Authentication UI

* Login
* Register
* Protected routes

## Phase 3

Dashboard

* Cards
* Charts
* Tables

## Phase 4

Scans

* Scan list
* Scan details

## Phase 5

Findings

* Findings table
* Filters
* Details drawer

## Phase 6

Reports

* Report viewer
* Downloads

## Phase 7

Polish

* Animations
* Loading states
* Dark mode
* Responsive

---

This frontend architecture will be much closer to a **production AWS enterprise console** instead of a normal CRUD dashboard.
