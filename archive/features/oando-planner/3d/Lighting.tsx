import React from "react";
import { usePlannerStore } from "../data/plannerStore";
import { getLightingPreset, type LightingPresetConfig } from "./presets";

interface LightingProps {
  /** Override the store's lighting preset */
  presetOverride?: LightingPresetConfig;
}

export function Lighting({ presetOverride }: LightingProps) {
  const lightingPreset = usePlannerStore((s) => s.lightingPreset);
  const config = presetOverride || getLightingPreset(lightingPreset);

  return (
    <>
      {/* Ambient lighting for soft overall illumination */}
      <ambientLight intensity={config.ambient.intensity} color={config.ambient.color} />

      {/* Main directional light representing sunlight through windows */}
      <directionalLight
        position={config.mainLight.position}
        intensity={config.mainLight.intensity}
        color={config.mainLight.color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Secondary fill light to soften dark shadows */}
      <directionalLight
        position={config.fillLight.position}
        intensity={config.fillLight.intensity}
        color={config.fillLight.color}
      />

      {/* Ceiling lights to simulate office environment */}
      {config.pointLights.map((light, index) => (
        <pointLight
          key={index}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
          decay={light.decay}
          castShadow={index === 0} // Only first point light casts shadows for performance
        />
      ))}
    </>
  );
}
