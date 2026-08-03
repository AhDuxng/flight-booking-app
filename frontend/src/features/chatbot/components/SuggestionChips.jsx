import { suggestions } from "../chatbotData";

export default function SuggestionChips({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {suggestions.map((suggestion) => (
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-4 py-2 text-left text-body-sm font-medium text-primary transition-colors hover:border-primary-fixed-dim hover:bg-primary-fixed"
          key={suggestion.label}
          onClick={() => onSelect(suggestion.label)}
          type="button"
        >
          <suggestion.icon className="h-4 w-4 shrink-0" />
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
