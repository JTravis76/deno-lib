@ECHO off
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\deno.exe" (
  SET "_prog=%dp0%\deno.exe"
) ELSE (
  SET "_prog=deno"
  SET PATHEXT=%PATHEXT:;.TS;=;%
)

"%_prog%"  "run" "--allow-read" "--allow-write" "--allow-env" "--allow-net" "%dp0%\..\cli.ts" %*
ENDLOCAL
EXIT /b %errorlevel%
:find_dp0
SET dp0=%~dp0
EXIT /b
