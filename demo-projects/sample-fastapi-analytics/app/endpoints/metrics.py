from fastapi import APIRouter
router = APIRouter(prefix='/api/metrics', tags=['metrics'])

@router.get('/health')
def health():
    return {'status': 'ok'}
