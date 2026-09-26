# OptiScale — Test Cases

This folder is used to store sample projects for testing the OptiScale upload flow.

## Recommended Structure

```
test-cases/
├── README.md
├── <project-name-1>/          ← Unzipped project folder (optional)
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── <project-name-1>.zip       ← ZIP file to be actually uploaded
├── <project-name-2>/
└── <project-name-2>.zip
```

Keeping the unzipped folder next to the `.zip` is optional, but it makes diffs
reviewable and lets you re-create the archive after editing a file.

## How to Use

1. Place the `.zip` file of the project you want to test in this folder.
2. Open `app.html`.
3. Drag the ZIP file into the upload box, or click **SELECT FILE**.
4. Select the file from this folder.

## Supported Formats (MVP)

| Stack | Details |
| :--- | :--- |
| Python | 3.10 / 3.11 |
| Framework | FastAPI |
| Database | PostgreSQL |

## ZIP File Requirements

- Must have a `.zip` extension.
- No maximum file size limit.
- Should contain `requirements.txt` or `pyproject.toml` in the root directory or a subfolder.

## Git

This folder is ignored by git (see `.gitignore`) — no files here are committed to
the repo. Test archives stay local to your machine.
