import { useEffect, useRef, useState } from "react";
import Input from "@/components/common/Input";
import { useClickOutside } from "@/hooks/useClickOutside";

const getLocationLabel = (location) =>
  location ? `${location.code} - ${location.name}` : "";

export default function LocationDropdown({ label, icon: Icon, locations, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(getLocationLabel(value));
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchQuery(getLocationLabel(value));
  }, [value]);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setSearchQuery(getLocationLabel(value));
  });

  const filteredLocations = locations.filter((location) => {
    const query = searchQuery.toLowerCase();
    const searchable = `${location.code} ${location.name} ${location.city ?? ""}`.toLowerCase();
    return searchable.includes(query);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <Input
        className="h-11"
        icon={Icon}
        label={label}
        placeholder="Tìm hoặc chọn sân bay"
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
            filteredLocations.map((location) => (
              <button
                key={location.id}
                className="w-full px-4 py-2 text-left text-body-md text-on-surface transition-colors hover:bg-surface-variant"
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(location);
                  setIsOpen(false);
                }}
              >
                <span className="font-bold">{location.code}</span> - {location.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-body-md italic text-on-surface-variant">
              Không tìm thấy sân bay
            </div>
          )}
        </div>
      )}
    </div>
  );
}
