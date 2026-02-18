import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  addNewValue = 'add-new',
  addNewLabel = 'Add new…',
  disabled,
  'aria-describedby': ariaDescribedby,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const displayLabel = value === '' ? placeholder : (value === addNewValue ? addNewLabel : value)
  const optionsWithAddNew = [{ value: addNewValue, label: addNewLabel }, ...options.map((o) => ({ value: o, label: o }))]

  return (
    <div ref={containerRef} className="select-wrap">
      {label && (
        <label className="select-label">
          {label}
        </label>
      )}
      <button
        type="button"
        className="select-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={ariaDescribedby}
      >
        <span className={value === '' ? 'select-placeholder' : ''}>{displayLabel}</span>
        <ChevronDown size={18} className={`select-chevron ${open ? 'select-chevron-open' : ''}`} />
      </button>
      {open && (
        <div className="select-menu" role="listbox">
          {optionsWithAddNew.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              className={`select-option ${opt.value === addNewValue ? 'select-option-addnew' : ''} ${value === opt.value ? 'select-option-selected' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
