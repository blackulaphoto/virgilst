# Virgil St. - Project TODO

## Phase 1: Design System & Structure
- [x] Set up dark gritty urban design system with amber/yellow accents
- [x] Configure Tailwind theme with custom colors and typography
- [x] Add street-inspired fonts (bold sans-serif)
- [x] Create base layout structure with mobile-first navigation
- [x] Set up theme provider for dark mode

## Phase 2: Database Schema
- [x] Create articles table (title, content, category, tags)
- [x] Create resources table (name, type, address, phone, filters)
- [x] Create map pins table (title, type, lat, lng, notes, user submitted)
- [x] Create forum posts table (title, content, category, anonymous option)
- [x] Create forum comments table (nested threading support)
- [x] Create video links table (title, url, category, description)
- [x] Create chat conversations table (user messages and AI responses)
- [x] Add indexes for search optimization

## Phase 3: AI Case Manager
- [x] Build chat interface component with message history
- [x] Integrate LLM with system prompt for social services guidance
- [ ] Upload and process knowledge files (PDFs, markdown guides)
- [ ] Implement RAG system for knowledge base queries
- [x] Add suggested prompts for common questions
- [x] Create conversation persistence for logged-in users
- [x] Add markdown rendering for AI responses
- [ ] Implement streaming responses for better UX

## Phase 4: Resource Library
- [ ] Create article listing page with category filters
- [ ] Build article detail page with mobile-optimized reading
- [ ] Implement keyword search across articles
- [ ] Add article categories (Benefits, Housing, Legal, Health)
- [ ] Import existing knowledge files as articles
- [ ] Add text-to-speech option for accessibility
- [ ] Create admin interface for article management

## Phase 5: Interactive Map
- [ ] Integrate Google Maps with custom styling
- [ ] Create map pin types (Safe Zones, Resources, Warnings)
- [ ] Build pin submission form for community contributions
- [ ] Add filter controls for pin types
- [ ] Implement pin detail popups with info
- [ ] Add moderation queue for user-submitted pins
- [ ] Create "Get Directions" functionality
- [ ] Add geolocation for nearby resources

## Phase 6: Community Forum
- [ ] Build forum home with category listing
- [ ] Create thread listing page with sorting options
- [ ] Build thread detail page with nested comments
- [ ] Implement anonymous posting option
- [ ] Add upvoting/helpful marking system
- [ ] Create moderation tools for admins
- [ ] Add "Ask Virgil" button to send posts to AI
- [ ] Implement search across forum posts

## Phase 7: Video Player
- [ ] Create video library page with categories
- [ ] Build YouTube embed player component
- [ ] Import video links from provided data
- [ ] Add category tabs (How-To, Legal, Recovery, Hacks)
- [ ] Create video playlist functionality
- [ ] Add video descriptions and metadata

## Phase 8: Search & Navigation
- [ ] Implement global search across all modules
- [ ] Create search results page with filters
- [ ] Add search by type (articles, forum, resources, map)
- [ ] Build mobile navigation menu
- [ ] Add breadcrumb navigation
- [ ] Create quick access shortcuts

## Phase 9: Admin Dashboard
- [ ] Build admin layout with sidebar navigation
- [ ] Create content moderation interface
- [ ] Add resource management CRUD
- [ ] Build map pin approval system
- [ ] Create forum moderation tools
- [ ] Add user management interface
- [ ] Implement analytics dashboard

## Phase 10: Performance & Optimization
- [ ] Implement offline caching for articles
- [ ] Optimize images and assets for slow connections
- [ ] Add progressive web app (PWA) capabilities
- [ ] Minimize bundle size for cheap phones
- [ ] Add loading skeletons for better perceived performance
- [ ] Implement lazy loading for images and components
- [ ] Test on low-end devices and slow networks

## Phase 11: Testing & Polish
- [ ] Write vitest tests for critical features
- [ ] Test all features on mobile devices
- [ ] Verify accessibility standards
- [ ] Test with screen readers
- [ ] Validate all forms and inputs
- [ ] Test authentication flows
- [ ] Verify admin role-based access
- [ ] Final UI polish and consistency check


## ✅ Completed Features (Phase 1)

