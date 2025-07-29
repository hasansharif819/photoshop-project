import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../api";
import Modal from "react-modal";
import {
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaImage,
  FaLayerGroup,
} from "react-icons/fa";
import { FiUpload } from "react-icons/fi";

Modal.setAppElement("#root");

const modalStyles = {
  content: {
    position: "absolute",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    width: "90%",
    maxWidth: "500px",
    border: "none",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
};

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
}) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    contentLabel="Delete Confirmation"
    style={modalStyles}
  >
    <div style={{ maxWidth: "400px" }}>
      <h2
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          marginBottom: "16px",
          color: "#1F2937",
        }}
      >
        Confirm Deletion
      </h2>
      <p style={{ color: "#4B5563", marginBottom: "24px" }}>
        Are you sure you want to delete this {itemType}?{" "}
        {itemName && (
          <span style={{ fontWeight: "600", color: "#1F2937" }}>
            "{itemName}"
          </span>
        )}{" "}
        will be permanently removed.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#374151",
            backgroundColor: "#F3F4F6",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#E5E7EB")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#F3F4F6")
          }
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            color: "white",
            backgroundColor: "#EF4444",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#DC2626")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#EF4444")
          }
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

const UploadImageModal = ({ projectId, isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");

  const navigate = useNavigate();
  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    projectId: null,
  });

  // Open upload image modal
  const openUploadModal = (projectId) => {
    console.log("projectId === >", projectId);
    setUploadModal({
      isOpen: true,
      projectId,
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image_file", selectedFile);
      formData.append("project", projectId);
      formData.append("title", title);

      const response = await axios.post(
        "/images/upload-to-project/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onClose();
      navigate(`/projects/${response?.data?.id}`);
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Upload Image Modal"
      style={modalStyles}
    >
      <div style={{ maxWidth: "400px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "16px",
            color: "#1F2937",
          }}
        >
          Upload New Image
        </h2>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "4px",
            }}
          >
            Title
          </label>
          <input
            type="text"
            placeholder="Image Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "4px",
            }}
          >
            Image File
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "128px",
                border: "2px dashed #D1D5DB",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background-color 0.2s",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#F9FAFB")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "white")
              }
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiUpload
                  style={{ width: "32px", height: "32px", color: "#9CA3AF" }}
                />
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6B7280",
                    marginTop: "8px",
                  }}
                >
                  {selectedFile ? selectedFile.name : "Click to upload"}
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ opacity: 0, position: "absolute" }}
              />
            </label>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "#EF4444",
              fontSize: "14px",
              backgroundColor: "#FEE2E2",
              padding: "8px 12px",
              borderRadius: "6px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              backgroundColor: "#F3F4F6",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#E5E7EB")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#F3F4F6")
            }
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              color: "white",
              backgroundColor: "#3B82F6",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
              opacity: isUploading || !selectedFile ? 0.5 : 1,
            }}
            onMouseOver={(e) =>
              !isUploading &&
              selectedFile &&
              (e.currentTarget.style.backgroundColor = "#2563EB")
            }
            onMouseOut={(e) =>
              !isUploading &&
              selectedFile &&
              (e.currentTarget.style.backgroundColor = "#3B82F6")
            }
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <span style={{ display: "flex", alignItems: "center" }}>
                <svg
                  style={{
                    animation: "spin 1s linear infinite",
                    marginRight: "8px",
                    width: "16px",
                    height: "16px",
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    style={{ opacity: 0.75 }}
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};


const ProjectListSidebar = ({ projects, onProjectUpdate }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [expandedProjects, setExpandedProjects] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,
    id: null,
    name: null,
    projectId: null,
    imageId: null,
  });
  const [uploadModal, setUploadModal] = useState({
    isOpen: false,
    projectId: null,
  });

  const selectedId = pathname.startsWith("/projects/")
    ? parseInt(pathname.split("/projects/")[1])
    : null;

  const toggleProject = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const openDeleteModal = (type, id, name, projectId = null, imageId = null) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      name,
      projectId,
      imageId,
    });
  };

  const handleDelete = async () => {
    try {
      let endpoint = "";
      if (deleteModal.type === "project") {
        endpoint = `/projects/${deleteModal.id}/`;
      } else if (deleteModal.type === "image") {
        endpoint = `/images/${deleteModal.id}/`;
      } else if (deleteModal.type === "layer") {
        endpoint = `/layers/${deleteModal.id}/`;
      }

      await axios.delete(endpoint);
      onProjectUpdate();

      if (deleteModal.type === "project" && selectedId === deleteModal.id) {
        navigate("/");
      } else if (
        deleteModal.type === "image" &&
        selectedId === deleteModal.id
      ) {
        navigate(`/projects/${deleteModal.projectId}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null, name: null });
    }
  };

  const openUploadModal = (projectId) => {
    setUploadModal({ isOpen: true, projectId });
  };

  const handleImageUploadSuccess = (newImage) => {
    onProjectUpdate();
    setUploadModal({ isOpen: false, projectId: null });
    navigate(`/projects/${newImage.id}`);
  };

  const selectedImage = projects
    .flatMap((project) => project.images.map((image) => ({ ...image, projectId: project.id })))
    .find((image) => image.id === selectedId);

  return (
    <div
      style={{
        width: "288px",
        padding: "16px",
        borderLeft: "1px solid #E5E7EB",
        backgroundColor: "white",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "1px 0 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1F2937" }}>
          Projects
        </h3>
        <button
          onClick={() => navigate("/upload")}
          style={{
            padding: "8px 12px",
            background: "linear-gradient(to right, #3B82F6, #2563EB)",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(to right, #2563EB, #1D4ED8)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(to right, #3B82F6, #2563EB)";
          }}
        >
          <FaPlus style={{ fontSize: "12px" }} />
          <span>New Project</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
        {projects.map((project) => (
          <div key={project.id} style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor:
                  selectedId === project.id ? "#EFF6FF" : "#F9FAFB",
                border:
                  selectedId === project.id ? "1px solid #DBEAFE" : "none",
              }}
              onMouseOver={(e) => {
                if (selectedId !== project.id) {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                }
              }}
              onMouseOut={(e) => {
                if (selectedId !== project.id) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB";
                }
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", flex: 1 }}
                onClick={() => toggleProject(project.id)}
              >
                {expandedProjects[project.id] ? (
                  <FaChevronDown style={{ marginRight: "8px", color: "#6B7280", fontSize: "12px" }} />
                ) : (
                  <FaChevronRight style={{ marginRight: "8px", color: "#6B7280", fontSize: "12px" }} />
                )}
                <span
                  title={project.title}
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: selectedId === project.id ? "600" : "normal",
                    color: selectedId === project.id ? "#2563EB" : "#1F2937",
                  }}
                >
                  {project.title}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal("project", project.id, project.title);
                }}
                style={{
                  color: "#9CA3AF",
                  marginLeft: "8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#EF4444")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#9CA3AF")}
              >
                <FaTrash size={14} />
              </button>
            </div>

            {expandedProjects[project.id] && (
              <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                {project.images.map((image) => (
                  <div key={image.id} style={{ marginBottom: "4px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        backgroundColor:
                          selectedId === image.id ? "#EFF6FF" : "#F3F4F6",
                      }}
                      onMouseOver={(e) => {
                        if (selectedId !== image.id) {
                          e.currentTarget.style.backgroundColor = "#E5E7EB";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedId !== image.id) {
                          e.currentTarget.style.backgroundColor = "#F3F4F6";
                        }
                      }}
                      onClick={() => navigate(`/projects/${image.id}`)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <FaImage style={{ marginRight: "8px", color: "#6B7280", fontSize: "10px" }} />
                        <span
                          title={image.title}
                          style={{
                            maxWidth: "150px",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: selectedId === image.id ? "600" : "normal",
                            color: selectedId === image.id ? "#2563EB" : "#1F2937",
                          }}
                        >
                          {image.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal("image", image.id, image.name, project.id);
                        }}
                        style={{
                          color: "#9CA3AF",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#EF4444")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Image Button - NEW CODE */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor: "#F3F4F6",
                    marginTop: "8px",
                    border: "1px dashed #D1D5DB",
                    transition: "all 0.2s",
                  }}
                  onClick={() => openUploadModal(project.id)}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#E5E7EB")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#F3F4F6")}
                >
                  <FaPlus
                    style={{
                      marginRight: "8px",
                      color: "#6B7280",
                      fontSize: "10px"
                    }}
                  />
                  <span
                    style={{
                      color: "#4B5563",
                      fontSize: "13px",
                      fontWeight: "500"
                    }}
                  >
                    Add New Image
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 🔽 LAYER PANEL */}
      {selectedImage && (
        <div
          style={{
            borderTop: "1px solid #E5E7EB",
            paddingTop: "12px",
            marginTop: "16px",
            maxHeight: "30%",
            overflowY: "auto",
          }}
        >
          <h4 style={{ fontSize: "16px", fontWeight: "bold", color: "#374151", marginBottom: "8px" }}>
            Layers Panel
          </h4>
          {selectedImage.layers?.length > 0 ? (
            selectedImage.layers.map((layer) => (
              <div
                key={layer.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#F9FAFB",
                  marginBottom: "4px",
                  fontSize: "14px",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {layer.name}{" "}
                  <span style={{ color: "#6B7280", fontStyle: "italic", fontSize: "12px" }}>
                    ({layer.shape_type})
                  </span>
                </span>
                <button
                  onClick={() => openDeleteModal("layer", layer.id, layer.name, selectedImage.projectId, selectedImage.id)}
                  style={{
                    color: "#9CA3AF",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                >
                  <FaTrash size={10} />
                </button>
              </div>
            ))
          ) : (
            <p style={{ fontSize: "13px", color: "#9CA3AF" }}>No layers found.</p>
          )}
        </div>
      )}


      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: null, id: null, name: null })
        }
        onConfirm={handleDelete}
        itemType={deleteModal.type}
        itemName={deleteModal.name}
      />

      {/* Upload Image Modal */}
      <UploadImageModal
        projectId={uploadModal.projectId}
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false, projectId: null })}
        onSuccess={handleImageUploadSuccess}
      />
    </div>
  );
};

export default ProjectListSidebar;


// const ProjectListSidebar = ({ projects, onProjectUpdate }) => {
//   const navigate = useNavigate();
//   const { pathname } = useLocation();

//   // State for expanded projects, delete modals, and upload modal
//   const [expandedProjects, setExpandedProjects] = useState({});
//   const [deleteModal, setDeleteModal] = useState({
//     isOpen: false,
//     type: null,
//     id: null,
//     name: null,
//     projectId: null,
//     imageId: null,
//   });
//   const [uploadModal, setUploadModal] = useState({
//     isOpen: false,
//     projectId: null,
//   });

//   // Extract selected ID from URL
//   const selectedId = pathname.startsWith("/projects/")
//     ? parseInt(pathname.split("/projects/")[1])
//     : null;

//   // Toggle project expansion
//   const toggleProject = (projectId) => {
//     setExpandedProjects((prev) => ({
//       ...prev,
//       [projectId]: !prev[projectId],
//     }));
//   };

//   // Open delete confirmation modal
//   const openDeleteModal = (
//     type,
//     id,
//     name,
//     projectId = null,
//     imageId = null
//   ) => {
//     setDeleteModal({
//       isOpen: true,
//       type,
//       id,
//       name,
//       projectId,
//       imageId,
//     });
//   };

//   // Handle delete confirmation
//   const handleDelete = async () => {
//     try {
//       let endpoint = "";
//       if (deleteModal.type === "project") {
//         endpoint = `/projects/${deleteModal.id}/`;
//       } else if (deleteModal.type === "image") {
//         endpoint = `/images/${deleteModal.id}/`;
//       } else if (deleteModal.type === "layer") {
//         endpoint = `/layers/${deleteModal.id}/`;
//       }

//       await axios.delete(endpoint);
//       onProjectUpdate(); // Refresh the project list

//       // If we're deleting the currently selected project/image, navigate away
//       if (deleteModal.type === "project" && selectedId === deleteModal.id) {
//         navigate("/");
//       } else if (
//         deleteModal.type === "image" &&
//         selectedId === deleteModal.id
//       ) {
//         navigate(`/projects/${deleteModal.projectId}`);
//       }
//     } catch (err) {
//       console.error("Delete failed:", err);
//     } finally {
//       setDeleteModal({ isOpen: false, type: null, id: null, name: null });
//     }
//   };

//   // Open upload image modal
//   const openUploadModal = (projectId) => {
//     setUploadModal({
//       isOpen: true,
//       projectId,
//     });
//   };

//   // Handle successful image upload
//   const handleImageUploadSuccess = (newImage) => {
//     onProjectUpdate(); // Refresh the project list
//     setUploadModal({ isOpen: false, projectId: null });
//     navigate(`/projects/${newImage.id}`); // Navigate to the new image
//   };

//   return (
//     <div
//       style={{
//         width: "288px",
//         padding: "16px",
//         borderLeft: "1px solid #E5E7EB",
//         backgroundColor: "white",
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//         boxShadow: "1px 0 3px rgba(0, 0, 0, 0.05)",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: "16px",
//           paddingBottom: "16px",
//           borderBottom: "1px solid #F3F4F6",
//         }}
//       >
//         <h3
//           style={{
//             fontSize: "18px",
//             fontWeight: "bold",
//             color: "#1F2937",
//           }}
//         >
//           Projects
//         </h3>
//         <button
//           onClick={() => navigate("/upload")}
//           style={{
//             padding: "8px 12px",
//             background: "linear-gradient(to right, #3B82F6, #2563EB)",
//             color: "white",
//             borderRadius: "8px",
//             border: "none",
//             cursor: "pointer",
//             display: "flex",
//             alignItems: "center",
//             gap: "4px",
//             fontSize: "14px",
//             boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
//             transition: "all 0.2s",
//           }}
//           onMouseOver={(e) => {
//             e.currentTarget.style.background =
//               "linear-gradient(to right, #2563EB, #1D4ED8)";
//             e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
//           }}
//           onMouseOut={(e) => {
//             e.currentTarget.style.background =
//               "linear-gradient(to right, #3B82F6, #2563EB)";
//             e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
//           }}
//         >
//           <FaPlus style={{ fontSize: "12px" }} />
//           <span>New Project</span>
//         </button>
//       </div>

//       <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
//         {projects.map((project) => (
//           <div key={project.id} style={{ marginBottom: "8px" }}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "12px",
//                 borderRadius: "8px",
//                 cursor: "pointer",
//                 transition: "background-color 0.2s",
//                 backgroundColor:
//                   selectedId === project.id ? "#EFF6FF" : "#F9FAFB",
//                 border:
//                   selectedId === project.id ? "1px solid #DBEAFE" : "none",
//               }}
//               onMouseOver={(e) => {
//                 if (selectedId !== project.id) {
//                   e.currentTarget.style.backgroundColor = "#F3F4F6";
//                 }
//               }}
//               onMouseOut={(e) => {
//                 if (selectedId !== project.id) {
//                   e.currentTarget.style.backgroundColor = "#F9FAFB";
//                 }
//               }}
//             >
//               <div
//                 style={{ display: "flex", alignItems: "center", flex: 1 }}
//                 onClick={() => toggleProject(project.id)}
//               >
//                 {expandedProjects[project.id] ? (
//                   <FaChevronDown
//                     style={{
//                       marginRight: "8px",
//                       color: "#6B7280",
//                       fontSize: "12px",
//                     }}
//                   />
//                 ) : (
//                   <FaChevronRight
//                     style={{
//                       marginRight: "8px",
//                       color: "#6B7280",
//                       fontSize: "12px",
//                     }}
//                   />
//                 )}
//                 <span
//                   style={{
//                     flex: 1,
//                     overflow: "hidden",
//                     textOverflow: "ellipsis",
//                     whiteSpace: "nowrap",
//                     fontWeight: selectedId === project.id ? "600" : "normal",
//                     color: selectedId === project.id ? "#2563EB" : "#1F2937",
//                   }}
//                 >
//                   {project.title}
//                 </span>
//               </div>
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   openDeleteModal("project", project.id, project.title);
//                 }}
//                 style={{
//                   color: "#9CA3AF",
//                   marginLeft: "8px",
//                   background: "none",
//                   border: "none",
//                   cursor: "pointer",
//                   transition: "color 0.2s",
//                 }}
//                 onMouseOver={(e) => (e.currentTarget.style.color = "#EF4444")}
//                 onMouseOut={(e) => (e.currentTarget.style.color = "#9CA3AF")}
//                 title="Delete Project"
//               >
//                 <FaTrash size={14} />
//               </button>
//             </div>

//             {expandedProjects[project.id] && (
//               <div style={{ marginLeft: "24px", marginTop: "4px" }}>
//                 {project.images.length > 0 ? (
//                   project.images.map((image) => (
//                     <div key={image.id} style={{ marginBottom: "4px" }}>
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "space-between",
//                           padding: "8px 12px",
//                           borderRadius: "6px",
//                           cursor: "pointer",
//                           transition: "background-color 0.2s",
//                           backgroundColor:
//                             selectedId === image.id ? "#EFF6FF" : "#F3F4F6",
//                         }}
//                         onMouseOver={(e) => {
//                           if (selectedId !== image.id) {
//                             e.currentTarget.style.backgroundColor = "#E5E7EB";
//                           }
//                         }}
//                         onMouseOut={(e) => {
//                           if (selectedId !== image.id) {
//                             e.currentTarget.style.backgroundColor = "#F3F4F6";
//                           }
//                         }}
//                         onClick={() => navigate(`/projects/${image.id}`)}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             alignItems: "center",
//                             flex: 1,
//                           }}
//                         >
//                           <FaImage
//                             style={{
//                               marginRight: "8px",
//                               color: "#6B7280",
//                               fontSize: "10px",
//                             }}
//                           />
//                           <span
//                             style={{
//                               flex: 1,
//                               overflow: "hidden",
//                               textOverflow: "ellipsis",
//                               whiteSpace: "nowrap",
//                               fontSize: "14px",
//                               fontWeight:
//                                 selectedId === image.id ? "500" : "normal",
//                               color:
//                                 selectedId === image.id ? "#2563EB" : "#374151",
//                             }}
//                           >
//                             {image.title}
//                           </span>
//                         </div>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             openDeleteModal(
//                               "image",
//                               image.id,
//                               image.title,
//                               project.id
//                             );
//                           }}
//                           style={{
//                             color: "#9CA3AF",
//                             marginLeft: "8px",
//                             background: "none",
//                             border: "none",
//                             cursor: "pointer",
//                             transition: "color 0.2s",
//                           }}
//                           onMouseOver={(e) =>
//                             (e.currentTarget.style.color = "#EF4444")
//                           }
//                           onMouseOut={(e) =>
//                             (e.currentTarget.style.color = "#9CA3AF")
//                           }
//                           title="Delete Image"
//                         >
//                           <FaTrash size={12} />
//                         </button>
//                       </div>

//                       {selectedId === image.id && image?.layers?.length > 0 && (
//                         <div style={{ marginLeft: "16px", marginTop: "4px" }}>
//                           <div
//                             style={{
//                               fontSize: "12px",
//                               fontWeight: "500",
//                               color: "#6B7280",
//                               marginBottom: "4px",
//                               paddingLeft: "8px",
//                             }}
//                           >
//                             Layers:
//                           </div>
//                           {image?.layers?.map((layer) => (
//                             <div
//                               key={layer.id}
//                               style={{
//                                 display: "flex",
//                                 alignItems: "center",
//                                 cursor: "pointer",
//                                 justifyContent: "space-between",
//                                 backgroundColor: "#F9FAFB",
//                                 padding: "4px 8px 4px 16px",
//                                 borderRadius: "4px",
//                                 fontSize: "12px",
//                                 marginBottom: "4px",
//                                 transition: "background-color 0.2s",
//                               }}
//                               onMouseOver={(e) =>
//                                 (e.currentTarget.style.backgroundColor =
//                                   "#F3F4F6")
//                               }
//                               onMouseOut={(e) =>
//                                 (e.currentTarget.style.backgroundColor =
//                                   "#F9FAFB")
//                               }
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 navigate(
//                                   `/projects/${image.id}?layer=${layer.id}`
//                                 );
//                               }}
//                             >
//                               <div
//                                 style={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                 }}
//                               >
//                                 <FaLayerGroup
//                                   style={{
//                                     marginRight: "8px",
//                                     color: "#9CA3AF",
//                                     fontSize: "10px",
//                                   }}
//                                 />
//                                 <span
//                                   style={{
//                                     color: "#4B5563",
//                                   }}
//                                 >
//                                   {layer?.shape_type}
//                                 </span>
//                               </div>
//                               <button
//                                 onClick={() =>
//                                   openDeleteModal(
//                                     "layer",
//                                     layer.id,
//                                     `Layer ${layer.id}`,
//                                     project.id,
//                                     image.id
//                                   )
//                                 }
//                                 style={{
//                                   color: "#9CA3AF",
//                                   marginLeft: "8px",
//                                   background: "none",
//                                   border: "none",
//                                   cursor: "pointer",
//                                   transition: "color 0.2s",
//                                 }}
//                                 onMouseOver={(e) =>
//                                   (e.currentTarget.style.color = "#EF4444")
//                                 }
//                                 onMouseOut={(e) =>
//                                   (e.currentTarget.style.color = "#9CA3AF")
//                                 }
//                                 title="Delete Layer"
//                               >
//                                 <FaTrash size={10} />
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <div
//                     style={{
//                       fontSize: "12px",
//                       color: "#6B7280",
//                       fontStyle: "italic",
//                       padding: "8px",
//                       backgroundColor: "#F9FAFB",
//                       borderRadius: "6px",
//                     }}
//                   >
//                     No images in this project
//                   </div>
//                 )}

//                 <button
//                   onClick={() => openUploadModal(project.id)}
//                   style={{
//                     marginTop: "8px",
//                     fontSize: "12px",
//                     display: "flex",
//                     alignItems: "center",
//                     color: "#3B82F6",
//                     backgroundColor: "#EFF6FF",
//                     padding: "4px 8px",
//                     borderRadius: "6px",
//                     border: "none",
//                     cursor: "pointer",
//                     transition: "all 0.2s",
//                     gap: "4px",
//                   }}
//                   onMouseOver={(e) => {
//                     e.currentTarget.style.color = "#2563EB";
//                     e.currentTarget.style.backgroundColor = "#DBEAFE";
//                   }}
//                   onMouseOut={(e) => {
//                     e.currentTarget.style.color = "#3B82F6";
//                     e.currentTarget.style.backgroundColor = "#EFF6FF";
//                   }}
//                 >
//                   <FaPlus size={10} />
//                   <span>Add New Image</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmationModal
//         isOpen={deleteModal.isOpen}
//         onClose={() =>
//           setDeleteModal({ isOpen: false, type: null, id: null, name: null })
//         }
//         onConfirm={handleDelete}
//         itemType={deleteModal.type}
//         itemName={deleteModal.name}
//       />

//       {/* Upload Image Modal */}
//       <UploadImageModal
//         projectId={uploadModal.projectId}
//         isOpen={uploadModal.isOpen}
//         onClose={() => setUploadModal({ isOpen: false, projectId: null })}
//         onSuccess={handleImageUploadSuccess}
//       />

//       <style>
//         {`
//           @keyframes spin {
//             from { transform: rotate(0deg); }
//             to { transform: rotate(360deg); }
//           }
//         `}
//       </style>
//     </div>
//   );
// };

// export default ProjectListSidebar;

