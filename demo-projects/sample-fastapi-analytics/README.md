# Sample FastAPI Analytics Dashboard API
## OptiScale Demo Project #3

Stack: Python 3.11 / FastAPI / PostgreSQL / Pandas

### Performance Issue
app/storage/queries.py — N+1 pattern in load_dashboard_reports().
Each report's rows are lazy-loaded inside a loop.
