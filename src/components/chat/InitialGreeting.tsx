
import React from 'react';

interface InitialGreetingProps {
  username: string;
}

export function InitialGreeting({ username }: InitialGreetingProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-4xl md:text-5xl font-semibold">
        <span className="text-foreground/80">Hello, </span>
        <span className="text-primary">{username}</span>
      </h2>
      {/* "How can I help you?" part removed as per the image */}
    </div>
  );
}
