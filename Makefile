.PHONY: dev-fe dev-be test lint build-fe test-fe test-be lint-fe lint-be

dev-fe:
	cd frontend && npm run dev

dev-be:
	cd backend && (.venv/bin/uvicorn app.main:app --reload --port 8000 2>/dev/null || .venv/Scripts/uvicorn app.main:app --reload --port 8000)

build-fe:
	cd frontend && npm run build

test-fe:
	cd frontend && npm test

test-be:
	cd backend && (.venv/bin/pytest 2>/dev/null || .venv/Scripts/pytest)

test: test-be test-fe

lint-fe:
	cd frontend && npm run lint

lint-be:
	cd backend && (.venv/bin/ruff check . 2>/dev/null || .venv/Scripts/ruff check .)

lint: lint-be lint-fe
