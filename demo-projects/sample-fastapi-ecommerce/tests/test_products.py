import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_products():
    response = client.get('/api/products/')
    assert response.status_code == 200

def test_get_product():
    response = client.get('/api/products/1')
    assert response.status_code in [200, 404]
