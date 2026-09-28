# Jewelry Store Management — Interactive Demo & Project Story

An Arabic, right-to-left web application developed for the daily operations of a real jewelry business: recording customers and orders, managing individual pieces and photos, organizing work, and tracking collection.

This repository contains an independent, browser-only portfolio demo. Business branding, customer records, original photographs, credentials, and production connection details are excluded. The project story below describes the original application's development; the demo deliberately simulates only part of that system.

## Run the demo

On Windows, double-click `start-demo.cmd`. With Python available, it starts a local preview at http://127.0.0.1:8876/. Keep the terminal window open while using the application.

Alternatively, serve this directory with any static HTTP server:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000/. Use the same host and port across pages. Opening HTML files directly through `file://` can produce inconsistent cross-page storage behavior.

No build step, account, backend credentials, or database service is required. The interface is in Arabic; the introductory dialog is available in Arabic and English.

## Explore the workflow

1. Read the introduction and select **Explore the demo**.
2. Create a repair, engraving, watch-repair, or catalog order using fictional information.
3. Open order management to inspect the order, edit pieces and photos, change its status, and record collection.
4. Explore customer management, catalog management, and simulated label/message previews.
5. Use **Reset demo** to restore the sample records.

Changes stay in the current browser profile and origin. Tabs on the same origin share the demo data; different devices and browsers do not. Uploaded images are processed locally, and browser storage limits apply. If persistent storage is unavailable, a visible warning explains that changes are limited to the current page.

## How the project began

The initial goal was to replace paper order sheets and information scattered across messages with a single digital workflow. Recording an order was only the first step: the business also needed to know which pieces belonged to each customer, what work each piece required, which orders were finished, and which had actually been collected.

The first version focused on a form that saved an order and its customer information. Real usage gradually expanded the scope: reusing customer records, attaching photos, including several pieces in one order, selecting catalog models, printing labels, and reminding staff about work still needing attention.

The original application evolved into an installable Progressive Web App (PWA). Its purpose is internal operations management; it is not a complete accounting system or a public online store.

## My role and development approach

I developed the project independently with assistance from AI tools. The work involved translating business requirements into screens and data structures, connecting the frontend to backend services, adding features incrementally, diagnosing failures, and checking fixes against existing workflows.

The development history reflects an application maintained through practical feedback rather than a single isolated implementation. This account does not claim that every line was written without assistance, or attach unsupported figures to revenue, user growth, or time saved.

## Original application capabilities

| Area | Capability |
| --- | --- |
| Customers | Search, reuse, and edit customer records; apply order-aware deletion rules. |
| Orders | Repair, engraving, catalog, and watch-repair workflows. |
| Individual pieces | Several pieces per order, each with its own fields, photos, and notes. |
| Catalog | Categorized models, model management, and multi-model cart orders. |
| Order management | Card and table views, search, filters, details, and editing of pieces and creation dates. |
| Priorities | Urgent, high, and normal priorities with badges, filtering, and direct updates. |
| Collection | Separate completion of work from physical collection by the customer. |
| Printing | Queue a label-printing job for a service running on the business's computer. |
| Market information | Display gold, silver, and exchange-rate information through a server-side integration. |
| Reminders | Notify approved devices about orders that still need attention. |
| Audit and recovery | Record changes and retain deleted-row snapshots for covered database tables. |

The monitoring table's price column is a placeholder, not evidence of an implemented pricing model. A WhatsApp control also does not establish that automated customer messaging was deployed. The customer-tracking page in the separate portfolio project is not a feature claimed for this application.

## Architecture and technology choices

The frontend uses **HTML, CSS, and vanilla JavaScript**, with no framework or build pipeline. Static files can be served directly. This kept hosting straightforward, while requiring explicit discipline around shared components, state, and consistency between pages.

The original backend uses **Supabase** for PostgreSQL, authentication, image storage, and the realtime events needed by the print service. Server-side functions handle selected integrations. Row-Level Security (RLS) enforces access at the data layer rather than relying on hidden screens or frontend redirects.

```text
Staff interface <-> Authentication and access policies <-> Customers, orders, pieces
                                                     <-> Image storage

Print action -> Job queue -> Local Node.js service -> Windows printing

Reminder schedule -> Current-order eligibility -> Sender -> Approved device

Market panel -> Server-side function -> Market-data provider
```

This diagram describes the original application. These operational services and their configuration are not included in the demo.

## Data-model decisions

