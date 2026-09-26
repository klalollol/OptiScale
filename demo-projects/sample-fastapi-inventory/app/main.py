from fastapi import FastAPI
from app.api import items, warehouses

app = FastAPI(title="Inventory Management API", version="2.1.0")
app.include_router(items.router)
app.include_router(warehouses.router)
