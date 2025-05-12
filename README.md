# HydroAI 🌿

HydroAI is an AI-powered tool built at Scarlet Hacks 2025 to help hydroponic farmers detect plant defects and receive automated care suggestions.

## Features
- 🧠 Trained on 1,000+ annotated images to detect leaf spotting, mold, and discoloration (>85% accuracy)
- 🗣️ Uses Gemini API + custom prompts for natural language care instructions
- 🧪 Python evaluation script reports F1 scores across classes

## Usage
"```" bash
git clone https://github.com/your-username/hydroAI.git
cd hydroAI
pip install -r requirements.txt
python app.py
Then go to http://localhost:5000 to upload images and get results.

## Future Work
- Cloud deployment (AWS)
- Mobile camera integration
- Larger dataset with more plant species
