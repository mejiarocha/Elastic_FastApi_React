from fastapi import APIRouter, Query, Body
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.elastic import get_location_hierarchy, get_attributes, search_documents

router = APIRouter(prefix="/search", tags=["Search"])


# 🔹 Modelo de búsqueda extendido
class SearchRequest(BaseModel):
    query: Optional[str] = None
    department: Optional[str] = None
    cabinet: Optional[str] = None
    folder: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None

@router.get("/locations")
def get_locations():
    """
    Devuelve la jerarquía de locaciones.
    """
    return get_location_hierarchy()

@router.get("/attributes")
def get_available_attributes():
    """
    Devuelve los atributos disponibles y sus valores.
    """
    return get_attributes()

class SearchRequest(BaseModel):
    query: Optional[str] = None
    department: Optional[str] = None
    cabinet: Optional[str] = None
    folder: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None

@router.post("/documents")
def search(request: SearchRequest = Body(...)):
    """
    Endpoint para realizar una búsqueda de documentos en Elasticsearch con múltiples filtros.
    """
    print("Request recibida:", request)
    
    filters = {
        "department": request.department,
        "cabinet": request.cabinet,
        "folder": request.folder,
        "attributes": request.attributes
    }
    
    return search_documents(request.query, filters)
