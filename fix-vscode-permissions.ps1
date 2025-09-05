```powershell
param(
    [string]$VSCodeUserDir = "$env:APPDATA\Code\User"
)

# Remove read-only attributes
Get-ChildItem -Path $VSCodeUserDir -Recurse -Force |
    ForEach-Object { attrib -r $_.FullName }

# Take ownership and grant full control to the current user
$me = [System.Security.Principal.NTAccount]("$env:USERDOMAIN\$env:USERNAME")
icacls $VSCodeUserDir /setowner $me /T /C | Out-Null
icacls $VSCodeUserDir /grant $me`:(OI)(CI)F /T /C | Out-Null

Write-Host "Permissions fixed for $VSCodeUserDir"
```