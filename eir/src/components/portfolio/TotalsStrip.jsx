import { Zap, Flame, Droplets, Recycle, Cloud } from 'lucide-react'
import { formatValue } from '../../lib/mapThemes.js'

/**
 * TotalsStrip - compact 5-metric portfolio row below the map.
 * Reads portfolio.json. Display-only.
 *
 *   ⚡ 8.3M kWh elec
 *   🔥 9.4M kWh gas
 *   💧 18k m³
 *   ♻️ 145 t
 *   ☁️ 2.6k tCO₂e
 */

const Item = ({ icon: Icon, value, unit, label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRight: '1px solid var(--rule-on-dark)',
      flex: '1 1 0',
      minWidth: 0,
    }}
  >
    <Icon size={18} strokeWidth={1.5} color="var(--color-nza-coral)" />
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-theme-body)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}{unit && <span style={{ marginLeft: 3, fontSize: 11, color: 'var(--text-muted-on-dark)' }}>{unit}</span>}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'var(--text-muted-on-dark)',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          marginTop: 1,
        }}
      >
        {label}
      </span>
    </div>
  </div>
)

export default function TotalsStrip({ portfolio }) {
  const elec = portfolio?.energy?.total_electricity_kwh
  const gas = portfolio?.energy?.total_gas_kwh
  const water = portfolio?.water?.total_consumption_m3
  const waste = portfolio?.waste?.total_tonnage
  const co2 = portfolio?.energy?.total_emissions_actual_tco2e

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--rule-on-dark)',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 16,
      }}
    >
      <Item icon={Zap}      value={formatValue(elec, 'kwh')}    unit="kWh" label="Electricity" />
      <Item icon={Flame}    value={formatValue(gas, 'kwh')}     unit="kWh" label="Gas" />
      <Item icon={Droplets} value={formatValue(water, 'm3')}    unit="m³"  label="Water" />
      <Item icon={Recycle}  value={formatValue(waste, 'tonnes')} unit="t"  label="Waste" />
      <Item icon={Cloud}    value={formatValue(co2, 'tco2e')}   unit="tCO₂e" label="Carbon" />
    </div>
  )
}
