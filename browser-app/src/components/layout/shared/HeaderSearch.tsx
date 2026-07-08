import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { searchApi } from "../../../api/services/searchApi";
import type { SearchResponse } from "../../../api/contracts/search";

export function HeaderSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keydown event to focus input on Ctrl/Cmd + K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced API Search
  useEffect(() => {
    const delay = searchTerm.trim() ? 250 : 0;

    const delayDebounce = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setResults(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await searchApi.search(searchTerm);
        setResults(response);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Flatten results for keyboard navigation
  const flatItems = useMemo(() => {
    if (!results) return [];
    const items: Array<{
      type: "project" | "issue" | "file";
      id: string;
      title: string;
      subtitle?: string;
      path: string;
      tag?: string;
    }> = [];

    // Projects
    results.projects.forEach((p) => {
      items.push({
        type: "project",
        id: p.id,
        title: p.projectName,
        subtitle: p.description || "No description",
        path: `/projects/${p.id}/overview`,
        tag: "Project",
      });
    });

    // Issues
    results.issues.forEach((i) => {
      items.push({
        type: "issue",
        id: i.id,
        title: i.issueName,
        subtitle: `Project: ${i.projectName} • Status: ${i.status || "TODO"}`,
        path: `/issues/${i.id}`,
        tag: i.issueType,
      });
    });

    // Files
    results.files.forEach((f) => {
      items.push({
        type: "file",
        id: f.id,
        title: f.originalName,
        subtitle: f.projectName ? `Project: ${f.projectName}` : undefined,
        path: f.projectId ? `/projects/${f.projectId}/files` : "#",
        tag: "File",
      });
    });

    return items;
  }, [results]);

  // Scroll active item into view inside dropdown
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle keys while input is focused
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
        e.preventDefault();
      }
    } else if (e.key === "ArrowUp") {
      if (flatItems.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + flatItems.length) % flatItems.length,
        );
        e.preventDefault();
      }
    } else if (e.key === "Enter") {
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        const selected = flatItems[selectedIndex];
        handleSelect(selected);
        e.preventDefault();
      }
    }
  };

  const handleSelect = (item: (typeof flatItems)[0]) => {
    if (item.type === "issue" && results) {
      const originalIssue = results.issues.find((i) => i.id === item.id);
      if (originalIssue) {
        navigate(item.path, {
          state: {
            from: {
              label: originalIssue.projectName,
              path: `/projects/${originalIssue.projectId}/board`,
            },
          },
        });
        setIsOpen(false);
        setSearchTerm("");
        return;
      }
    } else if (item.type === "file" && results) {
      const originalFile = results.files.find((f) => f.id === item.id);
      if (originalFile && originalFile.issueId) {
        navigate(item.path, {
          state: {
            folderUuid: originalFile.issueId,
          },
        });
        setIsOpen(false);
        setSearchTerm("");
        return;
      }
    }
    navigate(item.path);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="bg-gray-200 pl-10 pr-4 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 w-60 text-xs font-normal text-gray-700"
        />
      </div>

      {/* Dropdown Overlay */}
      {isOpen && (searchTerm.trim() || loading) && (
        <div
          ref={listRef}
          className="absolute flex flex-col w-xl max-h-96 top-full left-1/2 -translate-x-1/2 mt-2 shadow-sm bg-white rounded-md border border-gray-200 overflow-y-auto z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px]">Searching...</span>
            </div>
          ) : flatItems.length > 0 ? (
            <div className="space-y-0.5">
              {flatItems.map((item, index) => {
                const isActive = index === selectedIndex;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    data-active={isActive}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-950"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {/* Icon matching Type */}
                    <div
                      className={`p-1.5 rounded-md shrink-0 ${
                        isActive
                          ? "bg-gray-200 text-gray-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.type === "project" && (
                        <FolderOpenIcon className="w-3.75 h-3.75" />
                      )}
                      {item.type === "issue" && (
                        <DocumentTextIcon className="w-3.75 h-3.75" />
                      )}
                      {item.type === "file" && (
                        <InboxIcon className="w-3.75 h-3.75" />
                      )}
                    </div>

                    {/* Content text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="font-medium text-[13px] truncate leading-none">
                          {item.title}
                        </span>
                        
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] text-gray-400 truncate mt-0.5 leading-none">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-400 text-xs">
              No results found for "
              <span className="font-semibold">{searchTerm}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
