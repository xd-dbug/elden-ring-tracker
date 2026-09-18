import { useParams } from 'react-router-dom'

export default function BossDetail() {
  const { slug } = useParams()
  return (
    <section className="page">
      <h1>{slug}</h1>
      <p className="muted">Boss details arrive in milestone 5.</p>
    </section>
  )
}
