# Virgil St. - Complete UI/UX Design Brief

## Project Overview
**Platform:** Virgil St. - Social Services Navigation Platform
**Target Users:** People experiencing homelessness, low-income residents in Los Angeles
**Mission:** Simplify access to social services, housing, food, healthcare, and community support
**Tech Stack:** React + TypeScript (Frontend), Node.js + tRPC (Backend), PostgreSQL (Database)

---

## 1. EXISTING TECH CONSTRAINTS

### Frontend Framework
- **Library:** React 18+ with TypeScript
- **Routing:** Wouter (lightweight client-side router)
- **Styling:** Tailwind CSS v3.4+
- **Component Library:** Radix UI primitives (shadcn/ui components)
- **State Management:** tRPC React Query hooks
- **Icons:** Lucide React
- **Forms:** Native React state + Zod validation
- **Notifications:** Sonner (toast notifications)

### Design System Foundation
**All designs MUST use existing shadcn/ui component structure:**
- Button, Card, Dialog, Input, Select, Tabs, Textarea
- Alert, Badge, Checkbox, Label, RadioGroup, Switch
- Table, Dropdown Menu, Popover, Tooltip, Sheet

**Theming:** CSS variables for colors (dark mode support required)

### Responsive Requirements
- **Mobile-first:** Must work on cheap Android phones
- **Breakpoints:**
  - Mobile: 320px - 640px
  - Tablet: 641px - 1024px
  - Desktop: 1025px+
- **Touch targets:** Minimum 44x44px for all interactive elements
- **Font size:** Minimum 16px base for accessibility

---

## 2. CURRENT PAGE STRUCTURE

### Public Pages (No Auth Required)
1. **Home** (`/`) - Landing page with feature grid
2. **Chat** (`/chat`) - AI assistant (Virgil)
3. **Library** (`/library`) - Resource guides and articles
4. **Map** (`/map`) - Interactive community resource map
5. **Forum** (`/forum`) - Community discussion board
6. **Videos** (`/videos`) - Educational video library
7. **Search** (`/search`) - Global search across all content
8. **Resources** (`/resources`) - Shelters, food banks, services
9. **Medical Providers** (`/medical-providers`) - Medi-Cal provider directory
10. **Treatment** (`/treatment`) - Sober living and treatment centers
11. **Meetings** (`/meetings`) - AA/NA/CMA recovery meetings
12. **Events** (`/events`) - Community events and resource fairs

### Protected Pages (Requires Sign-In)
1. **Profile** (`/profile`) - User profile and settings
2. **Calendar** (`/calendar`) - Personal calendar with court dates, appointments

### Admin Pages (Requires Admin Role)
1. **Admin Dashboard** (`/admin`) - Content management and moderation

---

## 3. KEY FEATURES TO DESIGN FOR

### A. AI Chat Interface (`/chat`)
**Current Implementation:**
- Real-time streaming chat with "Virgil" AI assistant
- Message history with user/assistant roles
- Tool calling (searches knowledge base, web, scrapes URLs)
- Source citations displayed below responses
- Conversation persistence

**Design Needs:**
- Clean chat bubbles (user vs AI differentiated)
- Loading states (typing indicator, streaming text)
- Source citation cards (title, URL, category)
- Message actions (copy, regenerate)
- Conversation sidebar (list of past chats)
- Mobile: Full-screen chat, collapsible sidebar

### B. Interactive Map (`/map`)
**Current Implementation:**
- Leaflet.js map integration
- Custom pin types: safe zones, food, water, bathrooms, warnings, sweep alerts
- Live feed sidebar showing recent pin comments
- Pin creation form (lat/lng from click)
- Pin detail modal with comments
- Filter by pin type

**Design Needs:**
- Map controls (zoom, center, layer toggle)
- Pin icons for each type (7 types total)
- Pin creation flow (click map → form → submit)
- Pin detail card (title, description, comments, upvote)
- Live feed sidebar (collapsible on mobile)
- Filter pills/chips (multi-select)

### C. Forum (`/forum`)
**Current Implementation:**
- Category-based threads
- Anonymous posting option
- Nested replies (2 levels deep)
- Upvoting posts and replies
- Pinned/locked posts (admin)

**Design Needs:**
- Thread list (pinned at top, sort by recent/popular)
- Thread card (title, category badge, stats, preview)
- Post detail view (full content, nested replies)
- Reply form (inline under each comment)
- Anonymous toggle (visual indicator)
- Pinned/locked badges

