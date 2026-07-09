import { useState, useRef } from "react";
import Input from "@/components/common/Input";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function LocationDropdown({ label, icon: Icon, locations, defaultValue }) {
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
      <Input
        className="h-11"
        icon={Icon}
        label={label}
        placeholder="Tìm hoặc chọn địa điểm"
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setSearchQuery("");
          setIsOpen(true);
        }}
      />
      
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg">
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
