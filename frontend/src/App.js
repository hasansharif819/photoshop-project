
import React, { useState } from 'react';
import UploadProject from './components/UploadProject';
import CanvasEditor from './components/CanvasEditor';

function App() {
  const [project, setProject] = useState(null);

  return (
    <div className="App" style={{ padding: 20 }}>
      <h2>Photoshop Clone</h2>
      {!project ? (
        <UploadProject onUploadSuccess={setProject} />
      ) : (
        <CanvasEditor project={project} />
      )}
    </div>
  );
}

export default App;
