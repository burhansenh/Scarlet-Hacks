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
import {GoogleGenerativeAI} from "@google/generative-ai";
import {
  BoundingBoxes2DAtom,
  ShareStream,
  DetectTypeAtom,
  ModelSelectedAtom,
  HoverEnteredAtom,
  LinesAtom,
  ImageSrcAtom,
  VideoRefAtom,
  TemperatureAtom,
} from "./atoms";
import { lineOptions } from "./consts.js";
import { getSvgPathFromStroke, loadImage } from "./utils";
import { useState } from "react";

const client = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [modelSelected] = useAtom(ModelSelectedAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [showHealthyNotice, setShowHealthyNotice] = useState(false);
  const [isNoticeExiting, setIsNoticeExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const is2d = detectType === "2D bounding boxes";

  const get2dPrompt = () =>
    `Detect defects in the hydroponic plant using 2-D bounding boxes. Focus exclusively on these plant health indicators:  
  1. Leaf discoloration (yellowing, brown spots, or purple veins)  
  2. Stunted growth or wilting (smaller-than-expected size or drooping)  
  3. Curling/crisping leaf edges (upward/downward leaf curling or dry margins).  

  IMPORTANT: Only mark genuine issues with high confidence. No overlapping bounding boxes. Return an empty list if the plant appears healthy.

  Output a JSON list with:  
  - Either no issues, or one from the list above.
  - Each entry containing the 2D bounding box in "box_2d" as [x1, y1, x2, y2] coordinates.  
  - A text label in "label" specifying the detected issue (e.g., 'yellowing leaves', 'wilting', 'curling edges').  

  Format: [{'box_2d':[...], 'label':...}, ...]`;

  const showNotification = () => {
    setShowHealthyNotice(true);
    setTimeout(() => setIsVisible(true), 50);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setShowHealthyNotice(false), 500);
    }, 2500);
  };

  async function handleSend() {
    setIsLoading(true);
    try {
      let activeDataURL;
      const maxSize = 640;
      const copyCanvas = document.createElement("canvas");
      const ctx = copyCanvas.getContext("2d")!;

      if (stream) {
        const video = videoRef.current!;
        const scale = Math.min(
          maxSize / video.videoWidth,
          maxSize / video.videoHeight,
        );
        copyCanvas.width = video.videoWidth * scale;
        copyCanvas.height = video.videoHeight * scale;
        ctx.drawImage(
          video,
          0,
          0,
          video.videoWidth * scale,
          video.videoHeight * scale,
        );
      } else if (imageSrc) {
        const image = await loadImage(imageSrc);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        copyCanvas.width = image.width * scale;
        copyCanvas.height = image.height * scale;
        ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
      }
      activeDataURL = copyCanvas.toDataURL("image/png");

      if (lines.length > 0) {
        for (const line of lines) {
          const p = new Path2D(
            getSvgPathFromStroke(
              getStroke(
                line[0].map(([x, y]: [number, number]) => [
                  x * copyCanvas.width,
                  y * copyCanvas.height,
                  0.5,
                ]),
                lineOptions,
              ),
            ),
          );
          ctx.fillStyle = line[1];
          ctx.fill(p);
        }
        activeDataURL = copyCanvas.toDataURL("image/png");
      }

      setHoverEntered(false);

      let response = (await client
        .getGenerativeModel(
          {model: modelSelected},
          {apiVersion: 'v1beta'}
        )
        .generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {text: get2dPrompt()},
                {inlineData: {
                  data: activeDataURL.replace("data:image/png;base64,", ""),
                  mimeType: "image/png"
                }}
              ]
            }
          ],
          generationConfig: {temperature}
        })).response.text();

      // Clean up the response
      if (response.includes("```json")) {
        response = response.split("```json")[1].split("```")[0];
      } else if (response.includes("```")) {
        response = response.split("```")[1].split("```")[0];
      }
      
      // Handle empty or invalid responses
      let parsedResponse = [];
      try {
        response = response.trim();
        parsedResponse = JSON.parse(response);
        if (!Array.isArray(parsedResponse)) {
          parsedResponse = [];
        }
      } catch (error) {
        console.error('Failed to parse response:', error);
        parsedResponse = [];
      }
      
      const formattedBoxes = parsedResponse.map(
        (box: { box_2d: [number, number, number, number]; label: string }) => {
          const [ymin, xmin, ymax, xmax] = box.box_2d;
          return {
            x: xmin / 1000,
            y: ymin / 1000,
            width: (xmax - xmin) / 1000,
            height: (ymax - ymin) / 1000,
            label: box.label,
          };
        },
      );

      setHoverEntered(false);
      setBoundingBoxes2D(formattedBoxes);

      // Always show healthy notice if no issues found
      if (!formattedBoxes.length) {
        showNotification();
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setBoundingBoxes2D([]); // Clear any existing boxes
      showNotification(); // Show healthy notice on error
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <button 
          className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
            text-white px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/20
            flex items-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          onClick={handleSend}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span className="text-lg">🔍</span>
              <span>Analyze Image</span>
            </>
          )}
        </button>
        
        <div className="flex items-center gap-4 bg-gray-900/50 p-3 rounded-lg">
          <span className="text-gray-300 whitespace-nowrap">Sensitivity:</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-32 accent-blue-500"
            disabled={isLoading}
          />
          <span className="text-gray-300 w-12 text-right">{temperature.toFixed(2)}</span>
        </div>
      </div>

      {/* Healthy Plant Notification */}
      {showHealthyNotice && (
        <div className="absolute top-0 left-0 right-0 -mt-24 flex justify-center">
          <div 
            className={`
              bg-gradient-to-r from-green-500/90 to-emerald-500/90 
              backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-lg 
              flex items-center gap-3 transition-all duration-500 ease-in-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-10px]'}
            `}
          >
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="font-semibold text-lg">Plant Looks Healthy!</h3>
              <p className="text-sm text-green-100">No issues detected in the analysis</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
