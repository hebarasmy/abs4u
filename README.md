# Abs4u Local MVP

A local-first MVP for testing the Abs4u concept: users build weekly routines from a structured exercise/activity catalog, save their own recorded movements, log progress, and share form clips with the community feed.

## Test account

- Email: `user1@abs4u.test`
- Password: `Abs4uDemo1!`

You can also create a new tester account from the sign-up page.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database and storage

- SQLite database: `.data/abs4u.sqlite`
- Uploaded videos: `public/uploads`
- No Supabase or cloud database required.

## Deploy on Render

This app can be deployed on Render with a persistent disk for 2-week tester access.

1. Push the repo to GitHub.
2. Create a Render `Web Service`.
3. Use:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
4. Add a persistent disk and mount it to:
   - `/opt/render/project/src/storage`
5. Add this environment variable:
   - `ABS4U_STORAGE_ROOT=/opt/render/project/src/storage`

With that single variable:
- the SQLite database will live at `/opt/render/project/src/storage/.data/abs4u.sqlite`
- uploaded media will live at `/opt/render/project/src/storage/uploads`

The app now serves uploaded media through `/uploads/...`, so files keep working even when they are stored outside `public/uploads`.

## What is included

- Login/sign-up with local sessions
- A large built-in movement catalog across chest, back, shoulders, biceps, triceps, thighs, calves, glutes, core, full body, machines, free weights, bodyweight movements, and activities
- Calendar/routine planner by day
- Add from library → return to the exact routine day → set sets, reps, weight, rest, or activity duration
- Custom exercise/activity creation with optional short video preview
- Exercise/activity logging with clips
- 90-day comparison logic
- Community feed with posts, comments, and reactions

The built-in catalog is reference content, not fake user history. Tester-created routines, logs, clips, and community posts remain empty until the user makes them.