- **Customers** are reusable records referenced by orders.
- **Orders** are the central entity for every order type and hold status, priority, and creation date.
- **Order pieces** are child records, allowing multiple items without duplicating the customer and order information.
- **Images** belong to an order and, where appropriate, a particular piece.
- **Catalog line items** record the selected models, quantities, and specifications.
- **Collection records** represent physical handover, separately from completion of the work.
- **Snapshot fields** preserve selected customer and model information as it was when the order was created.

When the model evolved, existing orders remained readable through explicit legacy fallbacks. New structures were introduced without requiring an unnecessary wholesale conversion of historical data.

## Documented development stages

The dates below identify changes recorded in the development notes. They are not a complete session log or a precise statement of when the project first began.

| Stage | Work completed or introduced | Purpose |
| --- | --- | --- |
| Initial version | Order forms, customer information, and order details. | Consolidate scattered records into a single workflow. |
| May 2026 | Label-printing integration and multi-model catalog orders. | Support physical operations and more realistic orders. |
| June 2026 | Diagnosis of order-saving failures after access-policy changes. | Distinguish unavailable services from rejected operations. |
| July 2026 | Consistent authentication, tighter access policies, PWA setup, hosting, and date/mobile fixes. | Improve consistency and protect access from the backend. |
| July 2026 | Multi-piece orders, piece-specific images, and a revised market-data integration. | Handle complex orders and move external integration behind a server-side function. |
| August 2026 | Creation-date selection and editing of pieces and photos. | Correct and update orders without recreating them. |
| August 2026 | Silver purity and watch-repair support, including a watch-type picker. | Adapt the model and interface to additional work. |
| August 2026 | Priorities, reminders, and a monitoring table. | Organize outstanding work and review many orders efficiently. |
| Portfolio preparation | Isolated demo, synthetic records, and browser-local storage. | Make the workflows reviewable without exposing the operational system. |

## Engineering challenges and solutions

### 1. An orders page that never finished loading

**Symptom:** Loading placeholders remained visible, and part of the JavaScript appeared as text at the bottom of the page.

**Cause:** Print-window generation conflicted with the enclosing HTML script boundary. The HTML parser does not interpret JavaScript string context when recognizing a closing script tag.

**Solution:** Remove the generated script tag from the print-window content, invoke printing after finishing the document write, and keep order-management logic in a separate JavaScript file.

**Lesson:** Valid JavaScript text can still break the HTML document that contains it. Generated content must respect both parsing layers.

### 2. Order creation failed after enabling access policies

**Symptom:** Some orders, especially those involving photos or particular detail records, failed to save even though the backend was reachable.

**Cause:** RLS had been enabled on tables without policies matching the application's active write paths.

**Solution:** Identify the rejected operations at table level. A later hardening phase standardized authentication and replaced open access with policies for authorized users, while checking that their workflows remained functional.

**Lesson:** Authentication, policies, and application behavior must be designed and tested together. An early compatibility fix should not be mistaken for the final security model.

### 3. A login page was not a sufficient security boundary

The hardening work reviewed data access, database-function execution privileges, and execution context. Changes were introduced incrementally so that stronger restrictions did not simply stop the application from working.

The notes record checks that unauthorized operations were rejected while permitted operations continued to work. These are historical verification results, not a security certification of the current deployment. Account details and operational identifiers are intentionally omitted here.

### 4. The physical printer did not match the initial assumptions

**Problem:** A PDF-based approach did not provide the required control over label dimensions, and the initially assumed printer protocol did not fit the actual device.

**Solution:** Confirm the hardware and use its Windows printing path. A Node.js service receives queued jobs and passes their data to a PowerShell helper that draws and prints the label through the installed driver. The service was configured to start automatically.

**Arabic text:** Default script encoding corrupted Arabic text. Passing text through UTF-8 JSON, rather than embedding it directly in the PowerShell source, addressed the encoding problem. A suitable Arabic font was selected for rendering.

**Remaining limit:** The notes confirm basic printing, but leave the final cut-length setting for an on-device adjustment and physical verification. That item is not presented as completed.

### 5. Older catalog orders appeared blank

**Cause:** The interface was reading model details from the wrong location. The later introduction of multiple catalog line items added another representation that the renderer had to support.

**Solution:** Load both the current line items and legacy detail records explicitly. Prefer the new line-item renderer when records exist, otherwise fall back to the older representation.

**Lesson:** Schema evolution requires compatible readers as well as new writers.

### 6. Multiple pieces made order-level photos ambiguous

Linking every photo only to the order was insufficient once one order could contain several pieces. Separate piece records and piece-specific image links solved the ambiguity, while older order-level images remained visible.

