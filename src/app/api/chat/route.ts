
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Resolve the path to the Python script relative to the project root
    const scriptPath = path.join(process.cwd(), 'chatbot.py');

    // Use a Promise to handle the asynchronous nature of spawn
    const pythonResponse = await new Promise<{ type: 'success', data: string } | { type: 'error', data: string }>((resolve) => {
      // Try 'python3' first, then 'python' as a fallback if needed, or configure based on deployment env
      const pythonExecutable = 'python3'; 
      
      const pythonProcess = spawn(pythonExecutable, [scriptPath, prompt], {
        env: {
          ...process.env, // Pass existing environment variables
          OPENAI_API_KEY: process.env.OPENAI_API_KEY, // Explicitly pass the API key
          PYTHONUNBUFFERED: "1" // Ensures direct output, might help with pipes
        },
        // stdio: ['pipe', 'pipe', 'pipe'] // Explicitly set stdio
      });

      let responseData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && responseData) {
          resolve({ type: 'success', data: responseData.trim() });
        } else {
          // Prioritize errorData if available, otherwise use responseData or a generic message
          const message = errorData || responseData || `Python script exited with code ${code}.`;
          resolve({ type: 'error', data: message.trim() });
        }
      });

      pythonProcess.on('error', (err) => { // Handle spawn errors (e.g., python3 not found)
        resolve({ type: 'error', data: `Failed to start Python process with ${pythonExecutable}: ${err.message}. Make sure Python is installed and in PATH.` });
      });
    });

    if (pythonResponse.type === 'success') {
      return NextResponse.json({ response: pythonResponse.data });
    } else {
      return NextResponse.json({ error: pythonResponse.data }, { status: 500 });
    }

  } catch (error: any) { // Catch errors from req.json() or other unexpected errors
    return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
