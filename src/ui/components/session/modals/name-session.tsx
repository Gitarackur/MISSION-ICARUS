"use client";

import * as React from "react";
import { Input } from "@/ui/design-system/Input";
import { Button } from "@/ui/design-system/Button";

interface NameSessionProps {
  onSubmit: (values: { name: string }) => void;
}

const NameSession: React.FC<NameSessionProps> = ({ onSubmit }) => {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setError(null);
    onSubmit({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-md max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        Name of Session
      </h1>
      <div>
        <Input
          scale="lg"
          placeholder="Enter session name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="name-error"
        />
        {error && (
          <p id="name-error" className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      <Button type="submit">Create Session</Button>
    </form>
  );
};

export default NameSession;
