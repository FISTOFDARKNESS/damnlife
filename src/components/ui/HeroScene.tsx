"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Sparkles, Stars, ContactShadows } from "@react-three/drei";
import * as THREE from 'three';

// An abstract floating crystal or primitive to represent digital assets
function FloatingCrystal() {
    const meshRef = useRef<THREE.Mesh>(null);

    // Custom material for glass/shiny effect
    const material = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: '#8b5cf6',
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 0.5,
        ior: 1.5,
        envMapIntensity: 2,
        clearcoat: 1,
        clearcoatRoughness: 0.1
    }), []);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
            meshRef.current.rotation.x += 0.002;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
                <octahedronGeometry args={[1.5, 0]} />
                <primitive object={material} attach="material" />
            </mesh>
        </Float>
    );
}

// Background scene setup
export function HeroScene() {
    return (
        <div className="canvas-container">
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <color attach="background" args={["#09090b"]} />
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#d946ef" />

                <FloatingCrystal />

                <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#8b5cf6" />

                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
                <Sparkles count={100} scale={12} size={2} speed={0.4} opacity={0.3} color="#c084fc" />

                {/* Adds reflections */}
                <Environment preset="city" />
            </Canvas>
            {/* Overlay gradient so text remains easily readable in the center */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/40 via-transparent to-dark-bg pointer-events-none" />
        </div>
    );
}
