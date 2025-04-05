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
import { DetectTypeAtom, HoverEnteredAtom } from "./atoms";
import { DetectTypes } from "./Types.js";

export function DetectTypeSelector() {
  return (
    <div className="flex flex-col flex-shrink-0">
      <div className="mb-3 uppercase">Give me:</div>
      <div className="flex flex-col gap-3">
        {["2D bounding boxes"].map((label) => (
          <SelectOption key={label} label={label} />
        ))}
      </div>
    </div>
  );
}

function SelectOption({ label }: { label: string }) {
  const [detectType, setDetectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  return (
    <button
      className={`w-full py-4 px-6 rounded-lg transition-all duration-200 text-left ${
        detectType === label 
          ? "bg-blue-500/20 border-blue-500/50" 
          : "hover:bg-gray-700/50"
      } border border-gray-700/50`}
      onClick={() => {
        setHoverEntered(false);
        setDetectType(label as DetectTypes);
      }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border-2 ${
          detectType === label 
            ? "border-blue-500 bg-blue-500" 
            : "border-gray-500"
        }`} />
        {label}
      </div>
    </button>
  );
}
