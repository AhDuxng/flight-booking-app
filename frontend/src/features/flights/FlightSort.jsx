export default function FlightSort({ currentSort, onSortChange }) {
  const SORT_OPTIONS = [
    {
      id: "price-asc",
      label: "Rẻ nhất",
      subtitle: "Từ 950.000đ",
    },
    {
      id: "duration-asc",
      label: "Ngắn nhất",
      subtitle: "2h 05m",
    },
    {
      id: "time-asc",
      label: "Sớm nhất",
      subtitle: "06:00",
    },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-lg p-stack-sm flex flex-wrap gap-base border border-surface-container-highest">
      {SORT_OPTIONS.map((option) => {
        const isActive = currentSort === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSortChange(option.id)}
            className={`flex-1 min-w-[120px] py-2 px-4 rounded text-center font-label-md text-label-md transition-colors border ${
              isActive
                ? "bg-primary-fixed text-on-primary-fixed border-primary font-bold"
                : "text-on-surface border-transparent hover:bg-surface-container"
            }`}
          >
            <span className={isActive ? "block font-bold" : "block"}>
              {option.label}
            </span>
            <span className="block font-body-sm text-body-sm text-on-surface-variant">
              {option.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