### Core Infrastructure
- [x] Dark gritty urban design system with amber accents
- [x] Database schema for all modules
- [x] tRPC API routers with authentication
- [x] Sample data seeded

### Pages Built
- [x] Hero home page with feature cards
- [x] AI chat interface with conversation history
- [x] Resource library listing with category filters
- [x] Article detail page with markdown rendering
- [x] Community forum listing
- [x] Video library with YouTube embeds
- [x] Global search across all content types

### Tests
- [x] Unit tests for all routers (16 tests passing)


## Forum Enhancements (Current)
- [x] Create forum post detail page with full content display
- [x] Build threaded reply system with nested comments
- [x] Implement upvoting for posts and replies
- [x] Add reply form with anonymous option
- [x] Create new post form with category selection
- [x] Add optimistic updates for voting
- [x] Display vote counts and reply counts
- [x] Add "Ask Virgil" button to send post to AI chat


## Interactive Map (Current)
- [x] Integrate Google Maps with Manus proxy
- [x] Display map pins for safe zones and resources
- [x] Add custom markers for different pin types
- [x] Create pin detail popups with info
- [x] Build filter controls for pin types
- [x] Create pin submission form for community contributions
- [x] Add geolocation for "near me" functionality
- [x] Implement admin approval queue for user-submitted pins
- [x] Seed sample map pins with realistic locations


## Map Pin Comments (Current)
- [x] Add pinComments table to database schema
- [x] Create API endpoints for listing and creating pin comments
- [x] Build comment section UI in map pin info windows
- [x] Add real-time comment display with timestamps
- [x] Implement comment submission form (requires auth)
- [ ] Add comment count badge to map markers
- [x] Write tests for pin comments functionality


## Admin Dashboard (Current)
- [x] Create admin layout with sidebar navigation
- [x] Build guide management section (upload, edit, delete articles)
- [x] Build video management section (add videos to Virgil TV)
- [x] Build resource management section (add/edit resource links)
- [x] Build map pin moderation queue (approve/reject pending pins)
- [x] Build forum moderation tools (flag/delete posts and replies)
- [x] Build user management section (view users, change roles, monitor activity)
- [x] Add admin-only route protection
- [x] Create admin dashboard tests


## Favorites System (Current)
- [x] Create favorites database tables (bookmarked articles, saved map pins, followed forum threads)
- [x] Add API endpoints for adding/removing favorites
- [x] Build bookmark button for articles
- [ ] Build save button for map pins
- [x] Build follow button for forum threads
- [x] Create favorites page showing all saved items
- [x] Add favorites count badges
- [x] Write tests for favorites functionality


## Content Creation from Knowledge Files (Current)
- [x] Extract content from knowledge files in /home/ubuntu/upload/knowledgefiles/
- [x] Create articles about housing rights and tenant protections
- [x] Create articles about food assistance programs (CalFresh, food banks)
- [x] Create articles about healthcare access (emergency care, clinics)
- [x] Create articles about legal aid and public defenders
- [ ] Create articles about employment resources and job training
- [x] Create articles about mental health services and crisis support
- [ ] Create articles about substance abuse treatment resources
- [x] Add all new articles to database via admin interface or seed script