### D. Resource Directory (`/resources`, `/treatment`, `/medical-providers`)
**Current Implementation:**
- Filterable lists (type, location, services)
- Search bar with live results
- Detail cards (name, address, phone, hours, services)
- Map integration (show on map button)

**Design Needs:**
- Filter sidebar (checkboxes, dropdowns)
- Search bar with autocomplete
- Resource cards (compact list view, detailed card view)
- Service tags/badges (accepts Medi-Cal, wheelchair accessible, etc.)
- Contact buttons (call, directions, website)
- Mobile: Collapsible filters, bottom sheet for details

### E. Admin Dashboard (`/admin`)
**Current Implementation:**
- Tab navigation: Guides, Videos, Resources, Pins, Forum, Users
- CRUD operations for all content types
- Moderation tools (approve/reject pins, lock/delete posts)
- User management (view, change roles, delete)

**Design Needs:**
- Professional admin interface (data tables, forms)
- Bulk actions (multi-select checkboxes)
- Inline editing where possible
- Confirmation modals for destructive actions
- Stats dashboard (optional, not yet implemented)

---

## 4. COMPONENT INVENTORY

### Must Use (Already Installed)
```typescript
// Buttons
<Button variant="default|destructive|outline|ghost|link" size="sm|md|lg" />

// Cards
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Dialogs/Modals
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>

// Forms
<Input type="text" placeholder="..." />
<Textarea rows={4} />
<Select>
  <SelectTrigger>
    <SelectValue placeholder="..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="...">Label</SelectItem>
  </SelectContent>
</Select>

// Tabs
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content</TabsContent>
</Tabs>

// Notifications
toast.success("Message")
toast.error("Error")
```

### Icons (Lucide React)
All icons available from `lucide-react`:
```typescript
import { Home, MessageSquare, Map, Users, Search, etc. } from "lucide-react"
<Home className="h-5 w-5" />
```

---

## 5. COLOR SYSTEM & THEMING

### Current CSS Variables (Tailwind Config)
```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--primary: 221.2 83.2% 53.3%;
--primary-foreground: 210 40% 98%;
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;
--border: 214.3 31.8% 91.4%;

/* Dark Mode (auto-switches based on system preference) */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--card: 222.2 84% 4.9%;
--primary: 217.2 91.2% 59.8%;
```

### Usage in Designs
- Primary action buttons: `bg-primary text-primary-foreground`
- Cards: `bg-card border-border`
- Text: `text-foreground` (main), `text-muted-foreground` (secondary)
- Backgrounds: `bg-background`

**All designs must specify colors using Tailwind classes, NOT hex codes**

---

## 6. TYPOGRAPHY SYSTEM

### Current Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes (Tailwind)
- `text-xs` (12px) - Timestamps, metadata
- `text-sm` (14px) - Secondary text, captions
- `text-base` (16px) - Body text (default)
- `text-lg` (18px) - Subheadings
- `text-xl` (20px) - Card titles
- `text-2xl` (24px) - Section headings
- `text-3xl` (30px) - Page titles
- `text-5xl` (48px) - Hero text

### Font Weights
- `font-normal` (400) - Body text
- `font-medium` (500) - Emphasized text
- `font-semibold` (600) - Card titles
- `font-bold` (700) - Section headings
- `font-black` (900) - Hero text

---

## 7. LAYOUT PATTERNS

### Navigation Structure
**Top Navigation Bar** (sticky, all pages):
- Logo + "Virgil St" wordmark (left)
- Main nav links (center, hidden on mobile)
- User menu / Sign In (right)

**Mobile Navigation:**
- Hamburger menu → Sheet/Drawer from left
- Bottom tab bar (optional, for main features)

**Container Widths:**
- Default: `max-w-7xl mx-auto px-4` (1280px)
- Narrow: `max-w-4xl` (896px) for reading content
- Wide: `max-w-screen-2xl` (1536px) for dashboards

### Grid Patterns
- Feature grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Resource list: `grid grid-cols-1 gap-4`
- Admin tables: `w-full table-auto`

---

## 8. ACCESSIBILITY REQUIREMENTS

### WCAG 2.1 Level AA Compliance
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- All interactive elements keyboard navigable
- Focus indicators on all focusable elements
- ARIA labels on icon-only buttons
- Alt text on all images
- Form labels associated with inputs

### Screen Reader Support
- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- Landmark regions with `aria-label`
- Live regions for dynamic content (`aria-live="polite"`)

---

## 9. DATA DISPLAY FORMATS