The administration editor then had to handle adding and removing photos, deleting pieces, and updating thumbnails without accidentally replacing a catalog model's snapshot image. Collected orders remained locked against piece editing according to the documented workflow decision.

### 7. A quotation mark in a customer's name broke deletion

**Cause:** The delete button embedded the customer's name directly into an inline JavaScript handler. Certain characters made the generated handler invalid; the name itself had been stored successfully.

**Solution:** Pass only the record identifier to the handler and retrieve the name from loaded data.

**Lesson:** User-provided text should not be interpolated directly into generated JavaScript event handlers.

### 8. Customer deletion needed business rules

The delete workflow was split into three cases: block deletion when an order has not been collected, show an additional warning when only historical collected orders exist, and request a standard confirmation when there are no orders.

Related records also had to be deleted in a dependency-aware order. These interaction rules reduce accidental operational loss; they are separate from the original database's audit and recovery mechanism.

### 9. Dates changed calendar across devices

Some regional settings produced Hijri dates where the application expected Gregorian dates.

The display was changed to a consistent numeric Gregorian format. A shared day/month/year component subsequently handled month lengths and leap years, while preserving the original time of day when an order's date was edited.

### 10. Decorative effects slowed touch devices

The investigation connected sluggishness to the cost of compositing animated layers, rather than assuming that images or data loading were responsible.

Changes reduced particle counts, simplified large animated layers, included tablets in the lighter rendering mode, and reduced permanently reserved graphics layers. Safe-area padding addressed overlap with the top of phone screens, including mobile CSS rules that had overridden the initial fix.

No percentage speedup is claimed: the notes describe causes and targeted changes, not a published before-and-after benchmark.

### 11. New options had to match database constraints

Adding silver purity and a watch-repair order type required more than new dropdown choices. Older tables and order-type constraints could reject the values even when the interface offered them.

The relevant constraints were updated before the new values were relied on. Watches reused the existing piece model, with watch type, problem description, and notes instead of irrelevant weight and purity fields.

### 12. A watch picker looked functional but did not save

**Cause:** A shared component looked for the data client on `window`, but the page had declared it with a top-level `const`. That lexical binding was not a property of `window`. A fallback list concealed the failed read, so the picker appeared healthy.

**Solution:** Correct the client lookup and test for a distinctive record from the test data source, as well as successful writes.

**Lesson:** Seeing plausible options on screen does not prove that an integration works, especially when fallback data exists.

### 13. A custom-image catalog path left partial work behind

A legacy flow attempted to write fields that did not match the data structure, after earlier order-creation steps had already succeeded.

The flow was no longer needed, so it was removed as a scope decision. Catalog ordering now follows the model-cart path.

Removing this path does not mean every upload and save operation became atomic. Cleanup of unreferenced files and recovery from partially completed operations remain improvement areas.

### 14. Reminders needed to avoid duplicates and stale alerts

The reminder system was designed around **current state**, rather than sending a notification for every edit. Eligibility is checked again before delivery, so an order that has been completed or collected no longer qualifies for the corresponding reminder.

Priority reminders were grouped to avoid multiplying alerts by the number of orders. In the later revision, completed-but-uncollected reminders became order-specific and linked directly to the relevant order. Uniqueness constraints prevented duplicate delivery when scheduling or sending was retried. A limited grace window avoided a large catch-up burst after an outage.

A separate completion timestamp was introduced: changing a note should not reset the time an order has been waiting for collection. A shared schedule source kept the interface and sender aligned.

Device approval and permission to change that approval were also checked. Lock-screen notification content excluded customer details. Later notes record successful delivery on physical devices. Custom per-priority notification sounds were not implemented in the web application.

### 15. A monitoring table without a second management system

The table view reuses the same loaded orders, detail dialog, and actions as the card view. Search continues to work, the selected view is remembered, and card-view state is preserved when switching back.

The implementation addressed wide-screen layout, scrolling within the table on small screens, a sticky header, and links that focus a particular row. Changing presentation did not require duplicating data loading or order-management logic.

### 16. Updating an installed app and handling market-data failures

The original PWA used network-first HTML and versioned asset-cache management to reduce the risk of users retaining outdated pages after deployment. Installability does not imply that all database operations work offline.

The market panel evolved from direct calls to multiple providers into a server-side integration. It displays the last successful values and their update time, while reducing repeated requests caused by navigation. This describes the saved implementation history, not a verification of the current deployed service configuration.

## Audit and recovery design

The original system records changes and snapshots deleted rows on covered tables through database triggers. Recovery is an administrative operation outside the application interface. This keeps recordkeeping independent of whether a particular frontend action remembered to log its work.

