# API Reference

Base URL (Local): `http://127.0.0.1:5001/restaurant-proto-c1826/us-central1/api/v1`
Base URL (Production): `https://us-central1-restaurant-proto-c1826.cloudfunctions.net/api/v1`

## Authentication
*   **Header**: `Authorization: Bearer <Firebase-ID-Token>`
*   Required for all "Protected" routes.

## Public

| Method | Endpoint | Description | Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/restaurants/:slug` | Get restaurant details (name, logo, theme). | `slug`: Restaurant slug (e.g., `burger-king`) |
| `GET` | `/restaurants/:slug/menu` | Get full menu (categories + items). | `slug`: Restaurant slug |
| `GET` | `/restaurants/:slug/categories` | Get ONLY categories. | `slug`: Restaurant slug |
| `POST` | `/orders` | Place a new order. | `{ restaurantSlug, items: [...], total }` |
| `GET` | `/orders/:slug` | Get all orders for a restaurant (Legacy). | `slug`: Restaurant slug |

### Admin Dashboard (Protected)
Base Path: `/v1/admin`

| Method | Endpoint | Description | Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/organization` | Get current organization details. | None |
| `GET` | `/team` | Get all team members. | None |
| `POST` | `/team/invite` | Invite a new team member. | `{ email, name, role }` |
| `PATCH` | `/organization` | Update organization settings. | `{ name, theme... }` |
| `GET` | `/categories` | Get all categories for current org. | None |
| `POST` | `/categories` | Create a new custom category. | `{ name, order }` |
| `DELETE` | `/categories/:id` | Delete a category. | `id`: Category ID |
| `GET` | `/items` | Get all menu items for current org. | None |
| `POST` | `/items` | Add a new menu item. | `{ name, price, description, categoryId, available? }` |
| `PATCH` | `/items/:id` | Update a menu item. | `{ price, available, ... }` |
| `DELETE` | `/items/:id` | Delete a menu item. | `id`: Item ID |
| `GET` | `/orders` | Get all orders for current org. | None |

### Storage Structure
All organization-specific data is stored within the `organizations/{orgId}` document as sub-collections:
- **Categories**: `categories`
- **Menu Items**: `items`
- **Orders**: `orders`

### Categories (Admin)
| Method | Endpoint | Description | Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/categories` | Get all categories for current org. | None |
| `POST` | `/admin/categories` | Create a new custom category. | `{ name, order }` |
| `DELETE` | `/admin/categories/:id` | Delete a category. | `id`: Category ID |
| `POST` | `/restaurants/menu` | Add a new menu item. | `{ name, price, description, categoryId, image? }` |
| `PATCH` | `/restaurants/menu/:id` | Update a menu item (availability, price). | `{ available: boolean, ... }` |

## Data Types

### User (Admin)
*   **Role**: `admin` or `member`
*   **OrganizationId**: Links user to a specific restaurant.

### Order
*   **Items**: Array of `{ menuItemId, quantity, modifiers }`.
*   **Status**: `pending` (default), `preparing`, `ready`, `delivered`.
