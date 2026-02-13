export default function Card({ children, className = '', onClick, as: As = 'div', ...props }) {
  const Comp = As
  return (
    <Comp
      className={`card ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </Comp>
  )
}
