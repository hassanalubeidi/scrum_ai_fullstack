import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../store'; // Adjust the import path as needed

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AssistantState {
  messages: Message[];
  isProcessing: boolean;
  contextImages: { id: string; base64: string }[];
}

const initialState: AssistantState = {
  messages: [{
    role: 'system',
    content: 'You are a helpful assistant that can answer questions and help with tasks.',
  }, {
    role: 'user',
    content: 'What is the weather in Tokyo?',
  }, {
    role: 'assistant',
    content: 'The weather in Tokyo is currently sunny with a temperature of 25 degrees Celsius.',
  }],
  isProcessing: false,
  contextImages: [],
}

interface SendMessagePayload {
  message: string;
  images?: string[];
}

export const sendMessage = createAsyncThunk(
  'assistant/sendMessage',
  async ({ message, images = [] }: SendMessagePayload, { getState }) => {
    const state = getState() as RootState;
    const contextImages = state.assistant.contextImages.map(img => img.base64);

    // Combine user-provided images with context images
    const allImages = [...images, ...contextImages];

    const response = await fetch('/ai/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, images: allImages }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return { userMessage: message, aiResponse: data.response };
  }
);

export const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateLastMessage: (state, action: PayloadAction<Message>) => {
      if (state.messages.length > 0) {
        state.messages[state.messages.length - 1] = action.payload;
      }
    },
    addImageToContext: (state, action: PayloadAction<{ id: string; base64: string }>) => {
      state.contextImages.push(action.payload);
    },
    removeImageFromContext: (state, action: PayloadAction<string>) => {
      state.contextImages = state.contextImages.filter(img => img.id !== action.payload);
    },
    addImagesToContext: (state, action: PayloadAction<{ id: string; base64: string }[]>) => {
      state.contextImages = [...state.contextImages, ...action.payload];
    },
    updateContextImages: (state, action: PayloadAction<{ id: string; base64: string }[]>) => {
      const newContextImages = action.payload;
      // Remove images that are no longer selected
      state.contextImages = state.contextImages.filter(img => 
        newContextImages.some(newImg => newImg.id === img.id)
      );
      // Add new images that aren't already in the context
      newContextImages.forEach(newImg => {
        if (!state.contextImages.some(img => img.id === newImg.id)) {
          state.contextImages.push(newImg);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.messages.push({
          role: 'user',
          content: action.payload.userMessage,
        });
        state.messages.push({
          role: 'assistant',
          content: action.payload.aiResponse,
        });
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isProcessing = false;
        state.messages.push({
          role: 'assistant',
          content: 'An error occurred while processing your message. Please try again later.',
        });
      });
  },
})

// Action creators are generated for each case reducer function
export const { addMessage, clearMessages, updateLastMessage, updateContextImages } = assistantSlice.actions

export const selectMessages = (state: RootState) => state.assistant.messages;
export const selectIsProcessing = (state: RootState) => state.assistant.isProcessing;
export const selectContextImages = (state: RootState) => state.assistant.contextImages;

export default assistantSlice.reducer
