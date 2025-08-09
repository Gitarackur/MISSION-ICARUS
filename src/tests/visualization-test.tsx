import { useState } from 'react'
import { tv } from 'tailwind-variants'

type SampleData = Record<string, number>

// Tailwind Variants styles
const styles = {
  container: tv({
    base: 'max-w-4xl mx-auto p-6 space-y-6 bg-white rounded-lg shadow-md',
  }),
  header: tv({
    base: 'text-3xl font-semibold text-gray-900',
  }),
  btn: tv({
    base: 'px-5 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    variants: {
      variant: {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary:
          'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }),
  errorText: tv({
    base: 'text-red-600 font-semibold',
  }),
  imageWrapper: tv({
    base: 'border border-gray-300 rounded-md overflow-hidden shadow-sm',
  }),
  image: tv({
    base: 'w-full h-auto object-contain',
  }),
  btnGroup: tv({
    base: 'flex space-x-4',
  }),
}

export default function VisualizationTest(): JSX.Element {
  const [pythonImage, setPythonImage] = useState<string | null>(null)
  const [rImage, setRImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sampleData: SampleData = { A: 10, B: 20, C: 30, D: 40 }

  async function runPython(): Promise<void> {
    const pyData = JSON.stringify(sampleData)
    try {
      setError(null)
      const base64 = await window.electron.ipcRenderer.invoke('run-python', {
        scriptPath: 'scripts/python/plot_data.py',
        args: [pyData],
      })
      setPythonImage(`data:image/png;base64,${base64.trim()}`)
    } catch (e) {
      setError(`Python error: ${(e as Error).message || e}`)
    }
  }

  async function runR(): Promise<void> {
    try {
      setError(null)
      const base64 = await window.electron.ipcRenderer.invoke('run-r', {
        scriptPath: 'scripts/r/plot_r.R',
        args: [JSON.stringify(sampleData)],
      })
      setRImage(`data:image/png;base64,${base64.trim()}`)
    } catch (e) {
      setError(`R error: ${(e as Error).message || e}`)
    }
  }

  return (
    <div className={styles.container()}>
      <h1 className={styles.header()}>Data Visualization Test</h1>

      <div className={styles.btnGroup()}>
        <button
          className={styles.btn({ variant: 'primary' })}
          onClick={runPython}
        >
          Run Python Plot
        </button>
        <button
          className={styles.btn({ variant: 'secondary' })}
          onClick={runR}
        >
          Run R Plot
        </button>
      </div>

      {error && <p className={styles.errorText()}>{error}</p>}

      {pythonImage && (
        <div>
          <h3 className="text-xl font-semibold mt-6 mb-2 text-gray-800">
            Python Plot
          </h3>
          <div className={styles.imageWrapper()}>
            <img
              src={pythonImage}
              alt="Python visualization"
              className={styles.image()}
            />
          </div>
        </div>
      )}

      {rImage && (
        <div>
          <h3 className="text-xl font-semibold mt-6 mb-2 text-gray-800">
            R Plot
          </h3>
          <div className={styles.imageWrapper()}>
            <img
              src={rImage}
              alt="R visualization"
              className={styles.image()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
