# CareerBoard

Public, free React/Vite job dashboard for https://yashxag.github.io/.

## Features
- Dashboard, discovery chart, availability metrics
- Search, vacancy/priority/work-mode filters, sorting, dynamic job details
- Application statuses saved locally in browser; export/import to transfer
- Job records: `public/data/jobs.json`, updated by committing to this repository
- No login, no credentials, no backend

## Build
```sh
npm install
npm run build
```

## Deployment
GitHub Settings → Pages → Build and deployment → Source: **GitHub Actions**.
Pushes to main trigger `.github/workflows/pages.yml`. If GitHub restricts Pages Actions for the first run, enable them in repository Settings → Actions.

Full descriptions are shown only where supplied in original data. Applications are stored in localStorage, not GitHub.
