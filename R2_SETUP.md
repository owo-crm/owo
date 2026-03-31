# R2 attachment storage setup

This project already supports S3-compatible attachment storage for lead files.
Cloudflare R2 is the recommended default for Barowo because it stays private, works with presigned URLs, and has simple pricing.

## What is already ready

- Lead attachments can stay private.
- The backend serves every file through an internal content route.
- Photos still preview inside Mini App.
- Documents open or download outside Mini App.
- Old local attachments keep working even after switching the backend to S3-compatible storage.

## Recommended provider

Cloudflare R2.

Why:
- S3-compatible, so the code does not lock us into one vendor.
- Standard storage is currently `$0.015 / GB-month`.
- Standard storage includes a free tier of `10 GB-month`, `1 million` Class A operations, and `10 million` Class B operations each month.
- Internet egress is listed as free for Standard storage.

Official sources:
- [Cloudflare R2 overview](https://developers.cloudflare.com/r2/)
- [Cloudflare R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [Cloudflare R2 authentication and tokens](https://developers.cloudflare.com/r2/api/tokens/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)

## What to create in Cloudflare

1. Create an R2 bucket.
2. Create an R2 API token with object read and write access to that bucket.
3. Copy:
   - bucket name
   - account ID
   - Access Key ID
   - Secret Access Key

Cloudflare documents that the S3 API endpoint uses:
`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## What to add to `.env`

Open:
- [`C:\dev\Barowo crm\.env`](C:/dev/Barowo%20crm/.env)

Add or update:

```env
ATTACHMENTS_STORAGE_BACKEND=s3
ATTACHMENTS_S3_BUCKET=your-r2-bucket
ATTACHMENTS_S3_REGION=auto
ATTACHMENTS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
ATTACHMENTS_S3_ACCESS_KEY_ID=your-access-key-id
ATTACHMENTS_S3_SECRET_ACCESS_KEY=your-secret-access-key
ATTACHMENTS_S3_PRESIGNED_TTL_SECONDS=3600
ATTACHMENTS_S3_FORCE_PATH_STYLE=true
```

## Restart backend

```powershell
cd "C:\dev\Barowo crm\backend"
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

## Run the smoke test

This checks:
- upload to bucket
- object exists
- signed URL generation
- delete

```powershell
cd "C:\dev\Barowo crm\backend"
.\.venv\Scripts\python scripts\smoke_test_attachment_storage.py
```

Expected result:
- `PUT ok`
- `HEAD ok`
- `SIGNED URL ok`
- `DELETE ok`
- `Delete verification ok`
- `Smoke test passed.`

## Then verify inside Mini App

1. Open any lead.
2. Upload a photo.
3. Open preview inside Mini App.
4. Download the same file.
5. Upload a document such as `txt`, `pdf`, `docx`, or `xlsx`.
6. Open it outside Mini App.
7. Delete one attachment and confirm it disappears.

## Supported file formats

- Images: `jpg`, `jpeg`, `png`, `webp`, `gif`, `heic`, `heif`
- Documents: `pdf`, `txt`, `csv`, `doc`, `docx`, `xls`, `xlsx`

Current upload size limit:
- `10 MB`
