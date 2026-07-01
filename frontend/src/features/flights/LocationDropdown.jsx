import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function LocationDropdown({ label, icon, locations, defaultValue }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const [searchQuery, setSearchQuery] = useState(
    defaultValue ? `${defaultValue.code} - ${defaultValue.name}` : ""
  );
  
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    if (selected) {
      setSearchQuery(`${selected.code} - ${selected.name}`);
    } else {
      setSearchQuery("");
    }
  });

  const filteredLocations = locations.filter((loc) => {
    const query = searchQuery.toLowerCase();
    return (
      loc.code.toLowerCase().includes(query) || 
      loc.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-label-md font-label-md text-on-surface-variant mb-base">
        {label}
      </label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline z-10 pointer-events-none">
          {icon}
        </span>
        <Input
          className="w-full pl-10 pr-3 py-2 text-body-md font-body-md text-on-surface focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          placeholder="Tìm hoặc chọn địa điểm"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setSearchQuery("");
            setIsOpen(true);
          }}
        />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <div
                key={loc.code}
                className="px-4 py-2 hover:bg-surface-variant cursor-pointer text-body-md text-on-surface transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelected(loc);
                  setSearchQuery(`${loc.code} - ${loc.name}`);
                  setIsOpen(false);
                }}
              >
                <span className="font-bold">{loc.code}</span> - {loc.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-body-md text-on-surface-variant italic text-center">
              Không tìm thấy sân bay
            </div>
          )}
        </div>
      )}
    </div>
  );
}
