import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import axios from "./api";
import ProjectListSidebar from "./components/ProjectListSidebar";
import ProjectEditorPage from "./components/ProjectEditorPage";
import UploadProject from "./components/UploadProject";

const UploadProjectPage = ({ onUploadSuccess }) => {
  const navigate = useNavigate();
  const handleSuccess = (project) => {
    if (onUploadSuccess) {
      onUploadSuccess(project, navigate);
    } else {
      navigate(`/projects/${project.id}`);
    }
  };
  return <UploadProject onUploadSuccess={handleSuccess} />;
};

const AppLayout = () => {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects/");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, padding: 20 }}>
        {/* <h2>Photoshop Clone</h2> */}
        <Routes>
          <Route
            path="/"
            element={<p>Select a project or create a new one.</p>}
          />
          <Route path="/projects/:id" element={<ProjectEditorPage />} />
          <Route
            path="/upload"
            element={
              <UploadProjectPage
                onUploadSuccess={async (project, navigate) => {
                  await fetchProjects();
                  navigate(`/projects/${project.id}`);
                }}
              />
            }
          />
        </Routes>
      </div>
      <ProjectListSidebar projects={projects} />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
