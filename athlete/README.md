# Athlete data

This folder holds the athlete memory that the `adaptive-endurance-coach`
skill reads. The skill does **not** read it from here. It reads it from a
folder in the home directory.

Copy the files across before a coaching session:

**macOS / Linux**
```bash
mkdir -p ~/.training
cp athlete/athlete_profile.md athlete/preferences.md athlete/nutrition.md ~/.training/
```

**Windows (PowerShell)**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.training" | Out-Null
Copy-Item athlete\athlete_profile.md,athlete\preferences.md,athlete\nutrition.md "$env:USERPROFILE\.training\"
```

Copy any changes back to this folder afterwards, then commit them. This
folder is the durable copy. The home-directory folder is the working copy.

## Files

| File | Contents |
|---|---|
| `athlete_profile.md` | Physical data, disciplines, thresholds, goals, gaps |
| `preferences.md` | Communication style, food rules, supplement rules |
| `nutrition.md` | Energy targets, daily macros, the swim-to-gym shake |

## Note

This folder contains personal health data. Git history is permanent. Keep
that in mind before you change the visibility of this repository.
