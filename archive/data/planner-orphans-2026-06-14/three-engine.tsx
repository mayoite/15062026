import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEnvelopeStore } from './envelope';

/**
 * World-class 3D Architecture:
 * 1. InstancedMesh allows rendering 5,000 desks in a single draw call.
 * 2. Transient updates: useFrame constantly pulls from Zustand without triggering React.
 */

const ItemInstancedMesh = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const items = useEnvelopeStore(state => state.items);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Filter items by SKU so we can render all identical SKUs in one InstancedMesh.
  const targetSku = 'GENERIC-DESK-01';
  const instanceArray = useMemo(() => {
    return Object.values(items).filter(i => i.sku === targetSku);
  }, [items]);

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Performance: We constantly poll the Envelope state inside useFrame.
    // If the user drags a desk in Konva, the Zustand state updates.
    // This loop grabs that state and mutates the GPU matrices directly (no React diffs).
    const currentItems = useEnvelopeStore.getState().items;
    let i = 0;
    
    for (const key in currentItems) {
      const item = currentItems[key];
      if (item.sku === targetSku) {
        dummy.position.set(item.position[0], item.position[1], item.position[2]);
        dummy.rotation.set(0, THREE.MathUtils.degToRad(item.rotation), 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i++, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (instanceArray.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, instanceArray.length]}>
      <boxGeometry args={[1.2, 0.75, 0.6]} />
      <meshStandardMaterial color="#10b981" />
    </instancedMesh>
  );
};

export const ManifestationViewer3D = () => {
  return (
    <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      {/* The floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#e4e4e7" /> {/* zinc-200 */}
      </mesh>

      <ItemInstancedMesh />
      
      <OrbitControls makeDefault />
    </Canvas>
  );
};
