import { Command } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface CommandOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  handler: (query: string) => Promise<void>;
}

interface CommandPaletteProps {
  isOpen: boolean;
  searchTerm: string;
  onSelect: (command: CommandOption) => void;
  position: { top: number; left: number };
}

const commands: CommandOption[] = [
  {
    id: "document",
    name: "@document",
    description: 'Search through documents. Use "@document "query"" to search.',
    icon: <Command className="h-4 w-4" />,
    handler: async (query: string) => {
      console.log(`Searching documents with query: ${query}`);
    }
  },
];

export function CommandPalette({ isOpen, searchTerm = '', onSelect, position }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search term (with null check)
  const filteredCommands = commands.filter((command) =>
    command.name.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onSelect]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 transition-opacity duration-200 ease-in-out bottom-full mb-2"
      style={{ maxHeight: '200px', overflow: 'auto' }}
    >
      <div className="p-2">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
          Commands
        </div>
        {filteredCommands.map((command, index) => (
          <div
            key={command.id}
            className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer ${
              index === selectedIndex
                ? "bg-blue-100 dark:bg-blue-800"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => onSelect(command)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="mr-2 text-gray-500 dark:text-gray-400">
              {command.icon}
            </div>
            <div>
              <div className="font-medium">{command.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {command.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
