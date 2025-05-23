import { useState } from "react";

export default function SearchPage() {
  // Document filters state - expanded to match new API
  const [documentFilters, setDocumentFilters] = useState({
    content_id: "",
    fileRef: "",
    contentQuery: "",
    contentVersion: "",
    creationDateFrom: "",
    creationDateTo: "",
    lastModificationDateFrom: "",
    lastModificationDateTo: "",
    minFileSize: "",
    maxFileSize: "",
    extension: "",
    templates: [],
    hashtags: [],
    comments: [],
    primaryLocationId: "",
    secondaryLocationId: "",
    tertiaryLocationId: "",
    linkedTo: [],
    attributes: [],
    packetIds: [],
  });

  // Location filters state
  const [locationFilters, setLocationFilters] = useState({
    locationId: "",
    locationType: "",
    parentId: "",
    name: "",
    properties: [],
  });

  // Packet filters state
  const [packetFilters, setPacketFilters] = useState({
    projectId: "",
    name: "",
    packetEntities: [],
  });

  // General query state
  const [generalQuery, setGeneralQuery] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper for comma-separated fields
  const updateListField = (section, field, value) => {
    const list = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (section === "document") {
      setDocumentFilters((prev) => ({ ...prev, [field]: list }));
    }
  };

  // Dynamic list handlers
  const addItem = (section, field, emptyItem) => {
    if (section === "document") {
      setDocumentFilters((prev) => ({
        ...prev,
        [field]: [...prev[field], emptyItem],
      }));
    } else if (section === "location") {
      setLocationFilters((prev) => ({
        ...prev,
        [field]: [...prev[field], emptyItem],
      }));
    } else if (section === "packet") {
      setPacketFilters((prev) => ({
        ...prev,
        [field]: [...prev[field], emptyItem],
      }));
    }
  };

  const removeItem = (section, field, index) => {
    if (section === "document") {
      setDocumentFilters((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    } else if (section === "location") {
      setLocationFilters((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    } else if (section === "packet") {
      setPacketFilters((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (section, field, index, key, value) => {
    if (section === "document") {
      setDocumentFilters((prev) => ({
        ...prev,
        [field]: prev[field].map((item, i) =>
          i === index ? { ...item, [key]: value } : item
        ),
      }));
    } else if (section === "location") {
      setLocationFilters((prev) => ({
        ...prev,
        [field]: prev[field].map((item, i) =>
          i === index ? { ...item, [key]: value } : item
        ),
      }));
    } else if (section === "packet") {
      setPacketFilters((prev) => ({
        ...prev,
        [field]: prev[field].map((item, i) =>
          i === index ? { ...item, [key]: value } : item
        ),
      }));
    }
  };

  const handleSearch = async () => {
    setLoading(true);

    // Recursive function to clean data at any level of nesting
    const cleanData = (data, isTopLevel = false) => {
      // Handle null/undefined
      if (data === null || data === undefined) return undefined;

      // Handle empty strings
      if (typeof data === "string")
        return data.trim() === "" ? undefined : data;

      // Handle arrays
      if (Array.isArray(data)) {
        // Clean each item in the array and remove empty ones
        const cleanedArray = data
          .map((item) => cleanData(item))
          .filter((item) => item !== undefined);

        // Return undefined for empty arrays
        return cleanedArray.length === 0 ? undefined : cleanedArray;
      }

      // Handle objects
      if (typeof data === "object") {
        // Clean each property in the object
        const cleanedObj = {};
        let hasProperties = false;

        for (const [key, value] of Object.entries(data)) {
          const cleanedValue = cleanData(value);
          if (cleanedValue !== undefined) {
            cleanedObj[key] = cleanedValue;
            hasProperties = true;
          }
        }

        // For top-level objects, return empty object if no properties
        // This ensures document, location, and packet are always present
        if (isTopLevel) {
          return cleanedObj; // Always return the object even if empty
        }

        // For nested objects, return undefined if empty
        return hasProperties ? cleanedObj : undefined;
      }

      // For numbers, booleans, etc. return as is
      return data;
    };

    // Process each section individually to ensure they're always included
    const cleanedDocument = cleanData(documentFilters);
    const cleanedLocation = cleanData(locationFilters);
    const cleanedPacket = cleanData(packetFilters);
    // Create and clean the payload
    const payload = {
      document: cleanedDocument || {},
      location: cleanedLocation || {},
      packet: cleanedPacket || {},
      generalQuery: generalQuery.trim() || undefined,
      size: 100,
    };

    console.log("Search payload:", payload);

    try {
      const response = await fetch("https://localhost:7194/api/search", {
        method: "POST",
        headers: {
          SystemId: "25",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("SEARCH DATA:", data);

      const hits = Array.isArray(data.hits) ? data.hits : [];
      setResults(hits);
      // setResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      alert("Search failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setDocumentFilters({
      content_id: "",
      fileRef: "",
      contentQuery: "",
      contentVersion: "",
      creationDateFrom: "",
      creationDateTo: "",
      lastModificationDateFrom: "",
      lastModificationDateTo: "",
      minFileSize: "",
      maxFileSize: "",
      extension: "",
      templates: [],
      hashtags: [],
      comments: [],
      primaryLocationId: "",
      secondaryLocationId: "",
      tertiaryLocationId: "",
      linkedTo: [],
      attributes: [],
      packetIds: [],
    });
    setLocationFilters({
      locationId: "",
      locationType: "",
      parentId: "",
      name: "",
      properties: [],
    });
    setPacketFilters({
      projectId: "",
      name: "",
      packetEntities: [],
    });
    setGeneralQuery("");
    setResults([]);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">🔍 Document Search</h1>
            <button
              className="btn btn-outline-secondary"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
      {/* Search Button */}
      <div className="d-grid  mb-2">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Searching...
            </>
          ) : (
            "🔍 Search Documents"
          )}
        </button>
      </div>
      <div className="row">
        {/* Search Filters */}
        <div className="col-lg-8">
          {/* Document Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Document Filters</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Content ID</label>
                  <input
                    className="form-control"
                    value={documentFilters.content_id}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        content_id: e.target.value,
                      }))
                    }
                  />
                </div>
                {/* <div className="col-md-6">
                  <label className="form-label">File Reference</label>
                  <input
                    className="form-control"
                    value={documentFilters.fileRef}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        fileRef: e.target.value,
                      }))
                    }
                  />
                </div> */}
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Content Query</label>
                  <input
                    className="form-control"
                    value={documentFilters.contentQuery}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        contentQuery: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Extension</label>
                  <input
                    className="form-control"
                    placeholder="e.g., pdf, docx"
                    value={documentFilters.extension}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        extension: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Date Ranges */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label">Created From</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={documentFilters.creationDateFrom}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        creationDateFrom: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Created To</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={documentFilters.creationDateTo}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        creationDateTo: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Modified From</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={documentFilters.lastModificationDateFrom}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        lastModificationDateFrom: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Modified To</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={documentFilters.lastModificationDateTo}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        lastModificationDateTo: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* File Size */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Min File Size (bytes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={documentFilters.minFileSize}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        minFileSize: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Max File Size (bytes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={documentFilters.maxFileSize}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        maxFileSize: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Templates and Hashtags */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Templates (comma-separated)
                  </label>
                  <input
                    className="form-control"
                    placeholder="template1, template2"
                    onBlur={(e) =>
                      updateListField("document", "templates", e.target.value)
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Hashtags (comma-separated)
                  </label>
                  <input
                    className="form-control"
                    placeholder="#tag1, #tag2"
                    onBlur={(e) =>
                      updateListField("document", "hashtags", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Location IDs */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label">Primary Location ID</label>
                  <input
                    className="form-control"
                    value={documentFilters.primaryLocationId}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        primaryLocationId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Secondary Location ID</label>
                  <input
                    className="form-control"
                    value={documentFilters.secondaryLocationId}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        secondaryLocationId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Tertiary Location ID</label>
                  <input
                    className="form-control"
                    value={documentFilters.tertiaryLocationId}
                    onChange={(e) =>
                      setDocumentFilters((prev) => ({
                        ...prev,
                        tertiaryLocationId: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Document Attributes */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Document Attributes</label>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      addItem("document", "attributes", {
                        attributeId: "",
                        name: "",
                        value: "",
                      })
                    }
                  >
                    + Add Attribute
                  </button>
                </div>
                {documentFilters.attributes.map((attr, i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Attribute ID"
                        value={attr.attributeId}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "attributes",
                            i,
                            "attributeId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Name"
                        value={attr.name}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "attributes",
                            i,
                            "name",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-4">
                      <input
                        className="form-control"
                        placeholder="Value"
                        value={attr.value}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "attributes",
                            i,
                            "value",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-2">
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => removeItem("document", "attributes", i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Comments</label>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      addItem("document", "comments", {
                        userId: "",
                        comment: "",
                      })
                    }
                  >
                    + Add Comment Filter
                  </button>
                </div>
                {documentFilters.comments.map((comment, i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-4">
                      <input
                        className="form-control"
                        placeholder="User ID"
                        value={comment.userId}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "comments",
                            i,
                            "userId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-6">
                      <input
                        className="form-control"
                        placeholder="Comment"
                        value={comment.comment}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "comments",
                            i,
                            "comment",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-2">
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => removeItem("document", "comments", i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Linked To */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Linked To</label>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      addItem("document", "linkedTo", {
                        terciaryId: "",
                        name: "",
                      })
                    }
                  >
                    + Add Link
                  </button>
                </div>
                {documentFilters.linkedTo.map((link, i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-5">
                      <input
                        className="form-control"
                        placeholder="Terciary ID"
                        value={link.terciaryId}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "linkedTo",
                            i,
                            "terciaryId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-5">
                      <input
                        className="form-control"
                        placeholder="Name"
                        value={link.name}
                        onChange={(e) =>
                          updateItem(
                            "document",
                            "linkedTo",
                            i,
                            "name",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-2">
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => removeItem("document", "linkedTo", i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Location Filters</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Location ID</label>
                  <input
                    className="form-control"
                    value={locationFilters.locationId}
                    onChange={(e) =>
                      setLocationFilters((prev) => ({
                        ...prev,
                        locationId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Location Type</label>
                  <input
                    className="form-control"
                    value={locationFilters.locationType}
                    onChange={(e) =>
                      setLocationFilters((prev) => ({
                        ...prev,
                        locationType: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Parent ID</label>
                  <input
                    className="form-control"
                    value={locationFilters.parentId}
                    onChange={(e) =>
                      setLocationFilters((prev) => ({
                        ...prev,
                        parentId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={locationFilters.name}
                    onChange={(e) =>
                      setLocationFilters((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Location Properties */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Location Properties</label>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      addItem("location", "properties", {
                        attributeId: "",
                        name: "",
                        value: "",
                      })
                    }
                  >
                    + Add Property
                  </button>
                </div>
                {locationFilters.properties.map((prop, i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Attribute ID"
                        value={prop.attributeId}
                        onChange={(e) =>
                          updateItem(
                            "location",
                            "properties",
                            i,
                            "attributeId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Name"
                        value={prop.name}
                        onChange={(e) =>
                          updateItem(
                            "location",
                            "properties",
                            i,
                            "name",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-4">
                      <input
                        className="form-control"
                        placeholder="Value"
                        value={prop.value}
                        onChange={(e) =>
                          updateItem(
                            "location",
                            "properties",
                            i,
                            "value",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-2">
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => removeItem("location", "properties", i)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Packet Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Packet Filters</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Project ID</label>
                  <input
                    className="form-control"
                    value={packetFilters.projectId}
                    onChange={(e) =>
                      setPacketFilters((prev) => ({
                        ...prev,
                        projectId: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={packetFilters.name}
                    onChange={(e) =>
                      setPacketFilters((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Packet Entities */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Packet Entities</label>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      addItem("packet", "packetEntities", {
                        attributeId: "",
                        name: "",
                        value: "",
                      })
                    }
                  >
                    + Add Entity
                  </button>
                </div>
                {packetFilters.packetEntities.map((entity, i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Attribute ID"
                        value={entity.attributeId}
                        onChange={(e) =>
                          updateItem(
                            "packet",
                            "packetEntities",
                            i,
                            "attributeId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Name"
                        value={entity.name}
                        onChange={(e) =>
                          updateItem(
                            "packet",
                            "packetEntities",
                            i,
                            "name",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-4">
                      <input
                        className="form-control"
                        placeholder="Value"
                        value={entity.value}
                        onChange={(e) =>
                          updateItem(
                            "packet",
                            "packetEntities",
                            i,
                            "value",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-2">
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() =>
                          removeItem("packet", "packetEntities", i)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-lg-4">
          <div className="card sticky-top">
            <div className="card-header">
              <h5 className="mb-0">Search Results ({results.length})</h5>
            </div>
            <div
              className="card-body"
              style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
              {results.length === 0 ? (
                <p className="text-muted">
                  No results found. Try adjusting your search filters.
                </p>
              ) : (
                results.map((doc, idx) => (
                  <div key={idx} className="border rounded p-3 mb-3">
                    <h6 className="text-primary">
                      {doc.content_id || doc._id || `Document ${idx + 1}`}
                    </h6>
                    <div className="small">
                      <pre
                        className="bg-light p-2 rounded"
                        style={{
                          fontSize: "0.75rem",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      >
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
