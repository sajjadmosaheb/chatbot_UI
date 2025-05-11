
import React from 'react';

export function InitialGreeting() {
  const username = "there"; // Placeholder for username, as per current capabilities

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center p-4">
      <h2 className="text-4xl md:text-5xl font-bold">
        <span className="text-primary">Hi {username},</span>
      </h2>
      <p className="text-2xl md:text-3xl mt-3 text-destructive"> {/* Using text-destructive for "red" as requested */}
        How can I help you?
      </p>
    </div>
  );
}
