@echo off
set TARGET=%1
if "%TARGET%"=="" set TARGET=test

if "%TARGET%"=="dev-fe" (
    cd frontend && npm run dev
) else if "%TARGET%"=="dev-be" (
    cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
) else if "%TARGET%"=="build-fe" (
    cd frontend && npm run build
) else if "%TARGET%"=="test-fe" (
    cd frontend && npm test
) else if "%TARGET%"=="test-be" (
    cd backend && .venv\Scripts\pytest.exe
) else if "%TARGET%"=="test" (
    echo Running backend tests...
    cd backend && .venv\Scripts\pytest.exe
    if errorlevel 1 exit /b 1
    cd ..
    echo Running frontend tests...
    cd frontend && npm test
    if errorlevel 1 exit /b 1
    cd ..
) else if "%TARGET%"=="lint-fe" (
    cd frontend && npm run lint
) else if "%TARGET%"=="lint-be" (
    cd backend && .venv\Scripts\ruff.exe check .
) else if "%TARGET%"=="lint" (
    echo Running backend linter...
    cd backend && .venv\Scripts\ruff.exe check .
    if errorlevel 1 exit /b 1
    cd ..
    echo Running frontend linter...
    cd frontend && npm run lint
    if errorlevel 1 exit /b 1
    cd ..
) else (
    echo Unknown target: %TARGET%
    exit /b 1
)
