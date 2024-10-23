import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/app/store';
import { Command } from 'lucide-react';

export interface CommandOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  handler: (query: string) => Promise<void>;
}

interface CommandState {
  isCommandPaletteOpen: boolean;
  selectedCommandIndex: number;
  commandPosition: { top: number; left: number };
  availableCommands: CommandOption[];
  searchTerm: string;
}

const initialState: CommandState = {
  isCommandPaletteOpen: false,
  selectedCommandIndex: 0,
  commandPosition: { top: 0, left: 0 },
  availableCommands: [
    {
      id: "document",
      name: "@document",
      description: 'Search through documents. Use "@document "query"" to search.',
      icon: <Command className="h-4 w-4" />,
      handler: async () => {} // Will be initialized in the component
    }
  ],
  searchTerm: ''
};

export const commandSlice = createSlice({
  name: 'command',
  initialState,
  reducers: {
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.isCommandPaletteOpen = action.payload;
    },
    setSelectedCommandIndex: (state, action: PayloadAction<number>) => {
      state.selectedCommandIndex = action.payload;
    },
    setCommandPosition: (state, action: PayloadAction<{ top: number; left: number }>) => {
      state.commandPosition = action.payload;
    },
    registerCommandHandler: (state, action: PayloadAction<{ id: string; handler: CommandOption['handler'] }>) => {
      const command = state.availableCommands.find(cmd => cmd.id === action.payload.id);
      if (command) {
        command.handler = action.payload.handler;
      }
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    }
  }
});

export const {
  setCommandPaletteOpen,
  setSelectedCommandIndex,
  setCommandPosition,
  registerCommandHandler,
  setSearchTerm
} = commandSlice.actions;

export const selectCommandPaletteState = (state: RootState) => ({
  isOpen: state.command.isCommandPaletteOpen,
  position: state.command.commandPosition,
  selectedIndex: state.command.selectedCommandIndex,
  commands: state.command.availableCommands,
  searchTerm: state.command.searchTerm
});

export default commandSlice.reducer;
