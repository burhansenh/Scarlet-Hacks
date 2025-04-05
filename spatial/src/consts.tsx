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

export const colors = [
  "rgb(0, 0, 0)",
  "rgb(255, 255, 255)",
  "rgb(213, 40, 40)",
  "rgb(250, 123, 23)",
  "rgb(240, 186, 17)",
  "rgb(8, 161, 72)",
  "rgb(26, 115, 232)",
  "rgb(161, 66, 244)",
];

export const modelOptions = [
  "models/gemini-2.0-flash-exp",
  "models/gemini-1.5-flash",
];

export const imageOptions: string[] = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
];

export const lineOptions = {
  size: 8,
  thinning: 0,
  smoothing: 0,
  streamline: 0,
  simulatePressure: false,
};

const safetyLevel = "only_high";

export const safetySettings = new Map();

safetySettings.set("harassment", safetyLevel);
safetySettings.set("hate_speech", safetyLevel);
safetySettings.set("sexually_explicit", safetyLevel);
safetySettings.set("dangerous_content", safetyLevel);
safetySettings.set("civic_integrity", safetyLevel);
