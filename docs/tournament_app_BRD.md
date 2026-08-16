# Business Requirements Document
## Ice Breaker Tournament Management App

**Prepared for:** Paul Arnevik, Tournament Director, Ice Breaker Youth Lacrosse Tournament (CDAA)
**Version:** 1.0 (Draft)

---

## 1. Problem Statement

Planning the Ice Breaker tournament currently relies on spreadsheets and manual email tracking across many moving parts: association outreach, vendor coordination, budgeting, field prep, volunteer delegation, and roster/waiver collection. This creates disorganization and stress, and makes it hard to see the full state of planning in one place.

**Note:** Game scheduling, scores, and in-tournament operations are explicitly out of scope — those remain in Tourney Machine. This app owns everything that happens *before* the tournament weekend.

---

## 2. Users & Roles

| Role | Access | Description |
|---|---|---|
| **Tournament Director** (Paul) | Full read/write | Primary and default user. Manages all planning activities. |
| **Board Members** | Read-only + assigned tasks | Slimmed-down version of the director view. Can see vendors, budget, plans, and tasks assigned to them, but cannot edit most data. |
| **Public (teams/fans)** | No login required | View-only public site: registration status, tournament updates, and the waiver form. |

**Authentication:** Google OAuth (director logs in with tournament director Google account; board members log in the same way).

---

## 3. Success Criteria

The app is successful if it:
1. Replaces spreadsheets and scattered manual emails as the system of record for planning
2. Reduces stress by giving one comprehensive place to manage all planning activity
3. Makes it easier to organize and track everything needed to run the tournament

---

## 4. Must-Have Features (v1)

### 4.1 Association & Team Management
- Track associations, their contacts, and registered teams (teams belong to associations)
- Track separate contacts for associations vs. teams where they differ
- Manually mark/track registration status (actual registration happens in SportsEngine; this app just tracks status)

