from elasticsearch import Elasticsearch
import os
from dotenv import load_dotenv
import base64

load_dotenv()
# Obtener valores desde .env
elasticsearch_url = os.getenv("ELASTICSEARCH_URL")
api_key_raw = os.getenv("ELASTIC_API_KEY")
    
api_key_encoded = base64.b64encode(api_key_raw.encode()).decode()

# Crear conexión con Elasticsearch
es = Elasticsearch(
    hosts=elasticsearch_url,
    api_key=api_key_encoded
)

try:
    info = es.info()
    print("Conexión exitosa a Elasticsearch")
    print(info)
except Exception as e:
    print(f"Error conectándose a Elasticsearch: {e}")

def get_suggestions(prefix: str):
    """
    Realiza una consulta de autocompletado en Elasticsearch.
    """
    body = {
        "suggest": {
            "name-suggest": {
                "prefix": prefix,
                "completion": {
                    "field": "name",
                    "size": 5
                }
            }
        }
    }
    try:
        response = es.search(index="your_index", body=body)
        suggestions = response['suggest']['name-suggest'][0]['options']
        return [suggestion['text'] for suggestion in suggestions]
    except Exception as e:
        print(f"Error al obtener sugerencias: {e}")
        return []

def get_location_hierarchy():
    """
    Devuelve la jerarquía de locaciones (Departments → Cabinets → Folders).
    """
    body = {
        "size": 0,
        "aggs": {
            "departments": {
                "terms": {"field": "location_hierarchy.department", "size": 100},
                "aggs": {
                    "cabinets": {
                        "terms": {"field": "location_hierarchy.cabinet", "size": 100},
                        "aggs": {
                            "folders": {
                                "terms": {"field": "location_hierarchy.folder", "size": 100}
                            }
                        }
                    }
                }
            }
        }
    }
    response = es.search(index="25_12345678902", body=body)
    # Estructura la jerarquía para el frontend
    departments = []
    for dept in response['aggregations']['departments']['buckets']:
        department = {
            "name": dept['key'],
            "cabinets": []
        }
        for cab in dept['cabinets']['buckets']:
            cabinet = {
                "name": cab['key'],
                "folders": [folder['key'] for folder in cab['folders']['buckets']]
            }
            department["cabinets"].append(cabinet)
        departments.append(department)
    return departments

def get_attributes():
    """
    Devuelve los atributos y sus valores únicos.
    """
    body = {
        "size": 0,
        "aggs": {
            "attributes": {
                "nested": {"path": "attributes"},
                "aggs": {
                    "by_name": {
                        "terms": {"field": "attributes.name", "size": 100},
                        "aggs": {
                            "by_value": {
                                "terms": {"field": "attributes.value", "size": 100}
                            }
                        }
                    }
                }
            }
        }
    }
    response = es.search(index="25_12345678902", body=body)
    # Estructurar respuesta
    attributes = []
    for attr in response['aggregations']['attributes']['by_name']['buckets']:
        attributes.append({
            "name": attr['key'],
            "values": [value['key'] for value in attr['by_value']['buckets']]
        })
    return attributes

def search_documents(query, filters):

    must_clauses = []
    filter_clauses = []

    # 🔹 Búsqueda en contenido (si existe query)
    if query:
        must_clauses.append({"match": {"content": query}})

    # 🔹 Filtrar por folder_name
    if filters.get("folder"):
        filter_clauses.append({"term": {"folder_name.keyword": filters["folder"]}})

    # 🔹 Filtrar por atributos (nested)
    if filters.get("attributes"):
        should_clauses = []
        for attr_name, attr_value in filters["attributes"].items():
            should_clauses.append({
                "bool": {
                    "must": [
                        {"term": {"attributes.name": attr_name}},
                        {"term": {"attributes.value": attr_value}}
                    ]
                }
            })

        filter_clauses.append({
            "nested": {
                "path": "attributes",
                "query": {
                    "bool": {
                        "should": should_clauses
                    }
                }
            }
        })

    # 🔹 Construir la consulta final
    search_query = {
        "query": {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses
            }
        }
    }

    # 🔹 Debug: Imprimir la consulta generada para comparar con Kibana
    print("Consulta Generada en FastAPI:", search_query)

    # 🔹 Ejecutar la consulta
    response = es.search(index="25_12345678902", body=search_query)
    return response["hits"]["hits"]

# def search_documents(query, filters):
#     print("Realizando búsqueda en Elasticsearch...")
#     # Construcción de la consulta dinámica
#     must_clauses = []
#     filter_clauses = []
#     print("Filtros recibidos:", filters)
#     print("Query recibida:", query)

#  # 🔹 Búsqueda en el contenido del documento
#     if query:
#         must_clauses.append({"match": {"content": query}})

#     # 🔹 Filtrar por ubicación (nombre o ID)
#     if filters.get("department"):
#         # Ajusta según el campo correcto. Si es un ID, debe ser numérico.
#         filter_clauses.append({"term": {"location_hierarchy.name.keyword": filters["department"]}})

#     if filters.get("cabinet"):
#         # Ajusta según el campo correcto. Si es un ID, debe ser numérico.
#         filter_clauses.append({"term": {"location_hierarchy.name.keyword": filters["cabinet"]}})

#     if filters.get("folder"):
#         filter_clauses.append({"term": {"folder_name.keyword": filters["folder"]}})

#     # 🔹 Filtrar por atributos dinámicos (nested)
#     if filters.get("attributes"):
#         nested_filters = []
#         for attr_name, attr_value in filters["attributes"].items():
#             nested_filters.append(
#                 {"bool": {"must": [
#                     {"term": {"attributes.name": attr_name}},
#                     {"term": {"attributes.value": attr_value}}
#                 ]}}
#             )
        
#         filter_clauses.append({
#             "nested": {
#                 "path": "attributes",
#                 "query": {
#                     "bool": {
#                         "must": nested_filters
#                     }
#                 }
#             }
#         })

#     # 🔹 Construcción final de la query
#     search_query = {
#         "query": {
#             "bool": {
#                 "must": must_clauses,
#                 "filter": filter_clauses
#             }
#         }
#     }

#     # Debugging: Imprimir la consulta generada
#     print("Consulta Elasticsearch:", search_query)

#     # Ejecutar la consulta en Elasticsearch
#     response = es.search(index="25_12345678902", body=search_query)
#     return response["hits"]["hits"]