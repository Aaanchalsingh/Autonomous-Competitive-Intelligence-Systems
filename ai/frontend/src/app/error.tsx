"use client";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center space-y-4">
        <AlertTriangle size={32} className="text-red-400 mx-auto" />
        <div>
          <p className="font-semibold text-white">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-1">{error.message}</p>
        </div>
        <p className="text-xs text-gray-600">
          Make sure the Python API is running: <code className="text-brand-400">uvicorn api_server:app --port 8000</code>
        </p>
        <button onClick={reset} className="btn-primary mx-auto">Try again</button>
      </div>
    </div>
  );
}
