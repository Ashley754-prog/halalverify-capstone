Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

backendDir = "D:\Downloads\kenfiles\halalverify-capstone\backend"
pythonExe = "D:\Downloads\kenfiles\halalverify-capstone\backend\.venv\Scripts\python.exe"
ngrokExe = "C:\Users\User's\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"

' 1. Start Python FastAPI backend if port 8000 is not already bound
WshShell.CurrentDirectory = backendDir
startBackendCmd = "powershell -WindowStyle Hidden -Command ""if (!(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue)) { & '" & pythonExe & "' -m uvicorn app.main:app --host 0.0.0.0 --port 8000 }"""
WshShell.Run startBackendCmd, 0, True

' Small pause for server initialization
WScript.Sleep 2000

' 2. Start Ngrok background tunnel with permanent domain
startNgrokCmd = "powershell -WindowStyle Hidden -Command ""if (!(Get-Process ngrok -ErrorAction SilentlyContinue)) { & '" & ngrokExe & "' start halalverify }"""
WshShell.Run startNgrokCmd, 0, False
