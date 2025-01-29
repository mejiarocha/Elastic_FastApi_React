from fastapi import FastAPI
from app.routers import search

app = FastAPI(title="Elasticsearch Autocomplete API")

# Registrar las rutas
app.include_router(search.router)

@app.get("/")
def root():
    return {"message": "API de Autocompletado con FastAPI y Elasticsearch"}
