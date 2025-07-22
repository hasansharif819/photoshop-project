import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Transformer, Path } from 'react-konva';
import useImage from 'use-image';
import axios from '../api';
import { HexColorPicker } from 'react-colorful';

const CanvasEditor = ({ project }) => {
  const stageRef = useRef();
  const transformerRef = useRef();
  const [imageURL, setImageURL] = useState(null);
  const [bgImage] = useImage(imageURL);
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('select');
  const [tempPoints, setTempPoints] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushPath, setBrushPath] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(`/projects/${project.id}/`);
      const imageFile = res.data.image.image_file;
      setImageURL(`${imageFile}`);

      const layers = res.data.image.layers;
      const parsedShapes = layers.map(layer => ({
        id: layer.id,
        type: layer.shape_type,
        ...layer.properties,
        isNew: false,
        stroke: layer.properties.stroke || layer.properties.fill || '#ff0000' // Ensure stroke has a value
      }));
      setShapes(parsedShapes);
    } catch (error) {
      console.error("Failed to fetch project data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [project]);

  const pushToUndo = () => {
    setUndoStack(prev => [...prev, shapes.map(s => ({ ...s }))]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prevShapes = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, shapes]);
    setUndoStack(prev => prev.slice(0, -1));
    setShapes(prevShapes);
    setSelectedId(null);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextShapes = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, shapes]);
    setRedoStack(prev => prev.slice(0, -1));
    setShapes(nextShapes);
    setSelectedId(null);
  };

  const handleMouseDown = (e) => {
    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();
    
    if (mode === 'polygon') {
      setTempPoints([...tempPoints, pointer.x, pointer.y]);
    } else if (mode === 'brush') {
      setIsDrawing(true);
      setBrushPath(`M${pointer.x},${pointer.y}`);
    } else if (mode === 'circle') {
      pushToUndo();
      const newCircle = {
        id: `temp-${shapes.length + 1}`,
        type: 'circle',
        x: pointer.x,
        y: pointer.y,
        radius: 30,
        fill: color,
        stroke: color, // Add stroke for border
        strokeWidth: 2,
        isNew: true,
      };
      setShapes([...shapes, newCircle]);
      setSelectedId(newCircle.id);
    } else if (mode === 'line') {
      pushToUndo();
      const newLine = {
        id: `temp-${shapes.length + 1}`,
        type: 'line',
        points: [pointer.x, pointer.y, pointer.x, pointer.y],
        stroke: color,
        strokeWidth: brushSize,
        isNew: true,
      };
      setShapes([...shapes, newLine]);
      setSelectedId(newLine.id);
    }
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();
    
    if (mode === 'brush' && isDrawing) {
      setBrushPath(prev => `${prev} L${pointer.x},${pointer.y}`);
    } else if (mode === 'line' && selectedId) {
      const line = shapes.find(s => s.id === selectedId);
      if (line) {
        const newPoints = [...line.points];
        newPoints[2] = pointer.x;
        newPoints[3] = pointer.y;
        updateShape(selectedId, { points: newPoints });
      }
    }
  };

  const handleMouseUp = (e) => {
    if (mode === 'brush' && isDrawing) {
      if (brushPath) {
        pushToUndo();
        const newShape = {
          id: `temp-${shapes.length + 1}`,
          type: 'path',
          data: brushPath,
          stroke: color,
          strokeWidth: brushSize,
          isNew: true,
        };
        setShapes([...shapes, newShape]);
        setBrushPath('');
      }
      setIsDrawing(false);
    } else if (mode === 'line') {
      setSelectedId(null);
    }
  };

  const completePolygon = () => {
    if (tempPoints.length >= 6) {
      finalizePolygon();
    }
  };

  const finalizePolygon = () => {
    if (tempPoints.length < 6) return;

    pushToUndo();
    
    const newPolygon = {
      id: `temp-${shapes.length + 1}`,
      type: 'polygon',
      points: [...tempPoints],
      stroke: color,
      strokeWidth: 2,
      fill: color,
      isNew: true,
    };

    setShapes([...shapes, newPolygon]);
    setTempPoints([]);
    setSelectedId(newPolygon.id);
    setMode('select');
  };

  const cancelPolygon = () => {
    setTempPoints([]);
  };

  const updateShape = async (id, updates) => {
    setShapes(prevShapes =>
      prevShapes.map(shape =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    );

    if (typeof id === 'number') {
      try {
        const shapeToUpdate = shapes.find(s => s.id === id);
        if (!shapeToUpdate) return;

        let properties = { ...shapeToUpdate, ...updates };
        delete properties.id;
        delete properties.type;
        delete properties.isNew;

        await axios.patch(`/layers/${id}/`, { properties });
      } catch (err) {
        console.error('Failed to update layer:', err);
      }
    }
  };

  const handleDragEnd = (e, id) => {
    const node = e.target;
    const updates = {
      x: node.x(),
      y: node.y(),
    };
    
    if (node.className === 'Line' && node.points()) {
      updates.points = node.points().map((p, i) => {
        return i % 2 === 0 ? p + node.x() : p + node.y();
      });
      updates.x = 0;
      updates.y = 0;
    }

    updateShape(id, updates);
  };

  const handleTransformEnd = (e, id) => {
    const node = e.target;
    let updates = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    if (node.className === 'Circle') {
      updates.radius = node.radius() * node.scaleX();
    } else if (node.className === 'Line') {
      const oldPoints = node.points();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      updates.points = oldPoints.map((p, i) =>
        i % 2 === 0 ? p * scaleX : p * scaleY
      );
    }
    node.scaleX(1);
    node.scaleY(1);

    updateShape(id, updates);
  };

  const changeSelectedColor = () => {
    if (!selectedId) return;
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    
    const updates = {};
    
    // Always update stroke for border color
    updates.stroke = color;
    
    // Update fill for shapes that have it
    if (shape.type !== 'line' && shape.type !== 'path') {
      updates.fill = color;
    }
    
    updateShape(selectedId, updates);
  };

  const saveNewLayers = async () => {
    const imageId = project.image.id;
    const newLayers = shapes.filter(s => s.isNew);

    for (let i = 0; i < newLayers.length; i++) {
      const shape = newLayers[i];
      const payload = {
        image: imageId,
        layer_id: i + 1,
        shape_type: shape.type,
        properties: {
          ...shape,
          stroke: shape.stroke || color // Ensure stroke is always included
        }
      };

      // Remove unnecessary fields
      delete payload.properties.id;
      delete payload.properties.type;
      delete payload.properties.isNew;

      try {
        const res = await axios.post('/layers/', payload);
        setShapes(prev =>
          prev.map(s =>
            s.id === shape.id ? { ...res.data, isNew: false } : s
          )
        );
      } catch (err) {
        console.error('Save failed:', err);
      }
    }

    await fetchData();
    alert('New layers saved and refreshed!');
  };

  useEffect(() => {
    const stage = stageRef.current;
    const transformer = transformerRef.current;
    if (!selectedId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    const selectedNode = stage.findOne(`#${selectedId.toString()}`);
    if (selectedNode) {
      transformer.nodes([selectedNode]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, shapes]);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    toolbar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px',
      background: '#f0f0f0',
      borderRadius: '4px',
      alignItems: 'center'
    },
    button: {
      padding: '8px 12px',
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    },
    activeButton: {
      padding: '8px 12px',
      background: '#007bff',
      color: 'white',
      border: '1px solid #007bff',
      borderRadius: '4px',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    },
    sliderContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '150px'
    },
    slider: {
      width: '100px'
    },
    colorPickerContainer: {
      padding: '8px',
      background: '#f0f0f0',
      borderRadius: '4px'
    },
    colorPickerLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold'
    },
    polygonControls: {
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: '#f0f0f0',
      borderRadius: '4px',
      marginTop: '8px',
      position: 'absolute',
      top: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100
    },
    colorChangeButton: {
      padding: '8px 12px',
      background: '#6f42c1',
      color: 'white',
      border: '1px solid #6f42c1',
      borderRadius: '4px',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button 
          style={mode === 'select' ? styles.activeButton : styles.button}
          onClick={() => setMode('select')}
        >
          Select
        </button>
        <button 
          style={mode === 'brush' ? styles.activeButton : styles.button}
          onClick={() => setMode('brush')}
        >
          Brush
        </button>
        <button 
          style={mode === 'polygon' ? styles.activeButton : styles.button}
          onClick={() => {
            setMode('polygon');
            setTempPoints([]);
          }}
        >
          Polygon
        </button>
        <button 
          style={mode === 'circle' ? styles.activeButton : styles.button}
          onClick={() => setMode('circle')}
        >
          Circle
        </button>
        <button 
          style={mode === 'line' ? styles.activeButton : styles.button}
          onClick={() => setMode('line')}
        >
          Line
        </button>

        {mode === 'brush' && (
          <div style={styles.sliderContainer}>
            <label>Size:</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={styles.slider}
            />
            <span>{brushSize}</span>
          </div>
        )}

        <button style={styles.button} onClick={undo} disabled={undoStack.length === 0}>
          Undo
        </button>
        <button style={styles.button} onClick={redo} disabled={redoStack.length === 0}>
          Redo
        </button>
        <button 
          style={{ ...styles.button, background: '#28a745', color: 'white', borderColor: '#28a745' }}
          onClick={saveNewLayers}
        >
          Save
        </button>
        {selectedId && (
          <button 
            style={styles.colorChangeButton}
            onClick={changeSelectedColor}
          >
            Apply Color
          </button>
        )}
      </div>

      {mode === 'polygon' && tempPoints.length > 0 && (
        <div style={styles.polygonControls}>
          <button 
            style={styles.button}
            onClick={completePolygon}
            disabled={tempPoints.length < 6}
          >
            Complete Polygon
          </button>
          <button 
            style={{ ...styles.button, background: '#dc3545', color: 'white' }}
            onClick={cancelPolygon}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={styles.colorPickerContainer}>
        <label style={styles.colorPickerLabel}>Color Picker</label>
        <HexColorPicker
          color={color}
          onChange={setColor}
          style={{
            width: '100%',
            height: '150px',
            borderRadius: '8px',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>

      <Stage
        width={800}
        height={600}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ border: '1px solid #ccc', borderRadius: '8px' }}
      >
        <Layer>
          {bgImage && <KonvaImage image={bgImage} width={800} height={600} />}
        </Layer>

        <Layer>
          {shapes.map(shape => {
            if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  id={shape.id.toString()}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                  stroke={shape.stroke || shape.fill} // Fallback to fill if stroke not set
                  strokeWidth={shape.strokeWidth || 2}
                  draggable={mode === 'select'}
                  rotation={shape.rotation || 0}
                  onClick={() => mode === 'select' && setSelectedId(shape.id)}
                  onTap={() => mode === 'select' && setSelectedId(shape.id)}
                  onDragEnd={e => handleDragEnd(e, shape.id)}
                  onTransformEnd={e => handleTransformEnd(e, shape.id)}
                />
              );
            } else if (shape.type === 'line') {
              return (
                <Line
                  key={shape.id}
                  id={shape.id.toString()}
                  points={shape.points}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={mode === 'select'}
                  rotation={shape.rotation || 0}
                  onClick={() => mode === 'select' && setSelectedId(shape.id)}
                  onTap={() => mode === 'select' && setSelectedId(shape.id)}
                  onDragEnd={e => handleDragEnd(e, shape.id)}
                  onTransformEnd={e => handleTransformEnd(e, shape.id)}
                />
              );
            } else if (shape.type === 'polygon') {
              return (
                <Line
                  key={shape.id}
                  id={shape.id.toString()}
                  points={shape.points}
                  stroke={shape.stroke || shape.fill}
                  strokeWidth={shape.strokeWidth || 2}
                  fill={shape.fill}
                  closed={true}
                  draggable={mode === 'select'}
                  rotation={shape.rotation || 0}
                  onClick={() => mode === 'select' && setSelectedId(shape.id)}
                  onTap={() => mode === 'select' && setSelectedId(shape.id)}
                  onDragEnd={e => handleDragEnd(e, shape.id)}
                  onTransformEnd={e => handleTransformEnd(e, shape.id)}
                />
              );
            } else if (shape.type === 'path') {
              return (
                <Path
                  key={shape.id}
                  id={shape.id.toString()}
                  data={shape.data}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  draggable={mode === 'select'}
                  rotation={shape.rotation || 0}
                  onClick={() => mode === 'select' && setSelectedId(shape.id)}
                  onTap={() => mode === 'select' && setSelectedId(shape.id)}
                  onDragEnd={e => handleDragEnd(e, shape.id)}
                  onTransformEnd={e => handleTransformEnd(e, shape.id)}
                />
              );
            }
            return null;
          })}

          {/* Temporary polygon drawing */}
          {mode === 'polygon' && tempPoints.length > 0 && (
            <Line
              points={tempPoints}
              stroke={color}
              strokeWidth={2}
              closed={false}
            />
          )}

          {/* Temporary brush drawing */}
          {mode === 'brush' && isDrawing && (
            <Path
              data={brushPath}
              stroke={color}
              strokeWidth={brushSize}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>

        <Layer>
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            borderStroke="#0099ff"
            borderStrokeWidth={1}
            anchorStroke="#0099ff"
            anchorSize={8}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasEditor;