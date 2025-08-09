import { useState } from 'react';

export default function VisualizationExternal() {
  const [pythonImage, setPythonImage] = useState<string | null>(null);
  const [rImage, setRImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = { A: 10, B: 25, C: 15, D: 30 };

  async function runPython() {
    try {
      // Provide the full absolute path to your Python script and any args here
      const pyData = JSON.stringify(data);
      const response = await window.electron.ipcRenderer.invoke('run-python', {
        scriptPath: "scripts/python/plot_data.py",
        // args: ['arg1', 'arg2'],  // optional
        args: [pyData]
      });
      setPythonImage(`data:image/png;base64,${response}`);
      setError(null);
      console.log('Python output:', response);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError('Python error: ' + (err as { message: string }).message);
      } else {
        setError('Python error: Unknown error');
      }
    }
  }

  async function runR() {
    try {
      // Assuming your 'run-r' handler still accepts 'data' only
      const response = await window.electron.ipcRenderer.invoke('run-r', data);
      setRImage(`data:image/png;base64,${response}`);
      setError(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError('R error: ' + (err as { message: string }).message);
      } else {
        setError('R error: Unknown error');
      }
    }
  }

  return (
    <div>
      <h2>Data Visualization</h2>
      <button onClick={runPython}>Visualize with Python</button>
      <button onClick={runR}>Visualize with R</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pythonImage && (
        <div>
          <h3>Python Plot</h3>
          <img src={pythonImage} alt="Python visualization" />
        </div>
      )}

      {rImage && (
        <div>
          <h3>R Plot</h3>
          <img src={rImage} alt="R visualization" />
        </div>
      )}
    </div>
  );
}
