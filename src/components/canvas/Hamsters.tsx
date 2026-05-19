"use client";

import { extend } from "@pixi/react";
import { Sprite, Container, Assets, Texture } from "pixi.js";
import { useState, useEffect } from "react";
import { BLOCK_H, SIDE_LAYERS, TILE_H, createProjection } from "./geometry";

extend({ Sprite, Container });

interface HamstersProps {
  gridSize: number;
  project: ReturnType<typeof createProjection>;
}

export function Hamsters({ gridSize, project }: HamstersProps) {
  const [textures, setTextures] = useState<Record<string, Texture> | null>(null);

  useEffect(() => {
    let isMounted = true;
    Assets.load([
      "/sprites/ham-brown-px.png",
      "/sprites/ham-white-px.png",
      "/sprites/ham-gray-px.png",
    ]).then((loaded) => {
      if (isMounted) setTextures(loaded);
    });
    return () => { isMounted = false; };
  }, []);

  if (!textures) return null;

  // 1. Находим точный центр острова по горизонтали
  const centerTile = project((gridSize - 1) / 2, (gridSize - 1) / 2);
  const cx = centerTile.x;

  // 2. Находим самый нижний край "толщины" острова (под блоками)
  const frontTile = project(gridSize - 1, gridSize - 1);
  const islandBottomY = frontTile.y + TILE_H + (SIDE_LAYERS * BLOCK_H);

  // 3. Масштаб: делаем их меньше (0.2 - 0.25), чтобы они влезли под остров
  const HAMSTER_SCALE = 1;

  // 4. Смещение вверх (Y_OFFSET): поднимаем их так, чтобы головы зашли ПОД блоки
  const Y_OFFSET = -5;

  return (
    <pixiContainer>
      <pixiSprite
        texture={textures["/sprites/ham-brown-px.png"]}
        x={cx - 97}
        y={islandBottomY + 11 + Y_OFFSET}
        anchor={0.5}
        scale={HAMSTER_SCALE}
      />

      <pixiSprite
        texture={textures["/sprites/ham-white-px.png"]}
        x={cx}
        y={islandBottomY + 45 + Y_OFFSET}
        anchor={0.5}
        scale={HAMSTER_SCALE}
      />

      <pixiSprite
        texture={textures["/sprites/ham-gray-px.png"]}
        x={cx + 95}
        y={islandBottomY + Y_OFFSET + 12}
        anchor={0.5}
        scale={HAMSTER_SCALE}
      />
    </pixiContainer>
  );
}