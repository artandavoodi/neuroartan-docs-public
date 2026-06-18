# Connector Provider Onboarding Directive

This directive is for the external credential setup work that remains after the Neuroartan connector runtime has been installed. Use it with ChatGPT or a human operator when creating provider apps, copying client IDs and client secrets, and setting Supabase secrets.

## Runtime Contract

- Frontend owner: `docs/assets/js/layers/website/home/platform-menu/settings/connectors/index.js`
- State table: `privacy_connector_state`
- OAuth session table: `connector_oauth_sessions`
- Token vault table: `connector_token_vault`
- X specialized functions: `connectors-x-start`, `connectors-x-callback`
- Generic OAuth functions: `connectors-oauth-start`, `connectors-oauth-callback`
- Local/device connectors are not OAuth providers. They should route to browser picker or native bridge flows.

## Supabase Callback URLs

Use these URLs exactly in provider developer consoles.

- X callback: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-x-callback`
- Generic OAuth callback: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`

The callback functions must allow provider redirects. If JWT verification blocks browser callbacks, disable Verify JWT for callback functions only. Start functions should be called by the signed-in site session.

## Shared Supabase Secrets

Set these once:

```bash
npx supabase secrets set \
  NEUROARTAN_SITE_URL="http://localhost:8891" \
  CONNECTOR_TOKEN_ENCRYPTION_KEY="replace-with-long-random-secret"
```

Use the production site URL instead of localhost before production deployment.

## X

1. Open the X Developer Portal.
2. Create or open the Neuroartan app.
3. Enable OAuth 2.0 Authorization Code Flow with PKCE.
4. Add callback URL: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-x-callback`.
5. Enable scopes: `tweet.read`, `users.read`, `offline.access`.
6. Copy Client ID and Client Secret.
7. Set:

```bash
npx supabase secrets set \
  X_CLIENT_ID="..." \
  X_CLIENT_SECRET="..." \
  X_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-x-callback"
```

X imports posts into Source Vault through the specialized callback.

## GitHub

1. Open GitHub Developer settings.
2. Create an OAuth App.
3. Set Authorization callback URL to `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
4. Use scopes: `read:user`, `user:email`, `public_repo`.
5. Copy Client ID and Client Secret.
6. Set:

```bash
npx supabase secrets set \
  GITHUB_CLIENT_ID="..." \
  GITHUB_CLIENT_SECRET="..." \
  GITHUB_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

Repository import jobs should read from the stored token vault and create governed `model_source_objects`.

## GitLab

1. Open GitLab user, group, or instance Applications settings.
2. Create an OAuth application.
3. Set Redirect URI to `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
4. Enable scopes: `read_user`, `read_repository`.
5. Copy Application ID and Secret.
6. Set:

```bash
npx supabase secrets set \
  GITLAB_CLIENT_ID="..." \
  GITLAB_CLIENT_SECRET="..." \
  GITLAB_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

## Google Drive, Gmail, Calendar, Contacts

Use one Google Cloud OAuth consent screen and OAuth web client for all Google services.

1. Open Google Cloud Console.
2. Configure OAuth consent screen.
3. Enable required APIs: Drive API, Gmail API, Calendar API, People API.
4. Create OAuth Client ID of type Web application.
5. Add Authorized redirect URI: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
6. Copy Client ID and Client Secret.
7. Set:

```bash
npx supabase secrets set \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  GOOGLE_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

Runtime scopes are service-specific:

- Google Drive: `openid email profile https://www.googleapis.com/auth/drive.readonly`
- Gmail: `openid email profile https://www.googleapis.com/auth/gmail.readonly`
- Calendar: `openid email profile https://www.googleapis.com/auth/calendar.readonly`
- Contacts: `openid email profile https://www.googleapis.com/auth/contacts.readonly`

## Dropbox

1. Open the Dropbox App Console.
2. Create an app with scoped access.
3. Add Redirect URI: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
4. Enable scopes: `account_info.read`, `files.metadata.read`, `files.content.read`.
5. Copy App key and App secret.
6. Set:

```bash
npx supabase secrets set \
  DROPBOX_CLIENT_ID="..." \
  DROPBOX_CLIENT_SECRET="..." \
  DROPBOX_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

## OneDrive

1. Open Microsoft Entra admin center.
2. Register an application.
3. Add Web redirect URI: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
4. Add delegated Microsoft Graph permissions: `User.Read`, `Files.Read`, `offline_access`.
5. Create a client secret.
6. Set:

```bash
npx supabase secrets set \
  MICROSOFT_CLIENT_ID="..." \
  MICROSOFT_CLIENT_SECRET="..." \
  MICROSOFT_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

## Slack

1. Open Slack API Apps.
2. Create or open the Neuroartan Slack app.
3. Open OAuth & Permissions.
4. Add Redirect URL: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
5. Add bot scopes: `users:read`, `channels:history`, `groups:history`, `im:history`, `mpim:history`.
6. Copy Client ID and Client Secret.
7. Set:

```bash
npx supabase secrets set \
  SLACK_CLIENT_ID="..." \
  SLACK_CLIENT_SECRET="..." \
  SLACK_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

## Notion

1. Open the Notion integrations dashboard.
2. Create a public integration.
3. Add OAuth redirect URI: `https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback`.
4. Choose the workspace installation scope.
5. Copy OAuth client ID and client secret.
6. Set:

```bash
npx supabase secrets set \
  NOTION_CLIENT_ID="..." \
  NOTION_CLIENT_SECRET="..." \
  NOTION_REDIRECT_URI="https://dwlgvujubkpycrvhngku.supabase.co/functions/v1/connectors-oauth-callback"
```

## Verification SQL

Run after authorizing any connector:

```sql
select connector_service,
       connection_state,
       source_vault_ready,
       metadata,
       updated_at
from public.privacy_connector_state
order by updated_at desc;

select connector_service,
       provider_account_handle,
       revoked_at,
       updated_at
from public.connector_token_vault
order by updated_at desc;
```

## Import Job Rule

Authorization is not the same as ingestion. After a provider is connected, provider-specific import jobs must read only through the server-side token vault, create source records in `privacy_source_registry` and `model_source_objects`, and queue approved memory candidates in `model_memory_consolidation_queue`. The browser must never receive provider access tokens.
