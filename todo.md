# Food Bites - Project TODO

## Database & Backend
- [x] Database schema: restaurants, menu_items, orders, order_items tables
- [x] Seed data: sample restaurants, categories, and menu items
- [x] tRPC router: restaurants (list, get by id, search, filter)
- [x] tRPC router: menu items (list by restaurant)
- [x] tRPC router: orders (create, list by user, get by id, update status)
- [x] tRPC router: admin (manage restaurants, menu items, orders)
- [x] tRPC router: categories

## Frontend Pages
- [x] Global layout with top navigation bar (logo, cart icon, auth)
- [x] Homepage: hero section, category filters (Pizza, Burgers, Sushi, etc.), featured restaurants
- [x] Restaurant listing page: search, filter by cuisine/rating, restaurant cards
- [x] Restaurant detail page: menu grouped by category, item descriptions and prices
- [x] Shopping cart: add/remove items, quantity control, order summary
- [x] Checkout flow: delivery address input, order confirmation screen
- [x] User authentication: Manus OAuth login/logout, profile display
- [x] Order history page: past orders with status and details
- [x] Order tracking page: 4-step flow (Placed → Preparing → On the Way → Delivered)
- [x] Admin panel: manage restaurants, menu items, view/update orders

## Design & UX
- [x] Elegant warm color palette (oranges, reds, creams)
- [x] Responsive design across all device sizes
- [x] Food-themed aesthetic with appetizing imagery placeholders
- [x] Smooth transitions and micro-interactions
- [x] Loading states and empty states

## Testing
- [x] Vitest tests for order creation and status update procedures
- [x] Vitest tests for restaurant listing procedures

## Refinements
- [x] Add rating sort/filter to restaurants listing page
- [x] Add admin UI for managing menu categories
- [x] Add Vitest test for successful order creation
