import { Link } from 'react-router-dom'
import BossImage from './BossImage.jsx'

/**
 * One boss in the list: image, name, region, and defeated / favorite / add-to-run controls.
 * `role` comes from getBossRoles; fixed-required bosses are always in the run, so they get no "+".
 */
export default function BossRow({ boss, role, defeated, favorite, inRun, backTo, dispatch }) {
  const { slug, name } = boss
  const tag = role?.fixed ? 'Required' : role?.groups[0]?.short

  return (
    <li className={`boss-row${defeated ? ' is-defeated' : ''}`}>
      <BossImage key={boss.image} boss={boss} />
      <Link className="boss-row-main" to={`/bosses/${slug}`} state={{ backTo }}>
        <span className="boss-name">{name}</span>
        <span className="boss-meta">
          {boss.region ?? 'Unknown region'}
          {tag && <span className="tag">{tag}</span>}
        </span>
      </Link>
      <label className="icon-btn">
        <input
          type="checkbox"
          checked={defeated}
          onChange={() => dispatch({ type: 'toggleDefeated', slug })}
          aria-label={`Defeated: ${name}`}
        />
      </label>
      <button
        type="button"
        className="icon-btn star"
        aria-pressed={favorite}
        aria-label={`Favorite ${name}`}
        onClick={() => dispatch({ type: 'toggleFavorite', slug })}
      >
        {favorite ? '★' : '☆'}
      </button>
      {role?.fixed ? (
        <span className="icon-btn" aria-hidden="true" />
      ) : (
        <button
          type="button"
          className="icon-btn add"
          aria-pressed={inRun}
          aria-label={`Add ${name} to run`}
          onClick={() => dispatch({ type: 'toggleExtra', slug })}
        >
          {inRun ? '−' : '+'}
        </button>
      )}
    </li>
  )
}
