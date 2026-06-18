# X Connector Implementation Runbook

## Owner

This runbook owns the implementation direction for the Neuroartan X connector. It does not own frontend styling, icon registration, database migrations, or Supabase secrets.

## Purpose

The X connector imports an authorized user's X profile and authored posts into Neuroartan as governed source data. Imported posts must feed Source, Memory, Overview, Cognitive Map, and Training through the existing source and privacy contracts rather than becoming an isolated social-data store.

## First External Setup

Open the X Developer Portal:

https://developer.x.com/en/portal/dashboard

Create or select a Project and App, then configure the App authentication settings:

- App type: Web App or Automated App/Bot.
- OAuth version: OAuth 2.0.
- Flow: Authorization Code with PKCE.
- App permissions: Read only for the first connector pass.
- Required scopes: `tweet.read`, `users.read`, `offline.access`.
- Callback URL: use the production Supabase Edge Function callback once created.
- Website URL: production Neuroartan website URL.

Do not place the Client Secret or refresh tokens in frontend code.

## OAuth Contract

The frontend connector click should call an internal start endpoint, not build the X authorization URL directly with secrets.

Flow:

1. User clicks X in Home settings connectors.
2. Neuroartan creates a connector authorization session with `state`, PKCE verifier, owner user, profile, and model references.
3. Neuroartan redirects the user to X authorization.
4. X redirects to the callback URL with `code` and `state`.
5. The callback validates `state`, exchanges `code` for tokens, stores token references server-side, and returns to `/#home-platform-settings-connectors`.
6. The connector state becomes `connected` only after `/2/users/me` succeeds.

## Backend Ownership

Use existing tables first:

- `privacy_connector_state`: user-facing connector state, category, runtime, status, and non-secret metadata.
- `model_source_connectors`: model-level authorization record for X.
- `privacy_source_registry`: governed source registry entries for imported X data.
- `privacy_consent_ledger`: explicit consent for X read/import, retention, and memory use.
- `privacy_processing_ledger`: sync/import/analyze jobs.
- `model_source_objects`: imported X posts as source objects, with X IDs in metadata.
- `model_memory_consolidation_queue`: memory review queue for post-derived memory candidates.

New tables should be added only if the existing source object contract cannot safely support connector sync cursors, token references, or import jobs.

## Secret Handling

Store provider credentials only in Supabase function secrets:

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `X_REDIRECT_URI`
- `CONNECTOR_TOKEN_ENCRYPTION_KEY`
- `NEUROARTAN_SITE_URL`

Store user tokens only as encrypted server-side token references. Frontend state may show connection status, X handle, last sync time, and imported count, but never token values.

Current production callback URL:

https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-x-callback

## Import Contract

First import pass:

1. Call `/2/users/me` with `user.fields=id,username,name,created_at,description,profile_image_url,profile_banner_url,public_metrics,verified,verified_type`.
2. Call `/2/users/{id}/tweets` with pagination and `tweet.fields=id,text,created_at,author_id,conversation_id,entities,lang,public_metrics,possibly_sensitive,referenced_tweets,context_annotations`.
3. Store each post once using the X post ID as a source reference.
4. Preserve raw provider metadata in `source_metadata`.
5. Queue semantic extraction and memory consolidation only after consent is granted.

Sync must be cursor-based using `since_id` for incremental updates and `next_token` for backfill pagination.

## Privacy Contract

Each X import must preserve:

- owner user id
- profile id
- model id
- connector id
- consent state
- import timestamp
- X account id and username
- source URL
- deletion eligibility
- export eligibility

Revocation must stop future sync, mark connector state as revoked, and leave existing imported data under the user's deletion/export controls.

## Frontend Contract

The X connector item in Home settings should not toggle a fake connected state. Until OAuth is implemented, it may only show `Authorization required`.

Production states:

- `not-connected`
- `authorization-required`
- `authorizing`
- `connected`
- `expired`
- `revoked`
- `error`

Click behavior:

- `not-connected` or `authorization-required`: start OAuth.
- `connected`: open connector details.
- `expired`: start reauthorization.
- `revoked`: start authorization again.
- `error`: show diagnostics and retry.

## Processing Contract

Imported posts should be classified into:

- source object
- semantic memory candidate
- episodic continuity candidate
- social-affective signal
- expression-system signal
- cognitive-map node candidate

The connector must not claim consciousness, identity transfer, or autonomous personhood. It should describe the data as owner-authorized source material for the personal model.

## Verification Checklist

- X app exists and OAuth 2.0 is enabled.
- Callback URL exactly matches the X app setting.
- Start endpoint creates `state` and PKCE verifier.
- Callback validates `state`.
- Tokens are never visible in browser storage.
- `/2/users/me` succeeds before connector state becomes connected.
- Initial post import stores source objects without duplicates.
- Imported posts appear in Source database.
- Memory queue receives post-derived candidates only when external connector memory intake is enabled.
- Revocation prevents future sync.
- Deletion removes imported X source objects through the governed deletion flow.

## Official References

- X Developer Portal: https://developer.x.com/en/portal/dashboard
- X OAuth 2.0 Authorization Code with PKCE: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code
- X OAuth 2.0 user access token guide: https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token
- X current user endpoint: https://docs.x.com/x-api/users/get-my-user
- X user posts endpoint: https://docs.x.com/x-api/users/get-posts
