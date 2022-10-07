function CheckboxMapLayer({ label, checked, handleSelect }) {
  return (
    <div className="flex flex-row" key={label}>
      <input
        type="checkbox"
        name=""
        id={`layer-${label.split(" ").join("-")}`}
        className="mr-2"
        checked={checked}
        onChange={handleSelect}
      />
      <label htmlFor={`layer-${label.split(" ").join("-")}`}>{label}</label>
    </div>
  );
}

export default CheckboxMapLayer;
