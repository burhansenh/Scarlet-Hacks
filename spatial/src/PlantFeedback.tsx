import { useAtom } from "jotai";
import { BoundingBoxes2DAtom } from "./atoms";

const feedbackDatabase = {
  "yellowing leaves": {
    cause: "Usually indicates nitrogen deficiency or improper pH levels in the nutrient solution.",
    remedy: "Adjust nutrient solution and pH levels",
    steps: [
      "Test the pH level of your nutrient solution (ideal range: 5.5-6.5)",
      "Check nitrogen levels in your nutrient solution",
      "If needed, add nitrogen-rich nutrients according to manufacturer's instructions",
      "Monitor plant for 3-5 days for improvement",
      "If no improvement, consider testing for other nutrient deficiencies"
    ]
  },
  "wilting": {
    cause: "Often caused by improper water levels, root problems, or high temperatures.",
    remedy: "Optimize water delivery and environmental conditions",
    steps: [
      "Check water pump functionality and flow rate",
      "Inspect roots for signs of rot or disease",
      "Verify water temperature (ideal: 65-75°F / 18-24°C)",
      "Ensure proper air circulation around plants",
      "Adjust ambient temperature if needed"
    ]
  },
  "curling edges": {
    cause: "Usually indicates heat stress, light burn, or nutrient imbalance.",
    remedy: "Adjust environmental conditions and nutrient balance",
    steps: [
      "Check distance between plants and grow lights",
      "Monitor temperature around plant canopy",
      "Verify humidity levels (ideal: 50-70%)",
      "Test calcium and magnesium levels",
      "Adjust nutrient solution if necessary"
    ]
  },
  "brown spots": {
    cause: "Could indicate fungal infection, nutrient burn, or light burn.",
    remedy: "Identify the specific cause and adjust environmental conditions",
    steps: [
      "Check for signs of fungal growth or disease",
      "Review recent changes in nutrient concentration",
      "Verify light intensity and distance from plants",
      "Improve air circulation if needed",
      "Consider applying organic fungicide if disease is confirmed"
    ]
  },
  "purple veins": {
    cause: "Often indicates phosphorus deficiency or cold stress.",
    remedy: "Adjust nutrient levels and temperature",
    steps: [
      "Check water temperature (should be above 65°F/18°C)",
      "Test phosphorus levels in nutrient solution",
      "Adjust pH to improve phosphorus uptake (ideal: 5.5-6.5)",
      "Add phosphorus supplement if needed",
      "Monitor ambient temperature and adjust if too cold"
    ]
  },
  "stunted growth": {
    cause: "Multiple possible causes: nutrient deficiency, root problems, or environmental stress.",
    remedy: "Systematic check of growing conditions",
    steps: [
      "Inspect root system for health and growth",
      "Check overall nutrient solution concentration (EC/PPM)",
      "Verify all essential nutrients are present",
      "Ensure proper light intensity and duration",
      "Monitor temperature and humidity levels"
    ]
  }
};

export function PlantFeedback() {
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  
  if (boundingBoxes2D.length === 0) return null;

  const uniqueIssues = [...new Set(boundingBoxes2D.map(box => box.label))];

  return (
    <div className="space-y-6">
      {uniqueIssues.map((issue, index) => {
        const feedback = feedbackDatabase[issue as keyof typeof feedbackDatabase];
        if (!feedback) {
          console.warn(`No feedback found for issue: ${issue}`);
          return null;
        }
        
        return (
          <div key={index} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              Plant Health Analysis: Issue {index + 1}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <h3 className="text-lg font-medium capitalize">{issue}</h3>
              </div>
              
              <div className="grid gap-4 pl-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Cause:</h4>
                  <p className="text-gray-300">{feedback.cause}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Recommended Solution:</h4>
                  <p className="text-gray-300">{feedback.remedy}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400">Steps to Fix:</h4>
                  <ol className="list-decimal pl-4 mt-2 space-y-2 text-gray-300">
                    {feedback.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 