## Treatment Center Directory (Current)
- [x] Research treatment centers from soberhousing.net for CA
- [x] Research treatment centers from recovery.com for CA
- [x] Create treatmentCenters database table with fields for insurance, couples, services
- [x] Build treatment directory page with filtering by type, insurance, location
- [x] Add detailed facility pages with contact info and services
- [x] Embed SBAT map (https://sapccis.ph.lacounty.gov/sbat/) in iframe
- [x] Add 211 resource map integration
- [x] Create admin interface for adding/editing treatment centers
- [x] Add search functionality for treatment centers


## Treatment Directory Expansion (Current)
- [x] Research Medi-Cal accepting facilities in Orange County
- [x] Research Medi-Cal accepting facilities in San Diego County
- [x] Research Medi-Cal accepting facilities in Riverside County
- [x] Add 10-15 new treatment centers to database
- [x] Verify all facility information (phone, address, services)
- [x] Test filtering and search with expanded directory


## Video Library Enhancement (Current)
- [x] Review existing Videos page implementation
- [x] Add curated survival video content (legal help, benefits, street hacks)
- [x] Enhance category system with better organization
- [x] Add video descriptions and metadata
- [x] Improve YouTube embed player component
- [x] Create playlist functionality for related videos
- [x] Add video search and filtering
- [x] Seed database with 20+ helpful videos


## YouTube Playlist Import (Current)
- [x] Fetch video data from provided YouTube playlist
- [x] Extract video IDs, titles, and descriptions
- [x] Import all playlist videos into Virgil TV database
- [x] Ensure videos display as individual library items
- [x] Test video playback and filtering


## Massive Treatment Directory Expansion (Current)
- [x] Extract all facilities from Referrals-SoCal-1.pdf
- [x] Extract all facilities from knowledge files
- [x] Research additional California treatment centers online
- [x] Add 50+ new treatment facilities to database
- [x] Verify contact information for all facilities
- [x] Organize by county and service type
- [x] Test search and filtering with expanded directory


## Find Treatment Now Wizard (Current)
- [x] Design multi-step wizard flow with question progression
- [x] Create wizard UI component with step indicators
- [x] Add questions: location (county), insurance type, gender preference, couples acceptance, detox needed, housing type
- [x] Build recommendation algorithm that scores facilities based on user answers
- [x] Create API endpoint to get top 3 recommended facilities
- [x] Display results with facility details and "Contact Now" buttons
- [x] Add ability to restart wizard or refine search
- [x] Write tests for recommendation algorithm


## Dental Resources (Current)
- [x] Extract 10 dental clinics from provided list
- [x] Add dental services to resources database
- [x] Include addresses, phone numbers, hours, and cost information
- [x] Tag resources with "dental", "emergency", "sliding_scale", "free"
- [x] Test dental resource display and filtering


## Resource Map View (Current)
- [x] Add latitude and longitude fields to resources table schema
- [x] Geocode all existing resources (dental, shelters, food banks, etc.)
- [x] Create resource map page showing all resources as markers
- [x] Add filtering by resource type (dental, shelter, food, medical, etc.)
- [x] Implement "near me" functionality using geolocation
- [x] Add resource detail popups when clicking markers
- [x] Test map display and filtering with all resource types


## RAG/Search System for Virgil AI (Current)
- [x] Extract text content from knowledge files (PDFs, markdown guides)
- [x] Create knowledge base table in database with chunks and metadata
- [x] Build embedding generation system for semantic search
- [x] Implement RAG search endpoint to query knowledge base
- [x] Add web scraping functionality to fetch and extract URL content
- [x] Integrate SerpAPI for Google search capabilities
- [x] Enhance Virgil AI chat to use tool calling (search knowledge, scrape web, search Google)
- [x] Update chat UI to display sources and citations
- [x] Add "Sources" section showing referenced documents/URLs
- [ ] Index knowledge files by running indexing script
- [ ] Test RAG search with sample questions about benefits, housing, legal issues
- [ ] Test web scraping with resource URLs
- [ ] Test SerpAPI integration with current resource searches (requires SERPAPI_KEY)


## User Profile System (Current)
- [x] Extend user schema with profile fields (displayName, bio, location, avatar, profileComplete)
- [x] Create user profile page showing identity, stats, and activity
- [x] Build profile editing interface for updating bio, avatar, location
- [x] Add avatar upload functionality with S3 storage
- [x] Create sign-up onboarding flow for new users
- [x] Display user avatars and names on forum posts
- [x] Display user avatars and names on forum replies
- [ ] Display user identity on map pin submissions
- [ ] Display user identity on map pin comments
- [x] Add activity stats (posts created, replies made, pins submitted, comments posted)
- [ ] Create user profile link from forum posts/replies
- [ ] Add "View Profile" option throughout the site
- [ ] Test profile creation and editing
- [ ] Test user identity display across all features


## Clickable Profile Links (Current)
- [x] Add /profile/:userId route to view other users' profiles
- [x] Make user avatars clickable in forum post list
- [x] Make user names clickable in forum post list
- [x] Make user avatars clickable in forum replies
- [x] Make user names clickable in forum replies
- [x] Make user avatars clickable in post detail page
- [ ] Test profile links navigation


## Legal Case Management System (Current - TOP PRIORITY)
### Database & Core Infrastructure
- [x] Create legalCases table (type: custody_reunification | record_expungement, status, userId)
- [x] Create calendarEvents table (court dates, deadlines, appointments with reminders)
- [x] Create caseDocuments table (required forms, completion status, upload tracking)
- [x] Create caseMilestones table (progress tracking for each case type)
- [x] Add calendar endpoints to routers (create event, list events, update, delete)
- [x] Add case management endpoints (create case, update progress, track documents)

### Calendar System
- [x] Build calendar page with month/week/day views
- [x] Add court date creation form with reminder settings
- [ ] Add form deadline tracking with countdown timers
- [ ] Implement email/SMS reminders for upcoming dates (24hr, 1week before)
- [ ] Add "Add to Google Calendar" export functionality
- [x] Color-code events by type (court dates=red, deadlines=orange, appointments=blue)

### Document Tracking System
- [ ] Create document checklist component for each case type
- [ ] Build document upload interface with S3 storage
- [ ] Add document completion status tracking (not started, in progress, completed)
- [ ] Create document templates library (downloadable PDFs for each form)
- [ ] Add AI-powered form helper to explain what each document means
- [ ] Implement document verification checklist before submission

### Child Custody Reunification Workflow
- [ ] Create custody reunification roadmap page with step-by-step guide
- [ ] Add required documents checklist (parenting plan, home study, etc.)
- [ ] Build progress tracker showing: assessment → classes → visits → court → reunification
- [ ] Add parenting class tracker with completion certificates
- [ ] Create supervised visit log with notes and progress tracking
- [ ] Implement case worker contact management
- [ ] Add AI guidance for each stage with common questions and answers

### Record Expungement Workflow  
- [ ] Create expungement eligibility checker (interactive questionnaire)
- [ ] Build expungement roadmap page with timeline estimates
- [ ] Add required forms checklist (petition, declaration, order, etc.)
- [ ] Create county-specific filing instructions
- [ ] Add court filing fee calculator and waiver eligibility check
- [ ] Implement hearing preparation guide with AI Q&A
- [ ] Add post-expungement verification tracker

### AI Assistant Integration
- [ ] Create floating AI assistant button (always visible, bottom-right)
- [ ] Build AI chat interface with context awareness of current page
- [ ] Implement proactive AI popups triggered by user confusion signals:
  * Time spent on page > 30 seconds without interaction
  * Multiple back/forward navigation
  * Hovering over form fields without filling
  * Viewing same page multiple times
- [ ] Add AI-powered question suggestions based on user's case type and progress
- [ ] Create AI form helper that explains legal jargon in plain language
- [ ] Implement AI court date preparation assistant (what to wear, bring, say)
- [ ] Add AI document review to check if forms are complete before filing
- [ ] Build AI case strategy advisor suggesting next best steps

### Smart Guidance Features
- [ ] Add contextual help tooltips on every legal term
- [ ] Create "What should I do next?" AI recommendation engine
- [ ] Build "Common mistakes to avoid" warnings for each stage
- [ ] Implement "Questions to ask your lawyer/case worker" generator
- [ ] Add success stories and testimonials for motivation
- [ ] Create emergency resources quick access (crisis hotlines, legal aid)

### Testing & Delivery
- [ ] Write tests for calendar CRUD operations
- [ ] Write tests for case management workflows
- [ ] Write tests for document tracking system
- [ ] Write tests for AI guidance triggers
- [ ] Test full custody reunification flow end-to-end
- [ ] Test full expungement flow end-to-end
- [ ] Verify AI assistant appears at correct confusion points


## Floating AI Assistant (Current)
- [x] Create FloatingAIAssistant component with chat interface
- [x] Position button in bottom-right corner, always visible
- [x] Add context detection system (detect current page, user activity)
- [x] Integrate with existing Virgil AI chat backend
- [x] Add legal-specific guidance prompts for forms and processes
- [x] Implement minimized/expanded states for the assistant
- [x] Add quick action buttons (explain form, what's next, common questions)
- [ ] Test assistant on different pages (calendar, cases, forum, resources)
