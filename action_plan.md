# Action Plan: Connecting Photo Confirmation to Backend

## 1. Overview of the Flow
Based on your requested architecture, the image upload will be decoupled from the report creation. The flow will be:
1. **Capture Data:** The user takes a photo, writes a description, selects tags, and clicks "Confirm Report". The app captures the precise GPS location (`latitude`, `longitude`, `gnss_accuracy_m`) and timestamp (`captured_at`).
2. **Request Upload Link:** The frontend makes a `GET` request to the backend's storage endpoint (e.g., `/api/v1/storage/presigned-upload`) to receive a pre-signed URL (and an object key) for direct-to-storage upload.
3. **Upload Image:** The frontend makes a `PUT` request to the pre-signed URL, uploading the raw image data directly to the storage provider (e.g., Cloudflare R2 or AWS S3) without passing the heavy payload through the backend API.
4. **Submit Report:** The frontend makes a `POST` request to the backend's report creation endpoint (e.g., `/api/v1/reports/`). It sends the `latitude`, `longitude`, `description`, `tags`, `captured_at`, and the `photo_key` (obtained in step 2).

## 2. Required Modifications

### Backend (`backend/` - FastAPI)
Currently, the FastAPI endpoint `POST /api/v1/reports/` is designed to accept the image directly as a multipart form-data `UploadFile` (`photo: UploadFile = File(...)`). It then uploads it to R2 itself and performs Gemini AI verification internally. 
To support your decoupled flow, we will need to:
*   Modify `backend/app/api/v1/endpoints/reports.py`'s `submit_report` endpoint to accept a `photo_key: str = Form(None)` parameter.
*   Update the logic so that if a `photo_key` is provided, it skips the internal upload step, but still runs the Gemini verification (this might require fetching the image from R2, or doing it asynchronously).
*   Ensure the `/storage/presigned-upload` endpoint in `backend/app/api/v1/endpoints/storage.py` correctly returns both the upload URL and the generated `key` so the frontend can send the key back in step 4.

### Frontend (`frontend-citizen/`)
*   Update `ConfirmationView.tsx` to handle the actual `navigator.geolocation.getCurrentPosition` API for precise coordinates and accuracy.
*   Implement the 3-step API call logic (Get Link -> Upload Image -> Submit Report) in the `handleConfirm` function.
*   Configure API environment variables to point to the FastAPI backend.

## 3. Analysis: Do you need Docker?
**Yes, you will need Docker.**

Here is the breakdown of the backend structure based on my analysis:
1.  **FastAPI Backend (`backend/` folder):** This is the "real" backend. It uses Python, SQLAlchemy, and relies heavily on **PostgreSQL with the PostGIS extension** for geospatial queries (like finding intersecting anomalies using `ST_Intersects`). Installing PostgreSQL and compiling PostGIS manually on your local machine is tedious. The `docker-compose.yml` file perfectly orchestrates this by spinning up a ready-to-use `postgis/postgis:15-3.3` container alongside the Python backend container.
2.  **Node.js Backend (`frontend-citizen/server.ts`):** This appears to be a mock or simplified development server for the frontend. It receives reports, calls the Gemini API directly, and saves the data to a local `data/reports.json` file. It does not use a real database or R2 storage.

**Recommendation:** To use the robust, production-ready flow you described (with pre-signed URLs and a real database), we must connect the frontend to the **FastAPI backend** running via Docker on port 8000, and bypass the mock `server.ts` node server. Running `docker compose up` in the root directory will be the easiest way to ensure the PostGIS database and the FastAPI server are running correctly.