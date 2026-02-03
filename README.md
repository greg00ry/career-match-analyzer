# Career Match Analyzer

Aplikacja do analizy dopasowania CV do ofert pracy z wykorzystaniem AI (OpenAI GPT-4).

## 🚀 Funkcjonalności

- **Analiza CV** - Wgraj plik PDF z CV lub wklej tekst
- **Analiza oferty pracy** - Wklej opis stanowiska
- **Dopasowanie AI** - Automatyczna analiza zgodności kandydata z wymaganiami
- **Wynik procentowy** - Szczegółowa ocena dopasowania
- **Historia analiz** - Zapisywanie wyników lokalnie
- **Tryb demo** - Przykładowe analizy bez klucza API

## 🛠️ Technologie

### Frontend
- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- pdfjs-dist (parsowanie PDF)

### Backend
- Express.js
- MySQL / SQLite (automatyczny fallback)
- OpenAI API (GPT-4)

### Desktop
- Electron 29
- electron-builder

## 📦 Instalacja

### Wymagania
- Node.js 18+
- npm lub yarn

### Kroki

1. **Sklonuj repozytorium**
```bash
git clone https://github.com/greg00ry/career-match-analyzer.git
cd career-match-analyzer
```

2. **Zainstaluj zależności frontend**
```bash
npm install
```

3. **Zainstaluj zależności backend**
```bash
cd backend
npm install
```

4. **Skonfiguruj zmienne środowiskowe**
```bash
# backend/.env
OPENAI_API_KEY=your_openai_api_key
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=career_analyzer
```

## 🏃 Uruchomienie

### Tryb deweloperski

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Aplikacja dostępna pod: http://localhost:5173

### Aplikacja Electron (desktop)
```bash
npm run electron:dev
```

## 📦 Budowanie

### Web
```bash
npm run build
```

### Desktop - macOS
```bash
npm run electron:build
```

### Desktop - Windows
```bash
npm run electron:build:win
```

### Wszystkie platformy
```bash
npm run electron:build:all
```

Pliki instalacyjne znajdziesz w folderze `release/`.

## 📁 Struktura projektu

```
├── src/                    # Frontend React
│   ├── components/         # Komponenty UI
│   ├── lib/               # Klient API
│   └── types/             # TypeScript types
├── backend/               # Serwer Express
│   └── server.js          # Główny plik serwera
├── electron/              # Konfiguracja Electron
│   ├── main.js            # Proces główny
│   └── preload.js         # Preload script
└── release/               # Pliki instalacyjne (po buildzie)
```

## 🔧 Konfiguracja

### Baza danych

Aplikacja automatycznie wybiera:
1. **MySQL** - jeśli dostępny (produkcja)
2. **SQLite** - fallback (lokalna baza `career_analyzer.db`)

### API OpenAI

Bez klucza API aplikacja działa w **trybie demo** z przykładowymi analizami.

## 📄 Licencja

MIT

## 👤 Autor

Grzegorz Trzaskoma
