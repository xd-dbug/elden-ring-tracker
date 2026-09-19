import { useState } from 'react'

/** Boss image, or a lettered placeholder when there's no image or it fails to load. */
export default function BossImage({ boss, className = 'boss-img', loading = 'lazy' }) {
  const [failed, setFailed] = useState(false)
  if (!boss.image || failed) {
    return (
      <div className={`${className} placeholder`} aria-hidden="true">
        {boss.name.charAt(0)}
      </div>
    )
  }
  return (
    <img
      className={className}
      src={boss.image}
      alt=""
      loading={loading}
      onError={() => setFailed(true)}
    />
  )
}
