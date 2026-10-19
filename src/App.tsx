import { GlassCard } from './components/GlassCard'

export default function App() {
  return (
    <>
      <div className="halo-wallpaper" aria-hidden="true" />
      <main style={{ padding: 24 }}>
        <GlassCard padding="lg">
          <h1>Halo</h1>
          <p>Your digital world, beautifully unified.</p>
        </GlassCard>
      </main>
    </>
  )
}
