import { useState, useEffect } from "react";

interface Tip {
  icon: string;
  main: string;
  clarification: string;
}

const allTips: Tip[] = [
  {
    icon: "barbell",
    main: "Lift Heavy",
    clarification: "Focus on compound exercises with progressive overload",
  },
  {
    icon: "nutrition",
    main: "Eat Clean",
    clarification: "High protein, low carb diet with plenty of vegetables",
  },
  {
    icon: "bed",
    main: "Prioritize Sleep",
    clarification: "Aim for 7-9 hours of quality sleep each night",
  },
  {
    icon: "water",
    main: "Stay Hydrated",
    clarification: "Drink at least 3-4 liters of water daily",
  },
  {
    icon: "timer",
    main: "HIIT Cardio",
    clarification:
      "20-30 minutes of high-intensity interval training 2-3 times a week",
  },
  {
    icon: "body",
    main: "Mind-Muscle Connection",
    clarification: "Focus on feeling the targeted muscles during each exercise",
  },
  {
    icon: "calendar",
    main: "Consistency is Key",
    clarification:
      "Stick to your workout routine for at least 12 weeks to see significant results",
  },
  {
    icon: "restaurant",
    main: "Meal Prep",
    clarification:
      "Prepare your meals in advance to ensure you stick to your nutrition plan",
  },
  {
    icon: "fitness",
    main: "Progressive Overload",
    clarification:
      "Gradually increase weight, frequency, or reps to keep challenging your muscles",
  },
  {
    icon: "speedometer",
    main: "Track Progress",
    clarification:
      "Keep a workout log to monitor your improvements and stay motivated",
  },
];

// Utility function to get random tips
const getRandomTips = (count: number): Tip[] => {
  const shuffled = [...allTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const useShreddedTips = (count: number = 5) => {
  const [tips, setTips] = useState<Tip[]>([]);

  const refreshTips = () => {
    setTips(getRandomTips(count));
  };

  useEffect(() => {
    refreshTips();
  }, [count]);

  return { tips, refreshTips };
};
