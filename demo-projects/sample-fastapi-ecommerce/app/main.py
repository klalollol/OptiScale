from fastapi import FastAPI
from app.routers import products, orders, users

app = FastAPI(title="E-Commerce API", version="1.0.0")

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)
