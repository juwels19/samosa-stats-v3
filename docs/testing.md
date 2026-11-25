# Testing

Admins have test tools at **Settings > Testing** (`/settings/testing`) in non-production environments. The code is in `convex/mocks.ts` and `convex/lib/mocks/`.

## Turn mocks on

The tools exist only where the Convex env `MOCKS_ENABLED` is `true`. It is on in dev. Do not set it in production.

When it is off:

- the Testing tab is hidden and `/settings/testing` returns 404;
- every function in `convex/mocks.ts` refuses to run, except `isEnabled`.

The tab and page are also only for admins.

```sh
npx convex env set MOCKS_ENABLED true
```

## Mock picks

Mock players are rows in `users` with `isMock: true`. They can't sign in and they don't count as approved players.

- **Add picks** gives a random pick to each mock player that has no pick for the event. It makes more mock players when there are not enough.
- New mock picks start as "Mock player N". A moment later they get AI display names, the same as the Suggest button on the picks page. A pick keeps its old name when the model fails.
- **Clear mock picks** deletes the mock players' picks for the event. Real picks stay.

Mock picks count everywhere real picks count: pick lists, category values and scoring.

## Mock events

A mock event is a copy of a real event with `mock` set. It has:

- the same teams, categories and pick settings;
- an event code like `ONOSHMOCK1`;
- status changes one interval apart (1 to 60 minutes), starting from when you create it.

Each step runs the real action, with the real Discord message:

1. Open submissions
2. Send the reminder
3. Close submissions (also refreshes the teams)
4. Start the event
5. Complete

Team refresh and winner calculation use the source event's code (`getDataEventCode`), so they get real data.

On each mock event card:

- **Run now** runs one step at once.
- **Pause** cancels the scheduled steps that have not run. Run now still works.
- **Restart** sets the status to UPCOMING and schedules all steps again from now.
- **Delete** deletes the event with its teams, picks and winners.

A status only moves forward. A scheduled step for a status the event already has does nothing and sends no message. This applies to real events too.

## Discord

Mock events post to `DISCORD_WEBHOOK_URL`, the same webhook as real events. Point it at a test channel before you run mock steps.

Each message that a status change or reminder sends goes into the `discordMessages` table, with `isMock` and whether it was sent. The Testing page shows the latest 30.