Coverage must be considered when new tables are introduced. Row snapshots also should not be described as a complete backup of all uploaded files or a substitute for a broader backup strategy. The demo does not include this infrastructure.

## Testing and evidence

The development notes describe automated Headless Chrome checks using local substitutes for database and storage operations. Scenarios included creation, editing, deletion, photos, legacy records, and collected orders. Some stages also used database checks inside rolled-back transactions and checks at multiple viewport sizes.

The notes explicitly distinguish sessions where live verification was unavailable and cases where a visual screenshot could not be produced. These results relate to particular changes and sessions; they do not establish exhaustive coverage or guarantee the current production state.

The isolated demo was separately tested locally for order creation and editing, photos, catalog operations, customer management, status changes, collection, and browser-local persistence. External requests were monitored during the tested workflows. Those checks do not exercise the original backend or physical printing service.

## What the demo includes

| Component | Original application | This demo |
| --- | --- | --- |
| Records | Backend data shared across devices. | Synthetic examples and browser-local storage. |
| Authentication | Sign-in and server-enforced access policies. | Open exploration without sign-in. |
| Images | Operational images in remote storage. | Generated illustrations and locally processed visitor uploads. |
| Printing | Local service and physical printer. | Label preview only. |
| Messaging | Workflows and integrations with different documented implementation states. | Local message preview; no sending. |
| Reminders and market data | Backend scheduling and external integrations. | No live market requests or push delivery. |
| Audit and recovery | Database mechanisms for covered tables. | Not included. |
| PWA infrastructure | Installable original application with network-dependent operations. | Static demo pages without the original service worker or installation assets. |

`demo-data.js` replaces remote data access with a small localStorage-backed adapter. `demo-ui.js` provides the introduction, reset control, and simulated outputs. The original interface and core order workflows are retained, while operational dependencies are removed.

## Demo file map

| File | Purpose |
| --- | --- |
| `index.html`, `home.html` | Demo home page and navigation. |
| `create_order.html` | Repair, engraving, and watch-repair order creation. |
| `catalog-order.html` | Catalog browsing and cart ordering. |
| `catalog-admin.html` | Demo catalog management. |
| `admin-orders.html`, `admin-orders.js` | Order-management interface and behavior. |
| `customers.html` | Customer management. |
| `order-date-field.js`, `order-piece-form.js` | Shared date and piece-editing components. |
| `order-priority-field.js`, `watch-type-field.js` | Priority and watch-type components. |
| `demo-data.js` | Local demo records, persistence, and reset. |
| `demo-ui.js`, `demo-ui.css` | Introduction, demo controls, and previews. |
| `assets/` | Synthetic catalog illustrations. |
| `serve.py`, `start-demo.cmd`, `START_HERE.txt` | Local preview and startup instructions. |

## Remaining improvements and limits

- Verify final label cut-length configuration on the physical device; the reviewed notes do not confirm that this item was closed.
- Improve cleanup of unreferenced images and recovery from partially completed saves.
- Design an actual pricing model before treating the price column as a completed feature.
- Reduce duplicated field definitions and validation where appropriate, without destabilizing established creation and editing workflows.
- Recheck deployment and integration settings when maintaining the operational system; local documentation alone does not establish their current state.
- Do not present automated customer messaging, custom notification sounds, or fully offline operation as completed features without additional evidence.

## What this project demonstrates

The project connects business requirements to a data model and usable interface, evolves an existing application while preserving older records, integrates a web workflow with physical hardware, and addresses Arabic localization and touch-device behavior.

It also demonstrates troubleshooting across frontend code, storage, access policies, and backend services, along with scope decisions: reuse existing components where suitable, remove obsolete flows, and distinguish a visible control from a fully implemented service.

## Privacy and documentation scope

This account was prepared on **September 28, 2026**, from the saved project map, local documentation, development-memory notes, and targeted source review. More recent notes take precedence over superseded descriptions. The live database and operational devices were not inspected to prepare this document.

Only selected UI source was adapted for the demo. Original Git history, environment files, internal memory files, database exports, server functions, the print service, and business images were not copied. The story is a rewritten, sanitized account rather than a copy of those internal documents.

Business and personal names, account details, contact information, production URLs and identifiers, private machine paths, credentials, and operational record/device counts are omitted. The architecture is described at a level that explains the engineering without providing access to the original system.

Cloud SDKs, authentication guards, remote configuration, external font loading, and original service-worker registration were removed from the demo. A Content Security Policy blocks network connections and external scripts, images, and frames. Use fictional information when exploring it.

Published as an independent portfolio demo. The original application and its operational services are not included.
