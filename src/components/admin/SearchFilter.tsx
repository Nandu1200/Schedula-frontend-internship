"use client";

import { ChangeEvent } from "react";

type FilterOption = {
  label: string;
  value: string;
};

type SearchFilterProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filterLabel?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
};

export default function SearchFilter({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  filterLabel = "Filter",
  filterValue = "",
  onFilterChange,
  filterOptions = [],
}: SearchFilterProps) {
  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    onSearchChange(event.target.value);
  };

  const handleFilterChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    onFilterChange?.(event.target.value);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>

        <input
          type="search"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {/* Filter */}
      {filterOptions.length > 0 && onFilterChange && (
        <div className="flex items-center gap-2 sm:w-52">
          <label
            htmlFor="admin-filter"
            className="shrink-0 text-sm font-medium text-slate-500"
          >
            {filterLabel}
          </label>

          <select
            id="admin-filter"
            value={filterValue}
            onChange={handleFilterChange}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          >
            {filterOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}