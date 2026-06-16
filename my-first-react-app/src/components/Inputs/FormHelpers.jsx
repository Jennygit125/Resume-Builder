export const InputGroup = ({ label, children, className = "", error }) => (
  <div className={`input-group ${className}`}>
    {label && <label className="input-label">{label}</label>}
    {children}
    {error && <span className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-classy-fade">{error}</span>}
  </div>
);

export const InputGrid = ({ children, className = "" }) => (
  <div className={`input-grid ${className}`}>
    {children}
  </div>
);

export const DynamicListSection = ({ title, onAdd, addLabel, items, onRemove, renderItem, emptyMessage }) => (
  <section>
    <div className="section-header-row">
      <h3 className="section-label !mb-0">{title}</h3>
      <button type="button" onClick={onAdd} className="add-button">
        {addLabel}
      </button>
    </div>
    
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={index} className="dynamic-item-card group">
          <button type="button" onClick={() => onRemove(index)} className="item-remove-btn">×</button>
          {renderItem(item, index)}
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-center py-4 text-xs text-gray-400 italic">{emptyMessage}</p>
      )}
    </div>
  </section>
);