### 4.2 Communication (Email)
- Gmail integration using the tournament-specific email address, so all outbound email history is stored in that inbox
- Send and track email communications to associations and vendors from within the app
- **Bulk/campaign email:** ability to send a single email to all associations, or a selected subset, in one send — via BCC through the connected Gmail account (not individual one-off sends)
- **Team-level communication:** once a team is registered, ability to email its team-level contacts directly (separate from the association's contacts, since they may differ) — including bulk/BCC sends to all registered teams or a selected subset
- **Save-the-date / marketing emails:** ability to send announcement-style emails (tournament dates, registration open/how-to-register instructions, etc.) to all associations/contacts or a selected subset — sent before teams have registered for that year. Paul will typically compose the content himself outside the app and paste it in rather than the app generating copy.

### 4.3 Texting (lightweight)
- "Text" button next to a contact opens the phone's native messaging app pre-filled with that contact's number
- No in-app SMS sending/receiving required

### 4.4 Task & Planning Management
- Create and manage tasks/activities with a planning timeline
- Use the existing Ice Breaker planning document (phases, roles, lessons learned) as the source structure/guidance for default tasks
- Reusable baseline project plan/template for major planning activities, so each new tournament year's task list can start from that template rather than from scratch (major tasks are similar year to year, even if specific dates/details shift)
- Ability to assign tasks to board members (nice-to-have, see Section 5)

### 4.5 Vendor Management
- Track vendors (EMT, portable toilets, food trucks, merch, referees/assigner, golf carts, etc.)
- Track vendor contact info and commitment status (committed to attend vs. not)
- Send/track emails to vendors from the app

### 4.6 Budget Tracking
- Track forecasted expenses vs. actuals

### 4.7 Field & Division Setup
- Specify number of available fields
- Specify which divisions can play on which fields
- Divisions default to 8U/10U/12U/14U but must be editable (add/remove), including potential skill-level splits (e.g., upper/lower) determined later in registration

### 4.8 Scheduling Guidance (not schedule creation)
- Given registered teams per division, help Paul figure out pool/bracket structure (e.g., single vs. multiple pools) as guidance for building the actual schedule in Tourney Machine
- This is advisory only — no schedule is created or stored in this app

### 4.9 Rosters & Waivers
- Publicly accessible waiver form, submittable without login, linked to a team's roster
- Waivers are not publicly visible/viewable once submitted
- Rosters are uploaded manually by Paul to the team's record (teams do not upload their own rosters)
- **Roster status tracking:** ability to see, per team, whether a roster has been submitted/uploaded yet
- **Waiver status tracking:** ability to see, per team/roster, which individual players have and have not submitted a waiver
- **QR code check-in:** a QR code (specific to that tournament year) that Paul can display at the registration table during the event; scanning it takes a parent directly to the waiver form so they can submit on the spot if they haven't already
- **Waivers are tournament-year specific:** each tournament year has its own waiver (e.g., "2026 waiver," "2027 waiver"), consistent with the app's overall multi-year structure (see 4.11)

### 4.10 Public-Facing Site
- Public pages showing: registration status/progress, general tournament updates
- No login required for this view
- **Draft/publish workflow:** Paul can stage edits to the public site without those changes going live immediately, then publish when ready
- **Maintenance mode:** Paul can take the public site offline temporarily (e.g., show a "back soon" message) without affecting the underlying data

### 4.11 Multi-Year Tournament Management
- The app manages tournaments annually. All tasks, activities, vendors, associations/teams, budget items, etc. are associated with a specific tournament year (e.g., "2026 Ice Breaker")
- **Team registration is tournament-specific:** a team's registration status, roster, and waivers all belong to a single tournament year and do not carry forward automatically. If the same team returns the next year, it re-registers, submits a new roster, and players submit new waivers for that year. (Associations and their base contacts are more likely to carry over as-is — see the "year-over-year copying" open item below.)
- Paul can create a new tournament record for each year (e.g., 2027) and reuse/copy relevant information from the prior year's tournament rather than starting from scratch
- Once a tournament year concludes, Paul can close it out; the app should support archiving a closed tournament while retaining its data for future reference/reuse
- **Public site is per-year:** each tournament year has its own public-facing site instance. When a tournament year closes, its public site can be disabled/taken down, and a new public site is stood up for the next year's tournament using the same framework with updated information
- Each tournament year's public site should have a distinct/unique URL (or equivalent way to separate years), so old and new tournament info don't overlap or conflict

### 4.12 Platform Requirements
- Mobile-friendly / responsive design
- Deployed on a custom domain (likely via Vercel)
- Connected database
- Secure, authenticated access (Google OAuth)

---

## 5. Nice-to-Have (Future / Post-v1)

- Board member portal: read-only view of vendors, budget, and full planning content (may include pasted content from the planning doc)
- Task assignment to specific board members, trackable in one place

---

## 6. Data Model (Initial)

- **Tournament** — year (e.g., 2026), status (active/closed/archived), public site URL/slug. Tournament-specific records below belong to a specific Tournament.

**Persistent (not tied to a tournament year — carry forward automatically):**
- **Associations** — name
- **Contacts** — general association-level and vendor-level contacts
- **Vendors** — type (EMT, toilets, food truck, merch, referees/assigner, golf carts, etc.), contact info. Commitment/registration status for a given year is tracked separately (see below).
- **Users** — director (full access), board members (read-only + tasks)

**Tournament-specific (reset or newly created each year):**
- **Budget items** — category, forecasted amount, actual amount — specific to one Tournament
- **Tasks/Activities** — description, planning phase/timeline, assignee, status — specific to one Tournament, but generated from a reusable **baseline project plan/template** (major planning activities are similar year to year, so Paul can start a new tournament's task list from that template rather than from scratch)
- **Vendor status (per tournament)** — a status field tied to a Vendor + Tournament pair (e.g., "committed for 2026"), reset to blank when a new tournament year is created — the underlying Vendor record itself persists
- **Teams** — belongs to an Association AND to a specific Tournament (registration status, division, roster [manually uploaded], linked waivers — new Team record each year)
- **Team contacts** — team-level contacts (e.g., manager, coach) tied to a Team, and therefore also specific to that tournament year
- **Waivers** — linked to a Team/player within a specific Tournament year, submission data, not publicly viewable
- **Divisions** — 8U/10U/12U/14U by default, editable; optional skill-level sub-split per division (tournament-specific, since division setup could change year to year)
- **Fields** — number of fields, division eligibility per field (tournament-specific, since venue/field availability could change)

---

## 7. Explicitly Out of Scope

- Game scheduling (Tourney Machine)
- Game scores (Tourney Machine)
- Payments and billing (handled outside the system)
- Team registration itself (handled in SportsEngine)
- Referee assignment (handled by assigner independently)

---

## 8. Open Items / Assumptions to Confirm

- **Texting:** Confirmed as "click to open native messaging app" — no in-app SMS sending required, avoiding the cost/complexity of an SMS service like Twilio.
- **Board roles:** Confirmed as a single "read-only + tasks" tier rather than granular per-position permissions. Can be revisited if specific board roles (e.g., Fundraising Director vs. Equipment Director) need different views later.
- **Gmail integration:** Assumes Paul will connect the specific tournament Gmail account during setup; needs Google API access configured.
- ~~Year-over-year copying~~ — **Resolved:** see Section 6 for the confirmed persistent vs. tournament-specific data split.
