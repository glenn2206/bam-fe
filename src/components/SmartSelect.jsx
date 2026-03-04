import React from 'react';

const SmartSelect = ({ value, options = [], onChange, disabled = false, placeholder = "-- PILIH --" }) => {
  
  const handleChange = (e) => {
    const val = e.target.value;
    
    // Pemicu popup: Jika pilih LAINNYA, mengandung "...", atau pemicu input kosong
    if (val === "LAINNYA" || val.includes("...")) {
      const label = val;
      const userInput = window.prompt(`Masukkan ${label} secara manual:`);
      
      if (userInput) {
        const finalValue = val.includes("...") 
          ? val.replace("...", userInput) 
          : userInput;
        onChange(finalValue);
      }
    } else {
      onChange(val);
    }
  };

  return (
    <select 
      className={`w-full p-1 outline-none font-bold ${disabled ? 'bg-gray-50 opacity-50' : 'text-blue-600 bg-transparent cursor-pointer'}`}
      value={value}
      onChange={handleChange}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      
      {/* 1. Jika ada opsi di DB, render semuanya */}
      {options.map((opt) => (
          <option key={opt} value={opt} className={opt === "LAINNYA" ? "text-red-500 font-bold" : ""}>
            {opt === "LAINNYA" ? "+ LAINNYA" : opt}
          </option>
      ))}

      {/* 3. Opsi Bayangan (Agar hasil input manual tetap tampil) */}
      {value && !options.includes(value) && (
        <option value={value}>{value}</option>
      )}
    </select>
  );
};

export default SmartSelect;