### Dates & Times
```typescript
// Display format
new Date(timestamp * 1000).toLocaleDateString() // "1/15/2025"
new Date(timestamp * 1000).toLocaleTimeString() // "3:30 PM"

// Relative time (nice to have)
"2 hours ago", "Yesterday", "Last week"
```

### Numbers
- View counts: `1,234 views`
- Upvotes: `42 upvotes`
- Distance: `0.5 mi`, `2.3 mi`

### Phone Numbers
- Format: `(555) 123-4567`
- Click to call: `tel:+15551234567`

### Addresses
```
123 Main St
Los Angeles, CA 90012
```

---

## 10. INTERACTION PATTERNS

### Loading States
- Full page: Centered spinner with logo
- Cards: Skeleton loaders (gray animated rectangles)
- Buttons: Spinner inside button, disabled state
- Chat: Typing indicator (3 animated dots)

### Empty States
- No data: Friendly illustration + message + CTA
- Example: "No forum posts yet. Start a conversation!"

### Error States
- Form validation: Red border + error text below field
- API errors: Toast notification (top-right)
- 404 pages: Friendly message + link to home

### Success Feedback
- Toast notifications (green checkmark + message)
- Inline success messages (forms)
- Optimistic updates (update UI before API confirms)

---

## 11. MOBILE-SPECIFIC CONSIDERATIONS

### Touch Gestures
- Swipe to delete (lists)
- Pull to refresh (feeds)
- Pinch to zoom (map)

### Bottom Sheets
- Map pin details
- Resource details
- Filter options

### Offline Support
- Cache static content (guides, videos)
- Show offline indicator
- Queue actions when offline

### Performance
- Lazy load images
- Virtual scrolling for long lists
- Code splitting by route

---

## 12. CONTENT GUIDELINES

### Voice & Tone
- **Empathetic:** "We know this is hard. We're here to help."
- **Clear:** No jargon, plain language
- **Respectful:** Dignity-first, no stigma
- **Actionable:** Focus on "what to do next"

### Copy Examples
- ❌ "Access our comprehensive suite of social service offerings"
- ✅ "Find food, shelter, and healthcare near you"

- ❌ "Unauthorized access detected"
- ✅ "Please sign in to continue"

### Button Labels
- Primary actions: "Find Resources", "Get Help", "Chat with Virgil"
- Secondary actions: "Learn More", "View Details", "Filter"
- Destructive actions: "Delete", "Remove", "Cancel"

---

## 13. SAMPLE USER FLOWS

### Flow 1: Finding a Shelter
1. User lands on homepage
2. Clicks "Find Resources" button
3. Filters by "Shelter" + "Koreatown"
4. Views list of 12 shelters
5. Clicks on "PATH Shelter"
6. Sees details (address, phone, hours, services)
7. Clicks "Get Directions" → Opens Google Maps

### Flow 2: Asking Virgil a Question
1. User clicks "Talk to Virgil" from homepage
2. Chat interface opens
3. Types: "How do I apply for Medi-Cal?"
4. AI searches knowledge base (loading indicator)
5. Response streams in with sources
6. User clicks source link to read full guide

### Flow 3: Posting to Forum (Anonymous)
1. User navigates to `/forum`
2. Clicks "New Post" button
3. Fills form: title, category, content
4. Toggles "Post Anonymously"
5. Clicks "Submit"
6. Redirected to post detail page
7. Sees "Posted by Anonymous"

---

## 14. TECHNICAL SPECIFICATIONS FOR HANDOFF

### Required Deliverables
1. **Figma File** with:
   - All pages (desktop, tablet, mobile)
   - Component library (matching shadcn/ui)
   - Color styles (using Tailwind names)
   - Text styles (using Tailwind classes)
   - Responsive layouts with breakpoints
   - Interactive prototypes for key flows

2. **Design Tokens**:
   ```json
   {
     "spacing": "Tailwind scale (4px increments)",
     "borderRadius": "rounded-sm|md|lg|xl|2xl",
     "shadows": "shadow-sm|md|lg|xl|2xl",
     "transitions": "transition-all duration-200"
   }
   ```

3. **Asset Export**:
   - Logo (SVG)
   - Icons (if custom, otherwise use Lucide)
   - Illustrations (SVG or optimized PNG)

### Component Mapping
When designing, think in terms of these existing components:
- **Card layouts** → Use `<Card>` component
- **Buttons** → Use `<Button>` with variants
- **Forms** → Use `<Input>`, `<Select>`, `<Textarea>`
- **Modals** → Use `<Dialog>` component
- **Navigation** → Use `<Tabs>` or custom nav

