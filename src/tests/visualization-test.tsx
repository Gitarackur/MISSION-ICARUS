import { useState } from 'react'

type SampleData = Record<string, number>

export default function VisualizationTest(): JSX.Element {
  const [pythonImage, setPythonImage] = useState<string | null>(null)
  const [rImage, setRImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sampleData: SampleData = { A: 10, B: 20, C: 30, D: 40 }

  async function runPython(): Promise<void> {
    const pyData = JSON.stringify(sampleData);
    try {
      setError(null)
      const base64 = await window.electron.ipcRenderer.invoke('run-python', {
        scriptPath: "scripts/python/plot_data.py",
        // args: [], // add args if needed
        args: [pyData]
      })
      setPythonImage(`data:image/png;base64,${base64}`)
    } catch (e) {
      setError(`Python error: ${(e as Error).message || e}`)
    }
  }

  async function runR(): Promise<void> {
    try {
      setError(null)
      const base64 = await window.electron.ipcRenderer.invoke('run-r', sampleData)
      setRImage(`data:image/png;base64,${base64}`)
    } catch (e) {
      setError(`R error: ${(e as Error).message || e}`)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Data Visualization Test</h1>
      <button onClick={runPython} style={{ marginRight: 10 }}>
        Run Python Plot
      </button>
      <button onClick={runR}>Run R Plot</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pythonImage && (
        <div>
          <h3>Python Plot</h3>
          <img
            src={pythonImage}
            alt="Python visualization"
            style={{ maxWidth: '100%', border: '1px solid #ccc' }}
          />
        </div>
      )}

      {rImage && (
        <div>
          <h3>R Plot</h3>
          <img
            src={rImage}
            alt="R visualization"
            style={{ maxWidth: '100%', border: '1px solid #ccc' }}
          />
        </div>
      )}
    </div>
  )
}
