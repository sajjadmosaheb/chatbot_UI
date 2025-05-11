
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), 'chatbot.py');
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python3'; 

    const pythonResponse = await new Promise<{ type: 'success', data: string } | { type: 'error', data: string }>((resolve) => {
      
      const pythonProcess: ChildProcess = spawn(pythonExecutable, [scriptPath, prompt], {
        env: {
          ...process.env, 
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          PYTHONUNBUFFERED: "1" 
        },
      });

      let responseData = '';
      let errorData = '';

      pythonProcess.stdout?.on('data', (data) => {
        responseData += data.toString();
      });

      pythonProcess.stderr?.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && responseData) {
          resolve({ type: 'success', data: responseData.trim() });
        } else {
          const message = errorData || responseData || `Python script exited with code ${code}.`;
          console.error(`Python script error (executable: ${pythonExecutable}): ${message}`);
          resolve({ type: 'error', data: message.trim() });
        }
      });

      pythonProcess.on('error', (err: NodeJS.ErrnoException) => { 
        const errorMessage = `Failed to start Python process with ${pythonExecutable}: ${err.message}. Make sure Python 3 is installed and ${pythonExecutable} is in your system PATH. You can also set the PYTHON_EXECUTABLE environment variable.`;
        console.error(errorMessage, err);
        resolve({ type: 'error', data: errorMessage });
      });
    });

    if (pythonResponse.type === 'success') {
      return NextResponse.json({ response: pythonResponse.data });
    } else {
      return NextResponse.json({ error: pythonResponse.data }, { status: 500 });
    }

  } catch (error: any) { 
    console.error("API route error:", error);
    return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}

