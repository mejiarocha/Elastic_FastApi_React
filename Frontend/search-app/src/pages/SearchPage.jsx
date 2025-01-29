import { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [useFuzzy, setUseFuzzy] = useState(false);
  const [folder, setFolder] = useState("");
  const [attributes, setAttributes] = useState([]);
  const [results, setResults] = useState([]);

  const folders = ["Folder1", "TEST_F2", "Finance", "Legal"];

  const addFilter = () => {
    setAttributes([...attributes, { key: "", value: "" }]);
  };

  const updateFilter = (index, key, value) => {
    const newFilters = [...attributes];
    newFilters[index] = { key, value };
    setAttributes(newFilters);
  };

  const handleSearch = async () => {
    const formattedFilters = attributes.reduce((acc, attr) => {
      if (attr.key && attr.value) acc[attr.key] = attr.value;
      return acc;
    }, {});

    const payload = {
      query,
      folder: folder || undefined,
      attributes: formattedFilters,
      use_fuzzy: useFuzzy,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/search/documents",
        payload
      );
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching search results", error);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center">🔍 Searches</h1>
      <div className="card p-4 shadow-sm">
        <input
          className="form-control mb-3"
          placeholder="Palabra clave"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            checked={useFuzzy}
            onChange={() => setUseFuzzy(!useFuzzy)}
          />
          <label className="form-check-label">Fuzzy search</label>
        </div>
        <select
          className="form-select my-3"
          onChange={(e) => setFolder(e.target.value)}
        >
          <option value="">Folder</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <h5>Attribute filter</h5>
        {attributes.map((attr, index) => (
          <div key={index} className="row mb-2">
            <div className="col">
              <input
                className="form-control"
                placeholder="Atributo"
                value={attr.key}
                onChange={(e) =>
                  updateFilter(index, e.target.value, attr.value)
                }
              />
            </div>
            <div className="col">
              <input
                className="form-control"
                placeholder="Valor"
                value={attr.value}
                onChange={(e) => updateFilter(index, attr.key, e.target.value)}
              />
            </div>
          </div>
        ))}
        <button className="btn btn-secondary w-100 mb-2" onClick={addFilter}>
          ➕ Add
        </button>
        <button className="btn btn-primary w-100" onClick={handleSearch}>
          🔍 Search
        </button>
      </div>
      <div className="mt-4">
        <h2>📄 Results</h2>
        {results.length === 0 ? (
          <p>Did not find any documents.</p>
        ) : (
          results.map((doc, index) => (
            <div key={index} className="card p-3 mt-3">
              <h5>📜 Document: {doc._id}</h5>
              <p>
                <strong>📂 Folder:</strong> {doc._source.folder_name}
              </p>
              <h6>📌 Attribute:</h6>
              <ul>
                {doc._source.attributes.map((attr, i) => (
                  <li key={i}>
                    <strong>{attr.name}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
