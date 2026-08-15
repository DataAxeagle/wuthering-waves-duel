Option Explicit
Dim shell, fso, folder, command, exitCode
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & folder & "\launcher.ps1"""
exitCode = shell.Run(command, 0, True)
If exitCode <> 0 Then
  MsgBox "Wuthering Waves: Duel could not start (code " & exitCode & ")." & vbCrLf & "Double-click start game.cmd to see details and make sure the shared package is fully extracted.", vbCritical, "Wuthering Waves: Duel"
End If