### CSS Framework
- **Only Tailwind classes** (no custom CSS unless absolutely necessary)
- Use utility classes: `flex`, `grid`, `p-4`, `mt-2`, etc.
- Responsive prefixes: `md:flex-row`, `lg:grid-cols-3`

---

## 15. CURRENT PAIN POINTS TO SOLVE

### Design Problems in Existing UI:
1. **Homepage is cluttered** - Too many feature cards, unclear hierarchy
2. **Forum feels generic** - Doesn't reflect community focus
3. **Map UI is basic** - Filter UI is unclear, pin icons are stock
4. **Chat interface is bare** - No personality, hard to read sources
5. **Admin dashboard is utilitarian** - Works but not delightful
6. **Mobile nav is cramped** - Hard to navigate on small screens
7. **No onboarding flow** - New users don't know where to start
8. **Inconsistent spacing** - Some pages feel cramped, others sparse

### User Experience Goals:
- **Faster time to help** - User finds resource in <2 minutes
- **Trustworthy** - Design conveys professionalism + empathy
- **Accessible** - Works on old phones, slow connections
- **Memorable** - Distinctive visual identity (not generic Bootstrap)

---

## 16. INSPIRATION & REFERENCES

### Similar Platforms (for reference):
- **211.org** - Social services directory
- **Nextdoor** - Community forum
- **Waze** - Crowdsourced map with live updates
- **Discord** - Chat + community features

### Design Styles to Consider:
- **Friendly, not corporate** - Warm colors, rounded corners
- **Information-dense but scannable** - Use of whitespace, clear hierarchy
- **Bold typography** - Strong headings, clear CTAs
- **Iconography** - Custom icons for resource types

---

## 17. FILE STRUCTURE FOR DEVELOPERS

When you finish designs, we'll implement using this structure:
```
client/src/
├── components/
│   ├── ui/ (shadcn components - DON'T redesign structure, just style)
│   ├── layout/ (Nav, Footer, Sidebar)
│   └── features/ (Map, Chat, Forum components)
├── pages/ (One file per route)
├── styles/
│   └── globals.css (Tailwind + CSS variables)
```

**Key Rule:** Designs should map 1:1 to existing component structure where possible.

---

## 18. QUESTIONS FOR YOUR DESIGN GPT

Before starting, ask these:
1. Should the design lean more **modern/minimalist** or **warm/friendly**?
2. Primary brand color: Keep blue or explore new palette?
3. Hero section style: Bold typography or illustration-focused?
4. Map pins: Custom icons or stick with simple shapes?
5. Chat bubbles: Rounded or angular? Tail or no tail?
6. Forum: Compact (Reddit-style) or spacious (Facebook-style)?
7. Dark mode: Always on, always off, or user toggle?

---

## 19. BRAND ATTRIBUTES

### Current Logo
- Shield icon (represents protection/trust)
- "Virgil St" wordmark (simple sans-serif)

### Brand Personality
- **Guide, not gatekeeper** - Helpful navigator
- **Street-smart** - Understands real-world challenges
- **Respectful** - Treats users with dignity
- **Resourceful** - Always finds a solution

### Tagline Options (not set yet):
- "Navigate the system"
- "Your survival companion"
- "Simplify the system"

---

## 20. SUCCESS METRICS

Designs should optimize for:
- **Task completion rate** - Can user find shelter info?
- **Time on task** - How fast can they get help?
- **Return visits** - Do users come back?
- **Mobile usage** - 70%+ of users on mobile

---

## FINAL CHECKLIST FOR DESIGN HANDOFF

- [ ] All pages designed (desktop, tablet, mobile)
- [ ] Dark mode versions
- [ ] Component library matches shadcn/ui structure
- [ ] Colors specified as Tailwind classes
- [ ] Spacing uses Tailwind scale (p-4, mt-2, etc.)
- [ ] Fonts use Tailwind sizes (text-sm, text-lg, etc.)
- [ ] Icons sourced from Lucide React
- [ ] Responsive breakpoints defined (sm, md, lg)
- [ ] Loading/empty/error states designed
- [ ] Interactive prototypes for key flows
- [ ] Assets exported (SVG logos, illustrations)
- [ ] Accessibility notes (contrast, focus states)

---

**Contact for Questions:** Brandon (Developer)
**Timeline:** TBD
**Priority Pages:** Home, Chat, Map, Resources

---

Good luck! Let's create something that truly helps people. 🚀
