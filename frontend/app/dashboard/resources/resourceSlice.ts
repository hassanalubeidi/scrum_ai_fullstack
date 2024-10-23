import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';

interface Resource {
  id: string; // Ensure each resource has a unique identifier
  name?: string;
  doc_id?: string;
  page_num?: number;
  score?: number;
  base64?: string;
  isSelected?: boolean; // Added property for selection
}

interface ResourceState {
  resources: Resource[];
  uploadStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  searchStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ResourceState = {
  resources: [],
  uploadStatus: 'idle',
  searchStatus: 'idle',
  error: null,
};

export const uploadFile = createAsyncThunk(
  'resources/uploadFile',
  async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/ai/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'File upload failed');
    }

    const data = await response.json();
    return data.success;
  }
);

export const searchResources = createAsyncThunk(
  'resources/searchResources',
  async ({ query, pages }: { query: string; pages: number }) => {
    const response = await fetch(`/ai/api/search?query=${encodeURIComponent(query)}&k=${pages}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Search failed');
    }

    const data = await response.json();

    // Assign unique IDs to resources
    return data.map((resource: Resource, index: number) => ({
      ...resource,
      id: `${resource.doc_id}-${resource.page_num}-${index}`,
    }));
  }
);

const resourceSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    clearResources(state) {
      state.resources = [];
    },
    toggleResourceSelection(state, action: PayloadAction<string>) {
      const resource = state.resources.find((r) => r.id === action.payload);
      if (resource) {
        resource.isSelected = !resource.isSelected;
      }
    },
    clearSelectedResources(state) {
      state.resources.forEach((resource) => {
        resource.isSelected = false;
      });
    },
    selectAllResources: (state) => {
      state.resources = state.resources.map(resource => ({
        ...resource,
        isSelected: true
      }));
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload File
      .addCase(uploadFile.pending, (state) => {
        state.uploadStatus = 'loading';
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state) => {
        state.uploadStatus = 'succeeded';
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.error = action.error.message || 'File upload failed';
      })
      // Search Resources
      .addCase(searchResources.pending, (state) => {
        state.searchStatus = 'loading';
        state.error = null;
      })
      .addCase(searchResources.fulfilled, (state, action: PayloadAction<Resource[]>) => {
        state.searchStatus = 'succeeded';
        state.resources = action.payload;
      })
      .addCase(searchResources.rejected, (state, action) => {
        state.searchStatus = 'failed';
        state.error = action.error.message || 'Search failed';
      });
  },
});

export const { 
  toggleResourceSelection, 
  clearSelectedResources, 
  selectAllResources,  
} = resourceSlice.actions;

export const selectResources = (state: RootState) => state.resources.resources;
export const selectSelectedResources = (state: RootState) =>
  state.resources.resources.filter((resource) => resource.isSelected);
export const selectUploadStatus = (state: RootState) => state.resources.uploadStatus;
export const selectSearchStatus = (state: RootState) => state.resources.searchStatus;
export const selectResourceError = (state: RootState) => state.resources.error;

export default resourceSlice.reducer;
