import React, { useState, useEffect, useRef } from 'react';

const PerPageControl = ({ pageSize, onPageSizeChange, max = 100, label = "Rows per page:" }) => {
  const [inputVal, setInputVal] = useState(String(pageSize));
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  const [prevPageSize, setPrevPageSize] = useState(pageSize);
  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize);
    if (!editing) setInputVal(String(pageSize));
  }

  const handleCommit = () => {
    const num = parseInt(inputVal, 10);
    if (!isNaN(num) && num >= 1 && num <= max) {
      onPageSizeChange(num);
    } else {
      setInputVal(String(pageSize));
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCommit();
    if (e.key === 'Escape') {
      setInputVal(String(pageSize));
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs whitespace-nowrap px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-600 transition-all duration-200 shadow-sm hover:shadow-md">
      <span className="font-medium text-gray-500">{label}</span>
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={max}
        value={inputVal}
        onChange={(e) => { setEditing(true); setInputVal(e.target.value); }}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        onFocus={() => { setEditing(true); inputRef.current?.select(); }}
        className="w-12 text-center rounded-lg px-1 py-1 font-bold text-xs focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 shadow-sm bg-white border-gray-200 text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
      />
      <span className="text-gray-400 text-[10px] font-bold">(max {max})</span>
    </div>
  );
};

export default PerPageControl;
