/** A labelled bar for `done / total`. */
export default function ProgressBar({ label, done, total }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="progress">
      <div className="progress-text">
        <span>{label}</span>
        <span>
          {done} / {total}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total}`}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
