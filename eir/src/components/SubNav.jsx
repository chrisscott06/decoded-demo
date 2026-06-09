/**
 * SubNav - horizontal strip of tabs below the top nav.
 *
 * Props:
 *   items: array of { key, label, path }
 *   activeKey: which item is currently active
 *   navigate: (path) => void
 *   theme?: 'dark' (default) | 'cream'
 *   right?: optional ReactNode rendered on the right side (e.g. toggle buttons)
 */
export default function SubNav({ items, activeKey, navigate, theme = 'dark', right = null }) {
  return (
    <div className={`subnav subnav-${theme}`}>
      <div className="subnav-inner">
        <div className="subnav-tabs">
          {items.map((item) => (
            <a
              key={item.key}
              href={item.path}
              onClick={(e) => { e.preventDefault(); navigate(item.path) }}
              className={`subnav-tab ${activeKey === item.key ? 'active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </div>
        {right && <div className="subnav-right">{right}</div>}
      </div>
    </div>
  )
}
