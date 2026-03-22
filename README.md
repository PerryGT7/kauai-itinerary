# Kintinery — Photo API

Serverless photo-storage backend for trip itineraries.
Built with **AWS SAM** · **Lambda (Node 20)** · **S3** · **API Gateway**.

---

## Architecture

```
Browser
  │
  ├─ POST /trips/{id}/upload-url  ──► Lambda getUploadUrl
  │                                        │
  │                                        └─ returns presigned S3 PUT URL
  │
  ├─ PUT <presigned URL>  ──────────────► S3 (direct — no Lambda involved)
  │
  ├─ GET  /trips/{id}/photos?date=  ───► Lambda listPhotos
  │                                        │
  │                                        └─ returns presigned S3 GET URLs
  │
  └─ DELETE /trips/{id}/photos  ────────► Lambda deletePhoto
```

---

## Project layout

```
kintinery/
├── template.yaml              # SAM template — all AWS infra defined here
├── samconfig.toml             # Deployment config (set your region here)
├── api/
│   ├── package.json           # AWS SDK v3 dependencies
│   ├── handlers/
│   │   ├── getUploadUrl.mjs   # POST /trips/{id}/upload-url
│   │   ├── listPhotos.mjs     # GET  /trips/{id}/photos?date=
│   │   └── deletePhoto.mjs    # DELETE /trips/{id}/photos
│   └── lib/
│       └── response.mjs       # Shared CORS + JSON response helpers
└── README.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| [AWS CLI](https://aws.amazon.com/cli/) | v2 |
| [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) | ≥ 1.100 |
| Node.js | 20 |

Configure your AWS credentials:
```bash
aws configure
```

---

## Deploy

```bash
# 1. Install Lambda dependencies
cd api && npm install && cd ..

# 2. First-time deploy (interactive — saves answers to samconfig.toml)
sam deploy --guided

# 3. Subsequent deploys
sam deploy
```

The stack outputs the **API URL** and **bucket name** after a successful deploy.

---

## API reference

### POST `/trips/{id}/upload-url`

Request a presigned S3 URL so the browser can upload a file directly.

**Body**
```json
{
  "filename":    "beach.jpg",
  "contentType": "image/jpeg",
  "date":        "2026-06-01"
}
```

**Response**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "key":       "trips/kauai-2026/2026-06-01/1717000000000-beach.jpg"
}
```

Then PUT the file straight to S3:
```js
await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
```

---

### GET `/trips/{id}/photos?date=YYYY-MM-DD`

Returns all photos for a trip. `date` is optional — omit it to fetch every day.

**Response**
```json
{
  "photos": [
    {
      "key":          "trips/kauai-2026/2026-06-01/1717000000000-beach.jpg",
      "url":          "https://s3.amazonaws.com/... (presigned, 1 h TTL)",
      "date":         "2026-06-01",
      "size":         204800,
      "lastModified": "2026-06-01T14:22:00.000Z"
    }
  ]
}
```

---

### DELETE `/trips/{id}/photos`

Permanently deletes one photo.

**Body**
```json
{ "key": "trips/kauai-2026/2026-06-01/1717000000000-beach.jpg" }
```

**Response**
```json
{ "deleted": "trips/kauai-2026/2026-06-01/1717000000000-beach.jpg" }
```

---

## Local development

```bash
sam local start-api
```

Lambdas run locally; they still reach out to real S3 unless you point
`BUCKET_NAME` at [LocalStack](https://localstack.cloud/).

---

## Tear down

```bash
sam delete
```
