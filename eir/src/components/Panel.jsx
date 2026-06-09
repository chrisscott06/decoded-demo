/**
 * Panel - content container with subtle background lift + border.
 *
 * Props:
 *   title?: optional Playfair h3 title
 *   subtitle?: optional small caption under the title
 *   scroll?: if true, content area is scrollable (overflow-y: auto)
 *   pad?: 'normal' | 'tight' | 'none'
 *   theme?: 'dark' (default) | 'cream'
 *   className?: extra classes
 *   actions?: ReactNode rendered top-right in the header
 *   fullHeight?: if true, panel takes 100% of parent
 */
export default function Panel({
  title, subtitle, scroll = false, pad = 'normal',
  theme = 'dark', className = '', actions = null, fullHeight = false, children,
}) {
  return (
    <div
      className={[
        'panel',
        `panel-${theme}`,
        `panel-pad-${pad}`,
        fullHeight ? 'panel-fullheight' : '',
        scroll ? 'panel-scroll' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {(title || actions) && (
        <div className="panel-header">
          <div>
            {title && <h3 className="panel-title">{title}</h3>}
            {subtitle && <div className="panel-subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </div>
      )}
      <div className="panel-body">
        {children}
      </div>
    </div>
  )
}
