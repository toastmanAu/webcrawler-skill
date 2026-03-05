# Research: supabase-rls-member-security-audit

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/auth/row-level-security.mdx, https://raw.githubusercontent.com/supabase/supabase-js/master/README.md, https://supabase.com/docs/guides/api/api-keys

---

Date: 2026-03-05

## Summary
The Wyltek membership system uses Supabase with Row Level Security (RLS) and JoyID CKB addresses for user identification, leveraging an anonymous (anon) key client-side. An attacker with the anon key and table names can access data via the `anon` Postgres role, but RLS policies are crucial for limiting this access. To prevent impersonation without full traditional authentication, requiring CKB signed messages for write operations, verified by Supabase Edge Functions, is the simplest and most effective security upgrade. While the system already integrates JoyID CKB addresses with Supabase auth, the specific flow for generating Supabase JWTs from CKB addresses is not detailed in the provided content.

## Questions to Answer

### 1. What can an attacker do with just the anon key and knowledge of table names?
With just the `anon` key and knowledge of table names, an attacker can interact with the Supabase project's database via the `anon` Postgres role. According to the Supabase documentation, the `anon` key is "Safe to expose online" and "not intended to protect from... Static or dynamic code analysis and reverse engineering attempts. Use of the Network inspector in the browser."

The `anon` key provides a "first layer of authentication" for application components, offering basic Denial-of-Service protection and helping to filter out random internet activity. However, it does not distinguish between users. Access to data when using the `anon` key is primarily guarded by Postgres via the built-in `anon` and `authenticated` roles. If Row Level Security (RLS) is not enabled or is improperly configured, an attacker could potentially read or write data to tables accessible by the `anon` role.

### 2. How can we use Supabase RLS to enforce "only the owner CKB address can write their own row"?
The provided content confirms that Row Level Security (RLS) is the mechanism for controlling data access based on user identity, stating that the `Wyltek Industries site` already uses "JoyID CKB address → Supabase auth, RLS-protected." The `supabase.com/docs/guides/api/api-keys` document emphasizes the importance of enabling RLS on all tables and regularly reviewing RLS policies for permissions granted to the `anon` and `authenticated` roles.

However, the specific SQL or policy structure required to enforce "only the owner CKB address can write their own row" is not detailed in the provided `supabase.com/docs/guides/api/api-keys` document. The intended documentation for RLS policies (`https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/auth/row-level-security.mdx`) resulted in a `FETCH ERROR: HTTP Error 404: Not Found`, which means the detailed guidance on implementing such policies is missing from the provided source.

### 3. Is there a JoyID / CKB address → Supabase JWT flow we should implement?
The `Wyltek Industries site` already implements "JoyID CKB address → Supabase auth, RLS-protected," indicating that a mechanism for using CKB addresses with Supabase authentication is already in place. Supabase Auth, as described in the `supabase.com/docs/guides/api/api-keys` document, authenticates users with their "personal JWT." The `@supabase/auth-js` library is the "Authentication SDK" for Supabase.

However, the provided content does not detail the specific "JoyID / CKB address → Supabase JWT flow" or how a CKB address is mapped to a Supabase user and subsequently issued a JWT without "traditional auth." It does not confirm if Supabase offers native support for CKB addresses as an authentication provider, implying that a custom solution (potentially involving Supabase Edge Functions or a backend service) is likely used to bridge the CKB address identity to Supabase's JWT-based authentication system.

### 4. Can we use Supabase edge functions to verify a CKB signed message before writing?
Yes, Supabase Edge Functions can be used to verify a CKB signed message before writing to the database. The `supabase.com/docs/guides/api/api-keys` document describes Edge Functions as "secure, developer-controlled components" that can "implement prior authorization themselves." They are suitable for server-side logic and can use `service_role` or `secret keys` for elevated access, which "bypasses Row Level Security." The `@supabase/functions-js` SDK is available for interacting with Edge Functions.

Given that "secp256k1 signing confirmed working (used in DOB minting flow)" for CKB, an Edge Function could be developed to:
1. Receive a CKB address, a message, and its corresponding secp256k1 signature from the client.
2. Verify the signature using a secp256k1 library within the Edge Function's runtime (Deno).
3. If the signature is valid, proceed with the database write operation using the `service_role` key, ensuring the CKB address associated with the signature is correctly recorded or used in the RLS context.

### 5. What's the simplest security upgrade that prevents impersonation without full auth?
The simplest security upgrade to prevent impersonation, without implementing a full traditional authentication flow, would be to require users to cryptographically sign a message for any write operations. This signed message would then be verified server-side.

Specifically, for the Wyltek membership system:
1. **Client-side:** When a user performs an action that requires writing data (e.g., submitting a bug report, liking a post), the client-side JavaScript (which already uses JoyID CKB addresses) would prompt the user to sign a specific message (e.g., a unique session ID, a timestamp, or the data payload itself) using their CKB address's private key.
2. **Server-side (Supabase Edge Function):** The CKB address, the message, and the generated signature would be sent to a Supabase Edge Function. As established in Q4, this Edge Function would then verify the secp256k1 signature against the claimed CKB address.
3. **Database Write:** Only if the signature is successfully verified would the Edge Function proceed to write the data to the Supabase database, ensuring that the CKB address associated with the write operation genuinely belongs to the signer.

This approach leverages existing CKB signing capabilities and Supabase's server-side compute via Edge Functions to provide strong cryptographic proof of identity for write operations, directly addressing the impersonation concern without requiring a traditional username/password or OAuth flow.

## Gaps / Follow-up
1.  **Supabase RLS Policy Examples:** The `supabase/supabase/master/apps/docs/content/guides/auth/row-level-security.mdx` document was not found. This is a critical gap, as it would likely contain specific SQL examples and best practices for implementing RLS policies, including those for owner-based write access.
2.  **JoyID / CKB Address to Supabase Auth Flow Details:** While the `Wyltek Industries site` already uses "JoyID CKB address → Supabase auth," the specific implementation details of this flow are not provided. Understanding how a CKB address is linked to a Supabase user ID or role, and how a Supabase JWT is issued in this context without "traditional auth," would be beneficial for further security enhancements.
3.  **Secp256k1 Verification in Edge Functions:** While the concept of using Edge Functions for signature verification is clear, specific guidance on which secp256k1 libraries are available or recommended within the Deno runtime environment of Supabase Edge Functions would be helpful for implementation.

## Relevant Code/API Snippets
*   **`@supabase/supabase-js`**: Main isomorphic SDK for Supabase.
*   **`@supabase/auth-js`**: Supabase Authentication SDK, used for user management and JWT-based authentication.
*   **`@supabase/postgrest-js`**: Supabase PostgREST SDK for database operations, used for interacting with tables.
*   **`@supabase/functions-js`**: Supabase Edge Functions SDK, used for invoking and interacting with Edge Functions.
*   **`anon` key**: Publishable API key for client-side operations, granting access via the `anon` Postgres role.
*   **`service_role` key / `secret keys`**: Elevated access keys for secure, developer-controlled components like Edge Functions, granting full access and bypassing RLS (via the `BYPASSRLS` attribute).