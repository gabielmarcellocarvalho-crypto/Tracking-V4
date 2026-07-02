# System Integration & Data Persistence Overview

This document maps the current system's architecture, specifically focusing on external integrations and the mechanism used for persistent "fixed" account information.

## 1. System Architecture Map

The application uses a **Next.js** frontend with **Firebase** as the backend-as-a-service (BaaS).

```mermaid
graph TD
    User[User / Client] --> Frontend[Next.js App (src/app)]
    Frontend --> Auth[Firebase Auth]
    Frontend --> Firestore[Firestore Database]
    Frontend --> Functions[Firebase Cloud Functions]

    subgraph "Backend (Firebase)"
        Auth
        Firestore
        Functions
    end

    subgraph "External Integrations"
        MetaAPI[Meta Graph API (Facebook/Instagram)]
    end

    Functions -- Authenticate/Fetch Data --> MetaAPI
    Functions -- Save Tokens/Config --> Firestore
    Frontend -- Realtime Listener --> Firestore
```

## 2. Integration: Meta (Facebook/Instagram)

The Meta integration is handled via Firebase Cloud Functions to ensure security (keeping secrets server-side).

### Auth Flow

1.  **Frontend**: Initiates OAuth flow, receives an authorization `code`.
2.  **Frontend**: Calls `authMetaUser` Cloud Function with the code.
3.  **Backend**:
    - Exchanges `code` for `short_lived_token`.
    - Exchanges `short_lived_token` for `long_lived_token` (60 days).
    - Saves the token and expiry to `users/{user_email}/meta_integration` in Firestore.

### Data Flow (Ad Accounts & Insights)

1.  **Frontend**: Calls `getAdAccounts` or `getCampaignsInsights`.
2.  **Backend**:
    - Retrieves the user's `access_token` from Firestore (`users/{email}`).
    - Calls Meta Graph API.
    - Returns formatted data to Frontend.

## 3. "Fixed Saving" Mechanism (Data Persistence)

You asked how account information is saved "fixed" and applied to other screens. This is achieved using **Firebase Firestore Realtime Listeners** combined with a global **React Context**.

### The Pattern: Global Observer

Instead of fetching data on every page load, the application sets up a single, persistent connection to the user's profile in the database.

#### Schema

User data is stored in Firestore at: `users/{user_email}`.
Structure:

```json
{
  "uid": "...",
  "email": "...",
  "meta_integration": {
    "access_token": "...",
    "default_ad_account_id": "123456",
    "pixel_configs": [...]
  }
}
```

#### Implementation Details

1.  **The Source of Truth (Firestore)**:
    - All "fixed" settings (tokens, default accounts, preferences) are stored in the user's Firestore document.
    - Backend functions (like `saveDefaultAccount`) write directly to this document.

2.  **The Global Listener (AuthProvider)**:
    - Located in `src/providers/auth-provider.tsx`.
    - It uses `onSnapshot` from the Firebase SDK.
    - **Crucial Logic**:
      ```typescript
      // src/providers/auth-provider.tsx
      useEffect(() => {
        onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            // REALTIME LISTENER
            const unsubscribe = onSnapshot(
              doc(db, "users", firebaseUser.email),
              (doc) => {
                setUserProfile(doc.data()); // Updates state immediately when DB changes
              },
            );
          }
        });
      }, []);
      ```

3.  **Applying to Other Pages**:
    - The data is exposed via the `useAuth()` hook.
    - Any component, anywhere in the app, can access the specific "fixed" data:
      ```typescript
      const { userProfile } = useAuth();
      console.log(userProfile.meta_integration.default_ad_account_id);
      ```
    - Since it's a "Context", when the data in Firestore changes (e.g., you click "Save" on a settings page), **every component in the app rerenders automatically** with the new data. No manual refresh or prop drilling is required.

### How to Replicate This (For your other project)

To achieve this in another project:

1.  **Database**: Use a database that supports realtime subscriptions (Firebase, Supabase) or use a state management library ensuring a "fetch once, use everywhere" pattern (React Query, SWR).
2.  **Context**: Wrap your application in a Provider (`<AuthProvider>`).
3.  **Sync**: In the Provider, listen to the specific record in your DB.
4.  **Write**: Ensure your "Save" buttons write to that same DB record.
5.  **Read**: Consume the context in your pages (`useAuth` or `useUser`).

This ensures that "what is saved" is immediately "applied" everywhere.
