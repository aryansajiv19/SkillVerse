# Benchmarks

Local Supabase (Postgres 17, Apple M-series laptop, Docker). Each script seeds its own data inside a transaction and rolls it back.

## Leaderboard rank (`leaderboard.sql`)

`?rank=eq.1000` is a legal PostgREST filter on the public `leaderboard` view, so its cost matters.

| Players | v1: count "players with more XP" per row | v2: one `rank()` window pass | Top-50 read (v2) |
|---:|---:|---:|---:|
| 10,000 | 5,398 ms | 3.4 ms | 2.6 ms |
| 50,000 | > 120 s (statement timeout) | 17.6 ms | 16.9 ms |

The v1 query is quadratic: one index count per player. The security review caught it; v2 lives in `supabase/migrations/20260927170053_security_hardening.sql`.

## Stats refresh on reset (`stats_trigger.sql`)

A player with every challenge done (50 rows) resets their progress with one `DELETE`.

| Trigger design | Stats refreshes | Time |
|---|---:|---:|
| Row-level (one refresh per deleted row) | 50 | 4.4 ms |
| Statement-level with transition tables (what we ship) | 1 | 0.57 ms, including the delete |
