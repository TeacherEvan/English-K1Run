# Code Review Timer Script
# This script runs every 5 minutes to review staged files for automated improvements

# Change to the project directory
Set-Location "c:/Users/eboth/Documents/English-K1Run"

# Get staged files
$stagedFiles = git diff --cached --name-only

if ($stagedFiles) {
    $changed = $false
    foreach ($file in $stagedFiles) {
        if ($file -match '\.(ts|js)$') {
            # Run eslint --fix
            try {
                npx eslint --fix $file 2>$null
            } catch {
                # Ignore errors
            }
            # Run prettier --write
            try {
                npx prettier --write $file 2>$null
            } catch {
                # Ignore errors
            }
            # Check if file changed
            $status = git diff --name-only $file
            if ($status) {
                git add $file
                $changed = $true
            }
        }
    }
    if ($changed) {
        git commit -m "Automated code review: linting and formatting improvements"
    }
}