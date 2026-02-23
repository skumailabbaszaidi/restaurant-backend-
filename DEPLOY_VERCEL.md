# Environment Configuration & Deployment

I have configured the backend to handle environment variables for both local development and Vercel production.

## 💻 Local Development Setup
To run the project locally, you need a `.env` file in the `backend/` directory. I have created this for you.

### Local `.env` Content:
```env
PORT=5000
NODE_ENV=development
```
**Why only these?**
The backend is programmed to check for the **Service Account JSON file** (`restaurant-proto-c1826-firebase-adminsdk...json`) at the root of the project. If it exists, it uses it for local Firestore access. You don't need additional variables for local dev as long as that file is present.

---

## 🚀 Vercel Production Setup
When deploying to Vercel, you cannot upload your JSON key file (for security and because it's in `.gitignore`). Instead, you must add your credentials to the **Vercel Dashboard**.

### Required Environment Variables on Vercel:
Go to **Settings > Environment Variables** in the Vercel dashboard and add:

| Key | Value |
| :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **Copy the entire content** of your `restaurant-proto-c1826-firebase-adminsdk...json` file. |
| `NODE_ENV` | `production` |

---

## 🛠️ Commands

### 1. Local Development
To run the server locally (fastest for development):
```bash
npm run dev
```
This will run the server on `http://localhost:5000` (or your defined PORT).

### 2. Local Vercel Dev (Serverless Simulation)
If you want to test exactly how Vercel will process it (useful before deployment):
```bash
npm run vercel-dev
```

### 3. Initializing Vercel Project
If this is your first time deploying:
```bash
npx vercel
```
Follow the prompts to link your account.

### 4. Deploy to Production
```bash
npx vercel --prod
```

## API Documentation
Base URL: `https://your-project.vercel.app/v1/...`
Check [API_DOCS.md](file:///home/syed-muhammad-kumail-abbas-zaidi/Projects/Product/backend/API_DOCS.md) for endpoint details.
