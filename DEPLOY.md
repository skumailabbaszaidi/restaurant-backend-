# Deployment & Testing Guide

## 1. Local Testing (Emulators)

The best way to test your backend functions locally without deploying them is using the Firebase Local Emulator Suite.

### Prerequisites
*   Java (installed and in your PATH).
*   Firebase CLI: `npm install -g firebase-tools`

### Steps
1.  **Build the Project**:
    ```bash
    cd backend
    npm run build
    ```
2.  **Start Emulators**:
    ```bash
    npm run serve
    ```
    This command runs `firebase emulators:start --only functions`.
3.  **Endpoint URL**:
    The emulators will output the URL for your API, typically:
    `http://127.0.0.1:5001/<project-id>/us-central1/api`

### Testing with Postman/Curl
You can send requests to the local URL.
*   **Header**: `Authorization: Bearer <your-firebase-id-token>`
    *   To get a token, you can use the frontend login (check network tab for API calls) or use a helper script.

## 2. Deployment to Production

### Prerequisites
*   Initialize Firebase in your project root if not already done (`firebase init`).
*   Select **Functions**.

### Deployment Steps
1.  **Build**:
    Always rebuild before deploying to ensure latest changes are compiled.
    ```bash
    cd backend
    npm run build
    ```
2.  **Deploy**:
    ```bash
    firebase deploy --only functions
    ```

### Important Notes
*   **Security**: The code is configured to use **Application Default Credentials (ADC)** in production. This means you do **NOT** need to upload your service account JSON file. The Cloud Function automatically uses its native permissions.
*   **Environment Variables**: If you add other secrets, use `firebase functions:config:set` to manage them securely.

## 3. Dynamic Organization Logic
All endpoints now use dynamic Organization IDs derived from the authenticated user.
*   **Admins**: Must have an `organizationId` set in their Firestore User Document (`users/{uid}`).
*   **Invites**: The `inviteMember` endpoint automatically sets the `organizationId` for new users to match the admin's organization.
