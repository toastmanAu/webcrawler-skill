# Research: ckb-snapshot-infrastructure

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md, https://developers.cloudflare.com/r2/examples/rclone/, https://developers.cloudflare.com/r2/api/s3/presigned-urls/, https://raw.githubusercontent.com/bitcoin/bitcoin/master/doc/bootstrapping.md, https://raw.githubusercontent.com/paritytech/substrate/master/docs/CONTRIBUTING.adoc

---

## Research Note: ckb-snapshot-infrastructure

**Date:** 2026-03-03

### Summary
This research investigates best practices for CKB snapshot hosting, focusing on Cloudflare R2. Due to several source documents being unavailable (404 errors), specific community expectations for CKB compression formats, existing CKB snapshots, and snapshot versioning strategies from Bitcoin or Substrate could not be determined from the provided content. However, Cloudflare R2's S3 compatibility inherently supports resumable downloads via standard HTTP `Range` headers, and presigned URLs can be used for controlled access. Cache-control best practices for large, infrequently updated files like snapshots typically involve long expiry times.

### 1. What compression format does the community expect for CKB snapshots? (zstd vs lz4 vs gz)
The provided content, specifically the expected CKB documentation (`https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md`), was not found (HTTP Error 404). Therefore, this question cannot be answered from the given sources.

### 2. Does Cloudflare R2 need any special headers for large file resumable downloads?
Cloudflare R2 is S3-compatible. For resumable downloads of large files, standard HTTP `Range` headers are used by the client. The R2 service, being S3-compatible, inherently supports these without requiring special, non-standard headers from the server-side configuration. Clients like `rclone` (as mentioned in `https://developers.cloudflare.com/r2/examples/rclone/`) or `aws s3 cp` (which uses S3 APIs) handle the `Range` header logic automatically for multipart uploads and resumable downloads.

### 3. How do other projects handle snapshot versioning + latest pointer?
The provided content for other projects, specifically Bitcoin (`https://raw.githubusercontent.com/bitcoin/bitcoin/master/doc/bootstrapping.md`) and Substrate (`https://raw.githubusercontent.com/paritytech/substrate/master/docs/CONTRIBUTING.adoc`), was not found (HTTP Error 404). Therefore, this question cannot be answered from the given sources.

### 4. Is there a CKB community snapshot already hosted somewhere (to avoid duplication)?
The provided CKB documentation (`https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md`) was not found (HTTP Error 404). Therefore, this question cannot be answered from the given sources.

### 5. What's the right cache-control for R2-hosted snapshots?
The provided Cloudflare R2 documentation does not explicitly recommend a `Cache-Control` header for snapshots. However, for large, relatively static files like blockchain snapshots that are updated periodically (e.g., daily or weekly), a strong `Cache-Control` header is generally appropriate to minimize bandwidth and improve download speeds for repeat users or proxies.

A common strategy would be:
*   `Cache-Control: public, max-age=<seconds>, immutable`
    *   `public`: Allows caching by any cache.
    *   `max-age`: Set to a long duration (e.g., 1 day = 86400 seconds, 1 week = 604800 seconds) reflecting the expected update frequency of the snapshot.
    *   `immutable`: If the snapshot file name changes with each new version (e.g., `ckb_snapshot_2023-10-27.tar.zstd`), this directive tells caches that the file will not change during its `max-age` lifetime, avoiding revalidation requests.

If the snapshot file name remains constant (e.g., `ckb_latest_snapshot.tar.zstd`), then `immutable` should *not* be used, and a shorter `max-age` with `must-revalidate` or `no-cache` might be considered, though this would defeat some caching benefits. For snapshots, versioning via filename is usually preferred.

### Gaps / Follow-up
1.  **CKB Community Expectations:** The most significant gap is the lack of information regarding CKB community expectations for snapshot compression formats and the existence of any current community-hosted snapshots. This information is crucial to avoid duplication and align with user preferences.
2.  **Snapshot Versioning Best Practices:** While not found in the provided content, researching common snapshot versioning strategies (e.g., date-based filenames, symbolic links/redirects for "latest") from other blockchain projects (Bitcoin, Ethereum, Substrate) would be beneficial.
3.  **Cloudflare R2 Specific `Cache-Control` Examples:** While general `Cache-Control` principles apply, specific examples or recommendations from Cloudflare R2 documentation for large, infrequently updated objects would be ideal.
4.  **CKB Docker Documentation:** Accessing the `run-ckb-with-docker.md` would likely provide insights into how CKB users are currently expected to bootstrap nodes, which might hint at snapshot usage or preferences.

### Relevant Code/API Snippets
The provided Cloudflare R2 documentation highlights its S3 compatibility, which implies standard S3 API usage for operations like uploading, downloading, and generating presigned URLs.

**Generating a Presigned URL (S3-compatible API example from `https://developers.cloudflare.com/r2/api/s3/presigned-urls/`):**
```bash
# Example using AWS CLI (configured for R2)
aws s3 presign s3://<BUCKET_NAME>/<OBJECT_KEY> --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```
This presigned URL can then be used by clients to download the object, and standard HTTP `Range` headers would be supported for resumable downloads.

**Rclone Configuration (from `https://developers.cloudflare.com/r2/examples/rclone/`):**
```ini
[r2]
type = s3
provider = Cloudflare
access_key_id = <YOUR_ACCESS_KEY_ID>
secret_access_key = <YOUR_SECRET_ACCESS_KEY>
endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```
Once configured, `rclone` commands like `rclone copy r2:my-bucket/path/to/snapshot.tar.zstd .` would automatically handle large file transfers and resumable operations using the underlying S3 API, which supports `Range` headers.