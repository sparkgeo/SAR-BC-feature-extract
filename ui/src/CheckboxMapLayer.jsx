function CheckboxMapLayer({ label, checked, handleSelect }) {
  return (
    <div className="flex flex-row" key={label}>
      <input
        type="checkbox"
        name=""
        id="layer1"
        className="mr-2"
        checked={checked}
        onChange={handleSelect}
      />
      <label htmlFor="layer1">{label}</label>
    </div>
  );
}

export default CheckboxMapLayer;
