"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Plus, UserCheck } from "lucide-react";

export interface DomainLeadOption {
  id: string;
  name: string;
  active?: boolean;
}

interface SearchableDomainLeadSelectProps {
  domainLeads: DomainLeadOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onAddNew?: () => void;
  allowClear?: boolean;
  className?: string;
}

export function SearchableDomainLeadSelect({
  domainLeads,
  value,
  onChange,
  placeholder = "Search or select Domain Lead...",
  required = false,
  disabled = false,
  onAddNew,
  allowClear = false,
  className = "",
}: SearchableDomainLeadSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLead = useMemo(
    () => domainLeads.find((lead) => lead.id === value),
    [domainLeads, value]
  );

  const filteredLeads = useMemo(() => {
    if (!query.trim()) return domainLeads;
    const lower = query.toLowerCase().trim();
    return domainLeads.filter((lead) => lead.name.toLowerCase().includes(lower));
  }, [domainLeads, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setHighlightedIndex(
        filteredLeads.findIndex((lead) => lead.id === value) >= 0
          ? filteredLeads.findIndex((lead) => lead.id === value)
          : 0
      );
    }
  }, [isOpen]);

  const handleSelect = (leadId: string) => {
    onChange(leadId);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredLeads.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredLeads.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredLeads.length) {
        handleSelect(filteredLeads[highlightedIndex].id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Main trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-left transition-all ${
          isOpen
            ? "border-hgv-teal ring-2 ring-hgv-teal/30 bg-white"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className={`truncate font-medium ${
              selectedLead ? "text-slate-800 font-semibold" : "text-slate-400"
            }`}
          >
            {selectedLead ? selectedLead.name : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {allowClear && selectedLead && !disabled && (
            <span
              onClick={handleClear}
              title="Clear selection"
              className="hover:text-rose-500 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180 text-hgv-teal" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to filter Domain Leads..."
                className="w-full pl-7 pr-7 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-hgv-teal focus:border-hgv-teal"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-slate-400">
              <span>{filteredLeads.length} leads found</span>
              {onAddNew && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onAddNew();
                  }}
                  className="text-hgv-teal hover:underline font-semibold flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" /> Add New
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between text-slate-500 hover:bg-slate-50 transition-colors ${
                  !value ? "bg-slate-50 font-semibold text-hgv-teal" : ""
                }`}
              >
                <span>All Domain Leads</span>
                {!value && <Check className="w-3.5 h-3.5 text-hgv-teal" />}
              </button>
            )}

            {filteredLeads.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-slate-500 font-medium">No Domain Leads match &quot;{query}&quot;</p>
                {onAddNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNew();
                    }}
                    className="mt-2 text-xs text-hgv-teal font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add &quot;{query}&quot; as New Domain Lead
                  </button>
                )}
              </div>
            ) : (
              filteredLeads.map((lead, idx) => {
                const isSelected = lead.id === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => handleSelect(lead.id)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-hgv-teal/10 font-bold text-hgv-teal"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{lead.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-hgv-teal shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
