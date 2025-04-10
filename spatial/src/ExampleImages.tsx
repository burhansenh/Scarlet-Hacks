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
import { ImageSrcAtom, IsUploadedImageAtom } from "./atoms";
import { useResetState } from "./hooks";
import { imageOptions } from "./consts";
import { SideControls } from "./SideControls";

export function ExampleImages() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const resetState = useResetState();
  
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        {imageOptions.map((image) => (
          <button
            key={image}
            className="relative w-full pt-[100%] rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500/50 transition-all duration-200"
            onClick={() => {
              setIsUploadedImage(false);
              setImageSrc(`./${image}`);
              resetState();
            }}
          >
            <img
              src={`./${image}`}
              alt={image}
              className="absolute inset-0 w-full h-full object-cover bg-gray-900/50"
            />
          </button>
        ))}
      </div>
      <SideControls />
    </div>
  );
}

