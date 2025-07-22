import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Transformer } from 'react-konva';
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
  const [drawingMode, setDrawingMode] = useState(null);
  const [tempLinePoints, setTempLinePoints] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [color, setColor] = useState('#ff0000'); // default color

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
    const prevShapes = undoStack.pop();
    setRedoStack(prev => [...prev, shapes]);
    setUndoStack([...undoStack]);
    setShapes(prevShapes);
    setSelectedId(null);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextShapes = redoStack.pop();
    setUndoStack(prev => [...prev, shapes]);
    setRedoStack([...redoStack]);
    setShapes(nextShapes);
    setSelectedId(null);
  };

  const addCircle = () => {
    pushToUndo();
    const newShape = {
      id: `temp-${shapes.length + 1}`,
      type: 'circle',
      x: Math.random() * 300 + 50,
      y: Math.random() * 300 + 50,
      radius: 40,
      fill: color,
      isNew: true,
    };
    setShapes([...shapes, newShape]);
  };

  const handleCanvasClick = (e) => {
    if (drawingMode === 'line') {
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      const newPoints = [...tempLinePoints, pointer.x, pointer.y];

      if (newPoints.length === 4) {
        pushToUndo();
        const newLine = {
          id: `temp-${shapes.length + 1}`,
          type: 'line',
          points: newPoints,
          stroke: color,
          strokeWidth: 3,
          isNew: true,
        };
        setShapes([...shapes, newLine]);
        setTempLinePoints([]);
        setDrawingMode(null);
      } else {
        setTempLinePoints(newPoints);
      }
    }
  };

  const changeColor = async (newColor) => {
    if (!selectedId) return;
    pushToUndo();
    const updated = shapes.map((shape) => {
      if (shape.id === selectedId) {
        if (shape.type === 'circle') return { ...shape, fill: newColor };
        if (shape.type === 'line') return { ...shape, stroke: newColor };
      }
      return shape;
    });
    setShapes(updated);

    if (typeof selectedId === 'number') {
      const shapeToUpdate = updated.find(s => s.id === selectedId);
      try {
        const properties = { ...shapeToUpdate };
        delete properties.id;
        delete properties.type;
        delete properties.isNew;
        await axios.patch(`/layers/${selectedId}/`, { properties });
      } catch (err) {
        console.error('Failed to update color', err);
      }
    }
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
        properties: shape.type === 'circle' ? {
          x: shape.x,
          y: shape.y,
          radius: shape.radius,
          fill: shape.fill,
        } : {
          points: shape.points,
          stroke: shape.stroke,
          strokeWidth: shape.strokeWidth,
        },
      };
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

  const updateShape = async (id, updates) => {
    pushToUndo();

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
    const { x, y } = e.target.position();
    updateShape(id, { x, y });
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

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
      <HexColorPicker
  color={color}
  onChange={setColor}
  style={{
    width: '200px',
    height: '200px',
    borderRadius: '8px',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
  }}
/>

        <div style={{ marginTop: 10 }}>
          <button onClick={addCircle}>Add Circle</button>
          <button onClick={() => setDrawingMode('line')}>Start Line</button>
          <button onClick={() => changeColor(color)} disabled={!selectedId}>Apply Color to Selected</button>
          <button onClick={saveNewLayers}>Save New Layers</button>
          <button onClick={undo} disabled={undoStack.length === 0}>Undo</button>
          <button onClick={redo} disabled={redoStack.length === 0}>Redo</button>
        </div>
      </div>

      <Stage
        width={800}
        height={600}
        ref={stageRef}
        onMouseDown={handleCanvasClick}
        style={{ border: '1px solid #ccc' }}
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
                  draggable
                  rotation={shape.rotation || 0}
                  onClick={() => setSelectedId(shape.id)}
                  onTap={() => setSelectedId(shape.id)}
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
                  draggable
                  rotation={shape.rotation || 0}
                  onClick={() => setSelectedId(shape.id)}
                  onTap={() => setSelectedId(shape.id)}
                  onDragEnd={e => handleDragEnd(e, shape.id)}
                  onTransformEnd={e => handleTransformEnd(e, shape.id)}
                />
              );
            }
            return null;
          })}
        </Layer>

        <Layer>
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasEditor;