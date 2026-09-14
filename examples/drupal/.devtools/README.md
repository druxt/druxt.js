# .devtools — Docker-free lane

Same scripts and interface as the druxtjs.org site backend, minus Tome:

- `assemble` — composer install
- `provision` — site-install demo_umami (SQLite) + druxt + /es + consumer
- `start` / `stop` — PHP built-in server (docroot `web/`), 127.0.0.1:8888
  by default (`WEBSERVER_HOST`/`WEBSERVER_PORT` override; `.env` supported)
- `info` — read-only environment summary; `make debug` toggles Xdebug

CI uses this lane directly (setup-php + pdo_sqlite, no Docker).
