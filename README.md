# Restaurant Ordering Backend

This is the backend for the Restaurant Ordering SaaS, built with Node.js, Express, and Firebase Cloud Functions.
admin@burger.com
password123
## Setup

1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your Firebase credentials.
    ```bash
    cp .env.example .env
    ```
    *Note: For local development using `firebase-admin`, you might need a service account key if not running in an emulated environment.*

3.  **Build**:
    ```bash
    npm run build
    ```

4.  **Run Locally (Emulator)**:
    ```bash
    npm run serve
    ```

## Deploy

To deploy to Firebase Cloud Functions:
```bash
npm run deploy
```

## API Endpoints

### Public
*   `GET /api/v1/restaurants/:slug` - Get restaurant details
*   `GET /api/v1/restaurants/:slug/menu` - Get menu
*   `POST /api/v1/orders` - Place order

### Protected (Requires Bearer Token)
*   `GET /api/v1/orders/:slug` - Get orders
*   `GET /api/v1/admin/team` - Get team members
*   `POST /api/v1/admin/team/invite` - Invite member
