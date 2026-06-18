# FinanzPilot

Persönliche Finanzverwaltung mit Next.js 16, Supabase, Tailwind CSS 4 und shadcn/ui.

## Features

- **Authentifizierung** – Registrierung/Login über Supabase Auth (E-Mail + Passwort, E-Mail-Bestätigung)
- **Einnahmen & Ausgaben** – Transaktionen mit Betrag, Kategorie, Beschreibung und Datum
- **Eigene Kategorien** – frei anlegbar, mit Farbe; 8 Standard-Kategorien werden bei der Registrierung erstellt
- **Sparziele mit ETF-Rechner** – Alter, Zielalter und Zielbetrag eingeben; die monatliche Sparrate wird automatisch berechnet, wahlweise mit ETF-Rendite (Sparplan-Formel, nachschüssige Rente)
- **Monatsarchiv** – jeder Monat bleibt mit Einnahmen/Ausgaben/Saldo dauerhaft abrufbar
- **Protokoll** – jede Änderung an Transaktionen wird per Datenbank-Trigger im Aktivitätslog festgehalten

## Entwicklung

```bash
npm install
npm run dev   # http://localhost:3000
```

Die Supabase-Zugangsdaten liegen in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

## Architektur

- **Datenbank**: Supabase-Projekt `finance-app` (eu-central-1). Tabellen: `profiles`, `categories`, `transactions`, `savings_goals`, `activity_log` – alle mit Row Level Security (Zugriff nur auf eigene Daten).
- **Auth-Flow**: `src/proxy.ts` (Next 16: Nachfolger von `middleware.ts`) refresht die Session und schützt alle Routen außer `/`, `/login`, `/register`, `/auth/*`.
- **Mutationen**: Server Actions in `src/app/(app)/actions.ts`.
- **Sparraten-Berechnung**: `src/lib/savings.ts`.
- **Trigger**: `handle_new_user` (Profil), `create_default_categories` (Standard-Kategorien), `log_transaction_change` (Protokoll).

## Hinweis zur E-Mail-Bestätigung

Neue Konten müssen per E-Mail bestätigt werden (Supabase-Standard). Der Bestätigungslink führt zurück zur App; der Code-Austausch passiert auf der Startseite bzw. unter `/auth/callback`. Für die Produktion im Supabase-Dashboard unter *Authentication → URL Configuration* die Site-URL und Redirect-URLs der Live-Domain eintragen.
