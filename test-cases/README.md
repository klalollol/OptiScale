# OptiScale — Test Cases

This folder is used to store sample projects for testing the OptiScale upload flow.

## Recommended Structure

test-cases/
├── README.md
├── <project-name-1>/          ← Unzipped project folder (optional)
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── <project-name-1>.zip       ← ZIP file to be actually uploaded
├── <project-name-2>/
└── <project-name-2>.zip

## How to Use

- Place the `.zip` file of the project you want to test in this folder.
- Open `app.html` and drag the ZIP file into the upload box or click **SELECT FILE**.
- Select the file from this folder.

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
- This folder is ignored by git (see `.gitignore`) — no files are committed to the repo.
