# Sample FastAPI Inventory API
## OptiScale Demo Project #2

Stack: Python 3.11 / FastAPI / PostgreSQL / Redis

### Performance Issue
app/db/queries.py — N+1 pattern in get_items_with_stock().
