# Sample FastAPI E-Commerce API
## OptiScale Demo Project #1

Stack: Python 3.11 / FastAPI / PostgreSQL / SQLAlchemy

### Known Performance Issue
app/database.py contains an N+1 query pattern in get_users_with_orders().
This is the bottleneck OptiScale will detect and optimize.

### Run locally
pip install -r requirements.txt
uvicorn app.main:app --reload
