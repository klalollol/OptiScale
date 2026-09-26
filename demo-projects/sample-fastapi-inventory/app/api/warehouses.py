from fastapi import APIRouter
router = APIRouter(prefix='/api/warehouses', tags=['warehouses'])

@router.get('/')
def list_warehouses():
    return [{'id': 1, 'name': 'Bangkok DC'}, {'id': 2, 'name': 'Chiang Mai DC'}]
