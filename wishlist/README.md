# Wishlist Aplikace

Interaktivní seznam darů s možností rezervace. Люди s přístupem si mohou vybrat dar a zamluvit si, že ho koupí.

## Soubory

- `index.html` — hlavní stránka
- `styles.css` — Yung Lean neon design
- `script.js` — logika (Supabase integrace, rezervace)
- `.gitignore` — git ignorem

## Spuštění lokálně

```bash
cd /path/to/wishlist
python3 -m http.server 8000
# otevři http://localhost:8000
```

## Technologie

- **Frontend**: HTML + CSS + vanilla JavaScript
- **Backend**: Supabase (PostgreSQL + REST API)
- **Real-time**: Supabase real-time subscriptions
- **Design**: Neon/vaporwave (Yung Lean styl)

## Jak to funguje

1. Stránka se načte a natáhne seznam darů ze Supabase
2. Uživatel vidí seznam dostupných darů
3. Klikne na "Rezervovat" → otevře se modal
4. Vyplní jméno a potvrdí
5. Dar se označí jako "Koupi: [Jméno]"
6. Ostatní uživatelé vidí změnu v reálném čase

