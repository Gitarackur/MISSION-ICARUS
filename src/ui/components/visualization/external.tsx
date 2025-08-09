import { useCallback, useEffect, useMemo, useState } from 'react'
import { tv } from 'tailwind-variants'

const styles = {
  container: tv({
    base: 'p-6 space-y-6 bg-white rounded-lg shadow-md',
  }),
  header: tv({
    base: 'text-2xl font-semibold text-gray-900',
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
  subheader: tv({
    base: 'text-xl font-semibold mt-6 mb-2 text-gray-800',
  }),
}

export default function VisualizationExternal() {
  const [pythonImage, setPythonImage] = useState<string | null>(null)
  const [rImage, setRImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const data = useMemo(() => ({ A: 10, B: 25, C: 15, D: 30 }), [])

  const runPython = useCallback(async () => {
    try {
      const pyData = JSON.stringify(data)
      const response = await window.electron.ipcRenderer.invoke('run-python', {
        scriptPath: 'scripts/python/plot_data.py',
        args: [pyData],
      })
      setPythonImage(`data:image/png;base64,${response.trim()}`)
      setError(null)
      console.log('Python output:', response)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError('Python error: ' + (err as { message: string }).message)
      } else {
        setError('Python error: Unknown error')
      }
    }
  }, [data])

  const runR = useCallback(async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('run-r', {
        scriptPath: 'scripts/r/plot_r.R',
        args: [JSON.stringify(data)],
      })
      setRImage(`data:image/png;base64,${response}`)
      setError(null)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError('R error: ' + (err as { message: string }).message)
      } else {
        setError('R error: Unknown error')
      }
    }
  }, [data])

  useEffect(() => {
    runR();
    runPython();
  }, [runPython, runR])
  

  return (
    <div className={styles.container()}>
      {/* <h2 className={styles.header()}>Data Visualization</h2>

      <div className={styles.btnGroup()}>
        <button
          className={styles.btn({ variant: 'primary' })}
          onClick={runPython}
        >
          Visualize with Python
        </button>
        <button
          className={styles.btn({ variant: 'secondary' })}
          onClick={runR}
        >
          Visualize with R
        </button>
      </div> */}

      {error && <p className={styles.errorText()}>{error}</p>}

      {pythonImage && (
        <div className=''>
          <h3 className={styles.subheader()}>Python Plot</h3>
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
        <div className=''>
          <h3 className={styles.subheader()}>R Plot</h3>
          <div className={styles.imageWrapper()}>
            <img src={rImage} alt="R visualization" className={styles.image()} />
          </div>
        </div>
      )}
    </div>
  )
}
