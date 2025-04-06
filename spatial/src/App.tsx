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

import { useEffect } from "react";
import { TopBar } from "./TopBar.js";
import { Content } from "./Content.js";
import { ExampleImages } from "./ExampleImages.js";
import { SideControls } from "./SideControls.js";
import { Prompt } from "./Prompt.js";
import { ExtraModeControls } from "./ExtraModeControls.js";
import { useAtom } from "jotai";
import {
  BumpSessionAtom,
  ImageSrcAtom,
  InitFinishedAtom,
  IsUploadedImageAtom,
} from "./atoms.js";
import { useResetState } from "./hooks.js";
import { DetectTypeSelector } from "./DetectTypeSelector.js";
import { safetySettings } from "./consts.js";
import { PlantFeedback } from "./PlantFeedback";

function App() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const resetState = useResetState();
  const [initFinished, setInitFinished] = useAtom(InitFinishedAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);

  useEffect(() => {
    if (!window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="p-6 border-b border-gray-700/50 backdrop-blur-sm bg-black/20 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-xl">🌿</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Hydro AI
            </h1>
          </div>
          <TopBar />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Panel */}
        <div className="lg:w-1/4 space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">📸</span>
              Image Selection
            </h2>
            <ExampleImages />
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">🎯</span>
              Detection Type
            </h2>
            <DetectTypeSelector />
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:w-3/4 space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-700/50">
            <div className="h-[60vh] relative">
              {initFinished ? <Content /> : null}
            </div>
            <ExtraModeControls />
          </div>

          <PlantFeedback />

          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
            <Prompt />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-gray-700/50 text-center bg-black/20 backdrop-blur-sm">
        <p className="text-gray-400">© 2024 Plant Health Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
