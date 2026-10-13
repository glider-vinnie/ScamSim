# ScamSim Deployment Blockers & Manual Execution Guide

**Deployment Mode:** FINAL (T+2:30; full application build)  
**Timestamp:** 2026-10-13  
**Status:** BLOCKED — Cloud SDK CLI tools not installed / not authenticated in the local environment.

---

## 1. Auth & CLI Pre-Check Results

Per specification instructions, the authentication and configuration verification commands were executed on the host:

### Command: `gcloud auth list` & `gcloud config get-value project`
```powershell
gcloud : The term 'gcloud' is not recognized as the name of a cmdlet, function, script file, or operable program.
```
* **Status**: Blocked — Google Cloud SDK (`gcloud`) is not installed on this workstation.

### Command: `firebase projects:list`
```powershell
firebase : The term 'firebase' is not recognized as the name of a cmdlet, function, script file, or operable program.
```
* **Status**: Blocked — Firebase CLI (`firebase-tools`) is not installed on this workstation.

---

## 2. Prepared Production Artifacts (Ready to Deploy)

All production deployment assets and code bundles have been generated and validated locally:

1. **Backend Container Definition**:
   - `backend/Dockerfile`: Built on `python:3.11-slim`, non-root user `appuser:appgroup` (UID/GID 1001), copies backend app and scenarios, runs `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}`.
   - `backend/.dockerignore` & `.dockerignore`: Properly ignores virtual environments, test caches, local environments, and git histories.
2. **Hosting & Gateway Configuration**:
   - `firebase.json`: Configured with SPA fallback to `/index.html` and reverse proxy rewrite `/api/**` directing traffic to Cloud Run service `scamsim-api` in `us-central1`.
   - `.firebaserc`: Created with default project target.
3. **Frontend Production Assets**:
   - `frontend/dist/`: Built cleanly with `VITE_API_BASE_URL=/api npm run build`.
   - `scripts/check-bundle.mjs`: **PASSED cleanly** (zero secret keys, zero credential inputs, zero `dangerouslySetInnerHTML`).

---

## 3. Human Operator Deployment Runbook

To complete the public deployment to Google Cloud and Firebase, run the following commands with your real Google Cloud Project ID:

### Step 1: Install & Authenticate CLI Tools
```bash
# 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
# 2. Authenticate gcloud:
gcloud auth login
gcloud config set project <YOUR_PROJECT_ID>

# 3. Install and Authenticate Firebase CLI:
npm install -g firebase-tools
firebase login
```

### Step 2: Enable Required GCP APIs
```bash
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 3: Initialize Firestore Native Database & TTL Policies
```bash
# Create native Firestore database in your preferred region (e.g. us-central1 or asia-south1):
gcloud firestore databases create --location=us-central1

# Enable automated 30-day retention cleanup policies via expiresAt TTL field:
gcloud firestore fields ttls update expiresAt --collection-group=sessions --enable-ttl
gcloud firestore fields ttls update expiresAt --collection-group=progress --enable-ttl
```

### Step 4: Deploy Cloud Run Backend Service
```bash
# Deploy scamsim-api from the backend directory:
gcloud run deploy scamsim-api \
  --source backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=prod,STORE_BACKEND=firestore,GOOGLE_CLOUD_PROJECT=<YOUR_PROJECT_ID>,GEMINI_ENABLED=false \
  --min-instances 0 \
  --max-instances 3
```

### Step 5: Grant Datastore Permissions to Cloud Run Runtime Service Account
```bash
# Identify project number and default compute service account:
PROJECT_NUMBER=$(gcloud projects describe <YOUR_PROJECT_ID> --format="value(projectNumber)")
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant Datastore / Firestore User role:
gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/datastore.user"
```

### Step 6: Deploy Firebase Hosting
```bash
# Build frontend with relative API path:
cd frontend
export VITE_API_BASE_URL="/api"
npm run build
cd ..

# Run bundle security scan:
node scripts/check-bundle.mjs

# Deploy hosting with Cloud Run proxy rewrite:
firebase use <YOUR_PROJECT_ID>
firebase deploy --only hosting
```

---

## 4. Post-Deployment Verification Checklist

Once deployed, verify public production behavior using these checks:

- [ ] **Health Check**: Run `curl -fsS https://<HOST>/api/health` — must return HTTP 200 with `status: "ok"` and `store: "firestore"`.
- [ ] **Full Journey E2E**:
  ```bash
  cd frontend
  npx playwright test e2e/scenarios-journey.spec.ts --config=playwright.config.ts --reporter=list
  ```
  (Set `baseURL` to the public hosting URL).
- [ ] **Persistence Verification**: Complete one simulation run, refresh `/progress`, confirm sessions document exists in Firestore via Google Cloud Console (`sessions` collection).
