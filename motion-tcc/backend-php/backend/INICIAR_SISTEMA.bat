@echo off
setlocal
 title Sistema M.O.T.I.O.N - Ativador
cd /d "%~dp0"
echo ==========================================
echo    INICIANDO SISTEMA M.O.T.I.O.N (FULL)
echo ==========================================
echo.
python "%~dp0sistema_motion_full.py"
if errorlevel 1 (
  echo Python nao conseguiu iniciar o sistema.
)
pause
endlocal
