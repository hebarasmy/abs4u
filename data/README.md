# Data notes

The app includes a local reference catalog so testers can build real routines immediately without fake workout history. The catalog is stored as static TypeScript data in `data/exercise-catalog.ts` and is inserted into SQLite with `guest_profile_id = NULL` and `session_source = 'catalog'`.

User-created exercises, videos, routines, logs, and posts are stored separately with the signed-in user ID. This keeps the MVP realistic while still giving the library enough exercises and activities to test the product flow.

The Kaggle notebooks/archive can still be used later for analytics, recommendation logic, or AI-based exercise suggestions, but they are not used as fake user history.
