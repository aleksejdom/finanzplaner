# FinanzPilot

Persönliche Finanzverwaltung mit Next.js 16, PostgreSQL (Drizzle ORM), Better-Auth, Tailwind CSS 4 und shadcn/ui.

## Features

- **Authentifizierung** – Registrierung/Login über Better-Auth (E-Mail + Passwort), Konten sind sofort nutzbar (keine Bestätigungs-E-Mail)
- **Einnahmen & Ausgaben** – Transaktionen mit Betrag, Kategorie, Beschreibung und Datum, inkl. wiederkehrender Buchungen
- **Eigene Kategorien** – frei anlegbar, mit Farbe; 8 Standard-Kategorien werden bei der Registrierung erstellt
- **Sparkonten** – beliebig viele Konten mit Ein-/Auszahlungen, Monats- und Jahresansicht
- **Sparziele mit ETF-Rechner** – Alter, Zielalter und Zielbetrag eingeben; die monatliche Sparrate wird automatisch berechnet, wahlweise mit ETF-Rendite (Sparplan-Formel, nachschüssige Rente)
- **Monatsarchiv** – jeder Monat bleibt mit Einnahmen/Ausgaben/Saldo dauerhaft abrufbar
- **Protokoll** – jede Änderung an Transaktionen/Sparbuchungen wird im Aktivitätslog festgehalten

## Entwicklung

```bash
npm install
cp .env.example .env.local   # DATABASE_URL, BETTER_AUTH_SECRET eintragen
npm run db:migrate           # Schema in die Postgres-DB anwenden
npm run dev                  # http://localhost:3000
```

### Umgebungsvariablen (`.env.local`, nie committen)

| Variable | Beschreibung |
| --- | --- |
| `DATABASE_URL` | Verbindungsstring zur PostgreSQL-Datenbank |
| `BETTER_AUTH_SECRET` | Zufälliger Secret-Key, z. B. `openssl rand -hex 32` |
| `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | Öffentliche Basis-URL der App |

## Architektur

- **Datenbank**: selbst gehostetes PostgreSQL. Schema unter `src/db/schema.ts`, Migrationen unter `drizzle/` (per `npm run db:generate` / `npm run db:migrate`). Tabellen: `user`/`session`/`account`/`verification` (Better-Auth), `categories`, `transactions`, `savings_goals`, `savings_accounts`, `savings_entries`, `activity_log`.
- **Auth**: [Better-Auth](https://www.better-auth.com) mit Drizzle-Adapter (`src/lib/auth.ts`), Client-Hooks in `src/lib/auth-client.ts`, API-Route unter `src/app/api/auth/[...all]/route.ts`.
- **Auth-Flow**: `src/proxy.ts` (Next 16: Nachfolger von `middleware.ts`) prüft optimistisch das Better-Auth-Session-Cookie und schützt alle Routen außer `/`, `/login`, `/register`. Die eigentliche Session-Prüfung passiert serverseitig über `src/lib/session.ts`.
- **Mutationen**: Server Actions in `src/app/(app)/actions.ts`, alle Datenbankzugriffe laufen über Drizzle (`src/db/index.ts`) und filtern explizit nach `userId` (kein Row-Level-Security-Ersatz mehr nötig, da direkter Postgres-Zugriff ohne Auth-Kontext in der DB).
- **Wiederkehrende Transaktionen**: `src/lib/recurring.ts` (Ersatz für die frühere Supabase-RPC).
- **Sparraten-Berechnung**: `src/lib/savings.ts`.
- **Aktivitätslog**: `src/lib/activity-log.ts` (Ersatz für den früheren DB-Trigger – wird explizit aus den Server Actions aufgerufen).

## Deployment (Docker statt Vercel)

```bash
docker compose up -d --build
```

`docker-compose.yml` baut das Next.js-Standalone-Image (`output: "standalone"` in `next.config.ts`) und liest die Laufzeit-Konfiguration aus `.env.local`. Die PostgreSQL-Datenbank läuft extern (z. B. als eigener Dienst auf demselben Coolify-/Docker-Host) – die App verbindet sich ausschließlich über `DATABASE_URL`.

Beim ersten Deployment auf einem neuen Server/einer neuen DB einmalig die Migrationen anwenden:

```bash
DATABASE_URL=... npm run db:migrate
```
