// import React, { useState, useEffect } from 'react';
// import CanvasEditor from './components/CanvasEditor';
// import UploadProject from './components/UploadProject';
// import axios from './api';

// function App() {
//   const [projects, setProjects] = useState([]);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [showUploadForm, setShowUploadForm] = useState(false);

//   const fetchProjects = async () => {
//     try {
//       const res = await axios.get('/projects/');
//       setProjects(res.data);
//     } catch (err) {
//       console.error('Failed to fetch projects', err);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const handleUploadSuccess = (project) => {
//     setShowUploadForm(false);
//     setSelectedProject(project);
//     fetchProjects();
//   };

//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//       {/* Left Sidebar */}

//       <div style={{ width: 250, padding: 10, borderRight: '1px solid #ccc' }}>
//         <h3>Projects</h3>
//         <button onClick={() => setShowUploadForm(true)} style={{ marginBottom: 10 }}>Add New Project</button>
//         <div style={{ overflowY: 'auto', height: '80%' }}>
//           {projects.map(p => (
//             <div
//               key={p.id}
//               onClick={() => {
//                 setSelectedProject(p);
//                 setShowUploadForm(false);
//               }}
//               style={{
//                 padding: '5px 10px',
//                 cursor: 'pointer',
//                 backgroundColor: selectedProject?.id === p.id ? '#f0f0f0' : 'transparent',
//               }}
//             >
//               {p.title}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Area */}
//       <div style={{ flex: 1, padding: 20 }}>
//         <h2>Photoshop</h2>
//         {showUploadForm ? (
//           <UploadProject onUploadSuccess={handleUploadSuccess} />
//         ) : selectedProject ? (
//           <CanvasEditor project={selectedProject} />
//         ) : (
//           <p>Select a project or create a new one.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;



// ____________________________________________________________________________


import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import CanvasEditor from './components/CanvasEditor';
import UploadProject from './components/UploadProject';
import axios from './api';

const ProjectListSidebar = ({ projects, onSelectProject, selectedId }) => {
  const navigate = useNavigate();

  return (
    <div style={{ width: 250, padding: 10, borderRight: '1px solid #ccc' }}>
      <h3>Projects</h3>
      <button onClick={() => navigate('/upload')} style={{ marginBottom: 10 }}>
        Add New Project
      </button>
      <div style={{ overflowY: 'auto', height: '80%' }}>
        {projects.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            style={{
              padding: '5px 10px',
              cursor: 'pointer',
              backgroundColor: selectedId === p.id ? '#f0f0f0' : 'transparent',
            }}
          >
            {p.title}
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectEditorPage = ({ projects }) => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`/projects/${id}/`);
        setProject(res.data);
      } catch (err) {
        console.error('Failed to fetch selected project', err);
      }
    };

    if (id) fetchProject();
  }, [id]);

  return project ? <CanvasEditor project={project} /> : <p>Loading project...</p>;
};

const UploadProjectPage = ({ onUploadSuccess }) => {
  const navigate = useNavigate();

  const handleSuccess = (project) => {
    onUploadSuccess(project);
    navigate(`/projects/${project.id}`);
  };

  return <UploadProject onUploadSuccess={handleSuccess} />;
};

const AppLayout = () => {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const selectedId = window.location.pathname.includes('/projects/')
    ? parseInt(window.location.pathname.split('/projects/')[1])
    : null;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ProjectListSidebar
        projects={projects}
        selectedId={selectedId}
      />

      <div style={{ flex: 1, padding: 20 }}>
        <h2>Photoshop</h2>
        <Routes>
          <Route path="/" element={<p>Select a project or create a new one.</p>} />
          <Route path="/projects/:id" element={<ProjectEditorPage projects={projects} />} />
          <Route path="/upload" element={<UploadProjectPage onUploadSuccess={() => {}} />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
