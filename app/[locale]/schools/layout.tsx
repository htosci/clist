// Загружаем CSS MapLibre только для маршрутов /schools/**,
// чтобы не включать его в глобальный root layout.
import "maplibre-gl/dist/maplibre-gl.css"

export default function SchoolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
