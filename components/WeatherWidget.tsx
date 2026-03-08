import type { Weather } from '@/lib/types'
import { Thermometer, Droplets, Wind, CloudRain, Gauge } from 'lucide-react'

interface WeatherWidgetProps {
  weather: Weather | undefined
}

export default function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80 mb-3">Weather</h3>
        <p className="text-f1-muted text-sm">Awaiting weather data...</p>
      </div>
    )
  }

  const items = [
    { icon: Thermometer, label: 'Air Temp', value: `${weather.air_temperature}\u00B0C`, color: 'text-orange-400' },
    { icon: Thermometer, label: 'Track', value: `${weather.track_temperature}\u00B0C`, color: 'text-red-400' },
    { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%`, color: 'text-blue-400' },
    { icon: Wind, label: 'Wind', value: `${weather.wind_speed} m/s`, color: 'text-cyan-400' },
    { icon: CloudRain, label: 'Rain', value: weather.rainfall ? 'Yes' : 'No', color: weather.rainfall ? 'text-blue-500' : 'text-emerald-400' },
    { icon: Gauge, label: 'Pressure', value: `${weather.pressure}`, color: 'text-purple-400' },
  ]

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
          Track Weather
        </h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2.5">
        {items.map(item => (
          <div key={item.label} className="bg-f1-dark/60 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <item.icon size={13} className={item.color} />
              <span className="text-[10px] text-f1-muted uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="font-mono font-bold text-lg text-white leading-tight">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
