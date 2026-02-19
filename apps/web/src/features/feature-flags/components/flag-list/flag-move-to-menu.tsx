import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { AnyFlag } from "../../types";

interface FlagMoveToMenuProps {
  candidates: AnyFlag[];
  onSelect: (parentId: string) => void;
}

/**
 * Popover + Command combobox for selecting a parent flag.
 * Shows eligible boolean parent flags as searchable options.
 */
export function FlagMoveToMenu({ candidates, onSelect }: FlagMoveToMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <button className="w-full justify-start text-left cursor-pointer">
          Move to…
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search parents..." />
          <CommandList>
            <CommandEmpty>No parents found.</CommandEmpty>
            <CommandGroup>
              {candidates.map((candidate) => (
                <CommandItem
                  key={candidate.id}
                  value={candidate.id}
                  onSelect={(value) => {
                    onSelect(value);
                    setOpen(false);
                  }}
                >
                  {candidate.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
