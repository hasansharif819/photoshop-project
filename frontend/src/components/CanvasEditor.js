import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Transformer, Path, Rect, Ellipse } from 'react-konva';
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
  const [selectedAnchorIndex, setSelectedAnchorIndex] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const shapeTypes = {
    SELECT: 'select',
    BRUSH: 'brush',
    POLYGON: 'polygon',
    CIRCLE: 'circle',
    LINE: 'line',
    RECTANGLE: 'rectangle',
    TRIANGLE: 'triangle',
    OVAL: 'oval',
    PATH: 'path',
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`/projects/${project.id}/`);
      const imageFile = res.data.image.image_file;
      setImageURL(`${imageFile}`);

      const layers = res.data.image.layers;
      const parsedShapes = layers.map((layer, index) => {
        const shape = {
          id: layer.id,
          type: layer.shape_type,
          ...layer.properties,
          isNew: false,
          stroke: layer.properties.stroke || layer.properties.fill || '#ff0000',
          strokeWidth: layer.properties.strokeWidth || 2,
          zIndex: index, // Assign zIndex based on order
        };

        // Convert old triangle format to points array if needed
        if (layer.shape_type === 'triangle' && !layer.properties.points) {
          shape.points = [
            layer.properties.x || 0,
            layer.properties.y || 0,
            (layer.properties.x || 0) - 30,
            (layer.properties.y || 0) + 50,
            (layer.properties.x || 0) + 30,
            (layer.properties.y || 0) + 50,
          ];
          shape.x = 0;
          shape.y = 0;
        }
        return shape;
      });
      setShapes(parsedShapes);
    } catch (error) {
      console.error('Failed to fetch project data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [project]);

  const pushToUndo = () => {
    setUndoStack((prev) => [...prev, shapes.map((s) => ({ ...s }))]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const prevShapes = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, shapes]);
    setUndoStack((prev) => prev.slice(0, -1));
    setShapes(prevShapes);
    setSelectedId(null);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextShapes = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, shapes]);
    setRedoStack((prev) => prev.slice(0, -1));
    setShapes(nextShapes);
    setSelectedId(null);
  };

  const handleMouseDown = (e) => {
    if (isCreating) return;
    setIsCreating(true);

    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();

    if (mode === shapeTypes.POLYGON) {
      setTempPoints([...tempPoints, pointer.x, pointer.y]);
    } else if (mode === shapeTypes.BRUSH) {
      setIsDrawing(true);
      setBrushPath(`M${pointer.x},${pointer.y}`);
    } else if (mode === shapeTypes.CIRCLE) {
      pushToUndo();
      const newCircle = {
        id: `temp-${Date.now()}`,
        type: shapeTypes.CIRCLE,
        x: pointer.x,
        y: pointer.y,
        radius: 30,
        fill: color,
        stroke: color,
        strokeWidth: 2,
        isNew: true,
        zIndex: shapes.length,
      };
      setShapes([...shapes, newCircle]);
      setSelectedId(newCircle.id);
    } else if (mode === shapeTypes.LINE) {
      pushToUndo();
      const newLine = {
        id: `temp-${Date.now()}`,
        type: shapeTypes.LINE,
        points: [pointer.x, pointer.y, pointer.x, pointer.y],
        stroke: color,
        strokeWidth: brushSize,
        isNew: true,
        zIndex: shapes.length,
      };
      setShapes([...shapes, newLine]);
      setSelectedId(newLine.id);
    } else if (mode === shapeTypes.RECTANGLE) {
      pushToUndo();
      const newRect = {
        id: `temp-${Date.now()}`,
        type: shapeTypes.RECTANGLE,
        x: pointer.x,
        y: pointer.y,
        width: 50,
        height: 50,
        fill: color,
        stroke: color,
        strokeWidth: 2,
        isNew: true,
        zIndex: shapes.length,
      };
      setShapes([...shapes, newRect]);
      setSelectedId(newRect.id);
    } else if (mode === shapeTypes.TRIANGLE) {
      pushToUndo();
      const newTriangle = {
        id: `temp-${Date.now()}`,
        type: shapeTypes.TRIANGLE,
        points: [pointer.x, pointer.y, pointer.x - 30, pointer.y + 50, pointer.x + 30, pointer.y + 50],
        fill: color,
        stroke: color,
        strokeWidth: 2,
        isNew: true,
        zIndex: shapes.length,
        x: 0,
        y: 0,
      };
      setShapes([...shapes, newTriangle]);
      setSelectedId(newTriangle.id);
    } else if (mode === shapeTypes.OVAL) {
      pushToUndo();
      const newOval = {
        id: `temp-${Date.now()}`,
        type: shapeTypes.OVAL,
        x: pointer.x,
        y: pointer.y,
        radiusX: 40,
        radiusY: 20,
        fill: color,
        stroke: color,
        strokeWidth: 2,
        isNew: true,
        zIndex: shapes.length,
      };
      setShapes([...shapes, newOval]);
      setSelectedId(newOval.id);
    } else if (mode === shapeTypes.SELECT && selectedId) {
      const tr = transformerRef.current;
      const shape = shapes.find((s) => s.id === selectedId);

      if (tr && tr.getNodes().length > 0 && shape) {
        const transformerNode = tr.getNodes()[0];
        if (transformerNode && transformerNode.getChildren) {
          const anchors = transformerNode.getChildren((node) =>
            node.getClassName && node.getClassName() === 'Anchor'
          );

          if (anchors) {
            const clickedAnchor = anchors.find((anchor) => {
              const anchorX = anchor.x();
              const anchorY = anchor.y();
              const distance = Math.sqrt(
                Math.pow(pointer.x - (shape.x + anchorX), 2) +
                Math.pow(pointer.y - (shape.y + anchorY), 2)
              );
              return distance < 10;
            });

            if (clickedAnchor) {
              const anchorIndex = anchors.indexOf(clickedAnchor);
              setSelectedAnchorIndex(anchorIndex);
            }
          }
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();

    if (mode === shapeTypes.BRUSH && isDrawing) {
      setBrushPath((prev) => `${prev} L${pointer.x},${pointer.y}`);
    } else if (mode === shapeTypes.LINE && selectedId) {
      const line = shapes.find((s) => s.id === selectedId);
      if (line) {
        const newPoints = [...line.points];
        newPoints[2] = pointer.x;
        newPoints[3] = pointer.y;
        updateShape(selectedId, { points: newPoints });
      }
    } else if (selectedAnchorIndex !== null && selectedId) {
      const shape = shapes.find((s) => s.id === selectedId);
      if (!shape) return;

      if (shape.type === shapeTypes.POLYGON || shape.type === shapeTypes.LINE || shape.type === shapeTypes.TRIANGLE) {
        const newPoints = [...shape.points];
        const pointIndex = selectedAnchorIndex * 2;

        if (pointIndex < newPoints.length) {
          newPoints[pointIndex] = pointer.x - (shape.x || 0);
          newPoints[pointIndex + 1] = pointer.y - (shape.y || 0);
          updateShape(selectedId, { points: newPoints });
        }
      }
    }
  };

  const handleMouseUp = (e) => {
    setIsCreating(false);

    if (mode === shapeTypes.BRUSH && isDrawing) {
      if (brushPath) {
        pushToUndo();
        const newShape = {
          id: `temp-${Date.now()}`,
          type: shapeTypes.PATH,
          data: brushPath,
          stroke: color,
          strokeWidth: brushSize,
          isNew: true,
          zIndex: shapes.length,
        };
        setShapes([...shapes, newShape]);
        setBrushPath('');
      }
      setIsDrawing(false);
    } else if (mode === shapeTypes.LINE) {
      setSelectedId(null);
    }
    setSelectedAnchorIndex(null);
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
      id: `temp-${Date.now()}`,
      type: shapeTypes.POLYGON,
      points: [...tempPoints],
      stroke: color,
      strokeWidth: 2,
      fill: color,
      isNew: true,
      zIndex: shapes.length,
    };

    setShapes([...shapes, newPolygon]);
    setTempPoints([]);
    setSelectedId(newPolygon.id);
    setMode(shapeTypes.SELECT);
  };

  const cancelPolygon = () => {
    setTempPoints([]);
  };

  const updateShape = async (id, updates) => {
    setShapes (prevShapes =>
      prevShapes.map(shape =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    );

    if (typeof id === 'number') {
      try {
        const shapeToUpdate = shapes.find((s) => s.id === id);
        if (!shapeToUpdate) return;

        let properties = { ...shapeToUpdate, ...updates };
        delete properties.id;
        delete properties.type;
        delete properties.isNew;
        delete properties.zIndex;

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
    } else if (node.className === 'Rect') {
      updates.width = node.width() * node.scaleX();
      updates.height = node.height() * node.scaleY();
    } else if (node.className === 'Ellipse') {
      updates.radiusX = node.radiusX() * node.scaleX();
      updates.radiusY = node.radiusY() * node.scaleY();
    } else if (node.className === 'Line') {
      const oldPoints = node.points();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      updates.points = oldPoints.map((p, i) => (i % 2 === 0 ? p * scaleX : p * scaleY));
    }
    node.scaleX(1);
    node.scaleY(1);

    updateShape(id, updates);
  };

  const changeSelectedColor = () => {
    if (!selectedId) return;
    const shape = shapes.find((s) => s.id === selectedId);
    if (!shape) return;

    const updates = { stroke: color };
    if (shape.type !== shapeTypes.LINE && shape.type !== shapeTypes.PATH) {
      updates.fill = color;
    }

    updateShape(selectedId, updates);
  };

  const saveNewLayers = async () => {
    const imageId = project.image.id;
    const newLayers = shapes.filter((s) => s.isNew);

    for (let i = 0; i < newLayers.length; i++) {
      const shape = newLayers[i];
      let properties = { ...shape };

      // Ensure triangle points are correctly formatted
      if (shape.type === shapeTypes.TRIANGLE) {
        properties.points = shape.points;
        properties.x = shape.x || 0;
        properties.y = shape.y || 0;
      }

      // Remove unnecessary fields
      delete properties.id;
      delete properties.type;
      delete properties.isNew;
      delete properties.zIndex;

      const payload = {
        image: imageId,
        layer_id: i + 1,
        shape_type: shape.type,
        properties,
      };

      try {
        const res = await axios.post('/layers/', payload);
        setShapes((prev) =>
          prev.map((s) =>
            s.id === shape.id ? { ...res.data, isNew: false, zIndex: shapes.length + i } : s
          )
        );
      } catch (err) {
        console.error('Save failed for shape:', shape, err);
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

  const renderShape = (shape) => {
    const commonProps = {
      key: shape.id,
      id: shape.id.toString(),
      draggable: mode === shapeTypes.SELECT,
      rotation: shape.rotation || 0,
      onClick: () => mode === shapeTypes.SELECT && setSelectedId(shape.id),
      onTap: () => mode === shapeTypes.SELECT && setSelectedId(shape.id),
      onDragEnd: (e) => handleDragEnd(e, shape.id),
      onTransformEnd: (e) => handleTransformEnd(e, shape.id),
      stroke: shape.stroke || shape.fill || color,
      strokeWidth: shape.strokeWidth || 2,
    };

    switch (shape.type) {
      case shapeTypes.CIRCLE:
        return <Circle {...commonProps} x={shape.x} y={shape.y} radius={shape.radius} fill={shape.fill} />;
      case shapeTypes.LINE:
        return <Line {...commonProps} points={shape.points} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />;
      case shapeTypes.POLYGON:
      case shapeTypes.TRIANGLE:
        return <Line {...commonProps} points={shape.points} fill={shape.fill} closed={true} x={shape.x || 0} y={shape.y || 0} />;
      case shapeTypes.PATH:
        return (
          <Path
            {...commonProps}
            data={shape.data}
            strokeWidth={shape.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        );
      case shapeTypes.RECTANGLE:
        return (
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
          />
        );
      case shapeTypes.OVAL:
        return (
          <Ellipse
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radiusX={shape.radiusX}
            radiusY={shape.radiusY}
            fill={shape.fill}
          />
        );
      default:
        return null;
    }
  };

  // Sort shapes by zIndex to ensure latest shapes are on top
  const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    toolbar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px',
      background: '#f0f0f0',
      borderRadius: '4px',
      alignItems: 'center',
    },
    button: {
      padding: '8px 12px',
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    activeButton: {
      padding: '8px 12px',
      background: '#007bff',
      color: 'white',
      border: '1px solid #007bff',
      borderRadius: '4px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
    sliderContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '150px',
    },
    slider: {
      width: '100px',
    },
    colorPickerContainer: {
      padding: '8px',
      background: '#f0f0f0',
      borderRadius: '4px',
    },
    colorPickerLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
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
      zIndex: 100,
    },
    colorChangeButton: {
      padding: '8px 12px',
      background: '#6f42c1',
      color: 'white',
      border: '1px solid #6f42c1',
      borderRadius: '4px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button
          style={mode === shapeTypes.SELECT ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.SELECT)}
        >
          Select
        </button>
        <button
          style={mode === shapeTypes.BRUSH ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.BRUSH)}
        >
          Brush
        </button>
        <button
          style={mode === shapeTypes.POLYGON ? styles.activeButton : styles.button}
          onClick={() => {
            setMode(shapeTypes.POLYGON);
            setTempPoints([]);
          }}
        >
          Polygon
        </button>
        <button
          style={mode === shapeTypes.CIRCLE ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.CIRCLE)}
        >
          Circle
        </button>
        <button
          style={mode === shapeTypes.LINE ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.LINE)}
        >
          Line
        </button>
        <button
          style={mode === shapeTypes.RECTANGLE ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.RECTANGLE)}
        >
          Rectangle
        </button>
        <button
          style={mode === shapeTypes.TRIANGLE ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.TRIANGLE)}
        >
          Triangle
        </button>
        <button
          style={mode === shapeTypes.OVAL ? styles.activeButton : styles.button}
          onClick={() => setMode(shapeTypes.OVAL)}
        >
          Oval
        </button>

        {mode === shapeTypes.BRUSH && (
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
          <button style={styles.colorChangeButton} onClick={changeSelectedColor}>
            Apply Color
          </button>
        )}
      </div>

      {mode === shapeTypes.POLYGON && tempPoints.length > 0 && (
        <div style={styles.polygonControls}>
          <button style={styles.button} onClick={completePolygon} disabled={tempPoints.length < 6}>
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
          {sortedShapes.map((shape) => renderShape(shape))}

          {mode === shapeTypes.POLYGON && tempPoints.length > 0 && (
            <Line points={tempPoints} stroke={color} strokeWidth={2} closed={false} />
          )}

          {mode === shapeTypes.BRUSH && isDrawing && (
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
            anchorCornerRadius={10}
            keepRatio={false}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasEditor;