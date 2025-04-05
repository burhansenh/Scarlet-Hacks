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
  BoundingBoxes3DAtom,
  ShareStream,
  DetectTypeAtom,
  PromptsAtom,
  ModelSelectedAtom,
  PointsAtom,
  HoverEnteredAtom,
  LinesAtom,
  ImageSrcAtom,
  VideoRefAtom,
  TemperatureAtom,
  CustomPromptsAtom,
} from "./atoms";
import { lineOptions } from "./consts.js";
import { getSvgPathFromStroke, loadImage } from "./utils";
import {  useState } from "react";

const client = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [modelSelected] = useAtom(ModelSelectedAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [showCustomPrompt] = useState(false);
  const [targetPrompt, setTargetPrompt] = useState("items");
  const [labelPrompt, setLabelPrompt] = useState("");
  const [showRawPrompt, setShowRawPrompt] = useState(false);

  const [prompts, setPrompts] = useAtom(PromptsAtom);
  const [customPrompts, setCustomPrompts] = useAtom(CustomPromptsAtom);


  const is2d = detectType === "2D bounding boxes";

  const get2dPrompt = () =>
    `Analyze this hydroponic lettuce plant image. Identify and locate only clearly visible plant health issues using 2-D bounding boxes:
  1. Leaf discoloration (yellowing, brown spots, or purple veins)
  2. Stunted growth or wilting (smaller-than-expected size or drooping)
  3. Curling/crisping leaf edges (upward/downward leaf curling or dry margins)
  
  IMPORTANT: If the plant appears healthy with no obvious defects, return an empty list [].
  Only mark genuine issues with high confidence. Dont overlap bounding boxes. 
  
  Output a JSON list with:
  - Each entry containing the 2D bounding box in "box_2d" as [x1, y1, x2, y2] coordinates
  - A detailed "label" describing the specific issue detected
  
  Format: [{'box_2d':[...], 'label':...}, ...]`;




  async function handleSend() {
    let activeDataURL;
    const maxSize = 640;
    const copyCanvas = document.createElement("canvas");
    const ctx = copyCanvas.getContext("2d")!;

    if (stream) {
      // screenshare
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
      console.log(copyCanvas)
      ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
    }
    activeDataURL = copyCanvas.toDataURL("image/png");

    if (lines.length > 0) {
      for (const line of lines) {
        const p = new Path2D(
          getSvgPathFromStroke(
            getStroke(
              line[0].map(([x, y]) => [
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

    const prompt = prompts[detectType];

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
              {text: is2d ? get2dPrompt() : prompt.join(" ")},
              {inlineData: {
                data: activeDataURL.replace("data:image/png;base64,", ""),
                mimeType: "image/png"
              }}
            ]
          }
        ],
        generationConfig: {temperature}
      })).response.text()

    if (response.includes("```json")) {
      response = response.split("```json")[1].split("```")[0];
    }
    const parsedResponse = JSON.parse(response);
    if (detectType === "2D bounding boxes") {
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
    } else if (detectType === "Points") {
      const formattedPoints = parsedResponse.map(
        (point: { point: [number, number]; label: string }) => {
          return {
            point: {
              x: point.point[1] / 1000,
              y: point.point[0] / 1000,
            },
            label: point.label,
          };
        },
      );
      setPoints(formattedPoints);
    } else {
      const formattedBoxes = parsedResponse.map(
        (box: {
          box_3d: [
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
          ];
          label: string;
        }) => {
          const center = box.box_3d.slice(0, 3);
          const size = box.box_3d.slice(3, 6);
          const rpy = box.box_3d
            .slice(6)
            .map((x: number) => (x * Math.PI) / 180);
          return {
            center,
            size,
            rpy,
            label: box.label,
          };
        },
      );
      setBoundingBoxes3D(formattedBoxes);
    }
  }

  return (
    <div className="flex grow flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="uppercase">Prompt:</div>
        <label className="flex gap-2 select-none">
          <input
            type="checkbox"
            checked={showRawPrompt}
            onChange={() => setShowRawPrompt(!showRawPrompt)}
          />
          <div>show raw prompt</div>
        </label>
      </div>
      <div className="w-full flex flex-col">
        {showCustomPrompt ? (
          <textarea
          className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
          value={customPrompts[detectType]}
            onChange={(e) => {
              const value = e.target.value;
              const newPrompts = { ...customPrompts };
              newPrompts[detectType] = value;
              setCustomPrompts(newPrompts);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        ) : showRawPrompt ? (
          <div className="mb-2 text-[var(--text-color-secondary)]">
            {is2d ? get2dPrompt() : prompts[detectType].join(" ")}
          </div>
        ) :(
          <div className="flex flex-col gap-2">
            <div>{prompts[detectType][0]}:</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
              placeholder="What kind of things do you want to detect?"
              rows={1}
              value={is2d ? targetPrompt : prompts[detectType][1]}
              onChange={(e) => {
                if (is2d) {
                  setTargetPrompt(e.target.value);
                } else {
                  const value = e.target.value;
                  const newPrompts = { ...prompts };
                  newPrompts[detectType][1] = value;
                  setPrompts(newPrompts);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {is2d && (<>
            <div>Label each one with: (optional)</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
              rows={1}
              placeholder="How do you want to label the things?"
              value={labelPrompt}
              onChange={(e) =>
                setLabelPrompt(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            </>)}
          </div>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <button className="bg-[#3B68FF] px-12 !text-white !border-none" onClick={handleSend}>
          Send
        </button>
        <label className="flex items-center gap-2">
          temperature:
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
          {temperature.toFixed(2)}
        </label>
      </div>
    </div>
  );
}
