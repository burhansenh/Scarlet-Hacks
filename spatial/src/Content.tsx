// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useAtom } from "jotai";
import getStroke from "perfect-freehand";
import { useState, useRef, useMemo, useCallback } from "react";
import {
  ImageSrcAtom,
  BoundingBoxes2DAtom,
  ShareStream,
  DetectTypeAtom,
  ImageSentAtom,
  RevealOnHoverModeAtom,
  DrawModeAtom,
  LinesAtom,
  ActiveColorAtom,
  VideoRefAtom,
} from "./atoms";
import { getSvgPathFromStroke } from "./utils";
import { lineOptions } from "./consts";
import { ResizePayload, useResizeDetector } from "react-resize-detector";

export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [hoverEntered, setHoverEntered] = useState(false);
  const [hoveredBox, _setHoveredBox] = useState<number | null>(null);
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);

  // Handling resize and aspect ratios
  const boundingBoxContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerDims, setContainerDims] = useState({
    width: 0,
    height: 0,
  });
  const [activeMediaDimensions, setActiveMediaDimensions] = useState({
    width: 1,
    height: 1,
  });

  const onResize = useCallback(
    (el: ResizePayload) => {
      if (el.width && el.height) {
        setContainerDims({
          width: el.width,
          height: el.height,
        });
      }
    },
    [],
  );

  const { ref: containerRef } = useResizeDetector({ onResize });

  const boundingBoxContainer = useMemo(() => {
    const { width, height } = activeMediaDimensions;
    if (!width || !height || !containerDims.width || !containerDims.height) {
      return null;
    }

    const aspectRatio = width / height;
    const containerAspectRatio = containerDims.width / containerDims.height;
    
    let finalWidth, finalHeight;
    
    if (aspectRatio > containerAspectRatio) {
      finalWidth = containerDims.width;
      finalHeight = containerDims.width / aspectRatio;
    } else {
      finalHeight = containerDims.height;
      finalWidth = containerDims.height * aspectRatio;
    }

    const top = (containerDims.height - finalHeight) / 2;
    const left = (containerDims.width - finalWidth) / 2;

    return { width: finalWidth, height: finalHeight, top, left };
  }, [containerDims, activeMediaDimensions]);

  function setHoveredBox(e: React.PointerEvent) {
    const boxes = document.querySelectorAll(".bbox");
    const dimensionsAndIndex = Array.from(boxes).map((box, i) => {
      const { top, left, width, height } = box.getBoundingClientRect();
      return {
        top,
        left,
        width,
        height,
        index: i,
      };
    });
    // Sort smallest to largest
    const sorted = dimensionsAndIndex.sort(
      (a, b) => a.width * a.height - b.width * b.height,
    );
    // Find the smallest box that contains the mouse
    const { clientX, clientY } = e;
    const found = sorted.find(({ top, left, width, height }) => {
      return (
        clientX > left &&
        clientX < left + width &&
        clientY > top &&
        clientY < top + height
      );
    });
    if (found) {
      _setHoveredBox(found.index);
    } else {
      _setHoveredBox(null);
    }
  }

  const downRef = useRef<Boolean>(false);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-900/50">
      <div 
        className="absolute"
        style={{
          width: boundingBoxContainer?.width,
          height: boundingBoxContainer?.height,
          top: boundingBoxContainer?.top,
          left: boundingBoxContainer?.left,
        }}
      >
        {stream ? (
          <video
            className="w-full h-full object-contain"
            autoPlay
            onLoadedMetadata={(e) => {
              setActiveMediaDimensions({
                width: e.currentTarget.videoWidth,
                height: e.currentTarget.videoHeight,
              });
            }}
            ref={(video) => {
              videoRef.current = video;
              if (video && !video.srcObject) {
                video.srcObject = stream;
              }
            }}
          />
        ) : imageSrc ? (
          <img
            src={imageSrc}
            className="w-full h-full object-contain"
            alt="Uploaded image"
            onLoad={(e) => {
              setActiveMediaDimensions({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              });
            }}
          />
        ) : null}
        
        <div
          className={`absolute inset-0 ${hoverEntered ? "hide-box" : ""} ${
            drawMode ? "cursor-crosshair" : ""
          }`}
          ref={boundingBoxContainerRef}
        >
          {detectType === "2D bounding boxes" &&
            boundingBoxes2D.map((box, i) => (
              <div
                key={i}
                className={`absolute bbox border-2 border-red-500 ${
                  i === hoveredBox ? "reveal" : ""
                }`}
                style={{
                  transformOrigin: "0 0",
                  top: box.y * 100 + "%",
                  left: box.x * 100 + "%",
                  width: box.width * 100 + "%",
                  height: box.height * 100 + "%",
                }}
              >
                <div className="bg-red-500 text-white absolute left-0 top-0 text-sm px-1">
                  {box.label}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
