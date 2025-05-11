
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Brain, FileText, Rocket } from 'lucide-react'; // Example icons

interface ExamplePromptsGridProps {
  onPromptClick: (promptText: string) => void;
}

const prompts = [
  {
    title: "Create an app",
    description: "for tracking tasks",
    icon: <Lightbulb className="h-6 w-6 mb-2 text-primary" />,
    promptText: "Create an app for tracking tasks"
  },
  {
    title: "Generate novel",
    description: "protein structures",
    icon: <Brain className="h-6 w-6 mb-2 text-primary" />,
    promptText: "Generate novel protein structures"
  },
  {
    title: "Write requirements",
    description: "for a fitness tracking app",
    icon: <FileText className="h-6 w-6 mb-2 text-primary" />,
    promptText: "Write requirements for a fitness tracking app"
  },
  {
    title: "Calculate rocket",
    description: "trajectory to Mars",
    icon: <Rocket className="h-6 w-6 mb-2 text-primary" />,
    promptText: "Calculate rocket trajectory to Mars"
  },
];

export function ExamplePromptsGrid({ onPromptClick }: ExamplePromptsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
      {prompts.map((prompt, index) => (
        <Card 
          key={index} 
          className="hover:shadow-lg transition-shadow cursor-pointer bg-card/50 hover:bg-card"
          onClick={() => onPromptClick(prompt.promptText)}
          data-ai-hint={`${prompt.title.split(" ")[0]} ${prompt.description.split(" ")[0]}`}
        >
          <CardHeader className="items-start p-4 pb-0">
            {prompt.icon}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm font-medium text-foreground">{prompt.title}</p>
            <p className="text-xs text-muted-foreground">{prompt.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
