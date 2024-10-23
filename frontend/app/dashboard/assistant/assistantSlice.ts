import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../store'; // Adjust the import path as needed

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  hasImages?: boolean;
  isStreaming?: boolean;
}

interface AssistantState {
  messages: Message[];
  isProcessing: boolean;
  contextImages: { id: string; base64: string }[];
  errorMessage: string;
  input: string;
  selectedImage: string | null;
  isSearching: boolean;
}

const initialState: AssistantState = {
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant that can answer questions and help with tasks.',
    },
  ],
  isProcessing: false,
  contextImages: [],
  errorMessage: '',
  input: '',
  selectedImage: null,
  isSearching: false,
}

interface SendMessagePayload {
  message: string;
  images?: string[];
}

export const sendMessage = createAsyncThunk(
  'assistant/sendMessage',
  async ({ message, images = [] }: SendMessagePayload, { dispatch, getState }) => {
    const state = getState() as RootState;
    const messages = state.assistant.messages;
    const contextImages = state.assistant.contextImages.map(img => img.base64);
    const allImages = [...images, ...contextImages];

    const userMessageContent = [
      { type: "text", text: message },
      ...allImages.map(img => ({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${img}` }
      }))
    ];

    const conversation = [...messages, { 
      role: 'user', 
      content: userMessageContent,
      hasImages: allImages.length > 0 
    }];

    // Add empty assistant message that will be streamed into
    dispatch(addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
        body: JSON.stringify({ messages: conversation }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let isStreaming = true;

      while (isStreaming) {
        const { done, value } = await reader!.read();
        if (done) break;

        // Decode the current chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          console.log(line);
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            if (data === '[DONE]') {
              isStreaming = false;
              break;
            }

            // Check for errors
            if (data.startsWith('{"error":')) {
              const errorData = JSON.parse(data);
              throw new Error(errorData.error);
            }

            // Dispatch token to update the streaming message
            dispatch(updateStreamingMessage(data));
          }
        }
      }

      // Mark streaming as complete
      dispatch(finishStreamingMessage());

      return { success: true };
    } catch (error: unknown) {
      dispatch(setErrorMessage(
        error instanceof Error ? error.message : 'An unknown error occurred'
      ));
      throw error;
    }
  }
);

export const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      console.log("action.payload", action.payload);
      state.messages.push({
        ...action.payload,
        hasImages: Array.isArray(action.payload.content) && 
          action.payload.content.some(c => c.type === 'image_url')
      });
    },
    updateStreamingMessage: (state, action: PayloadAction<string>) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        if (typeof lastMessage.content === 'string') {
          lastMessage.content += action.payload;
        }
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateContextImages: (state, action: PayloadAction<{ id: string; base64: string }[]>) => {
      state.contextImages = action.payload;
    },
    clearContextImages: (state) => {
      state.contextImages = [];
    },
    finishStreamingMessage: (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage) {
        lastMessage.isStreaming = false;
      }
    },
    setErrorMessage: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload;
    },
    setInput: (state, action: PayloadAction<string>) => {
      state.input = action.payload;
    },
    setSelectedImage: (state, action: PayloadAction<string | null>) => {
      state.selectedImage = action.payload;
    },
    setIsSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.isProcessing = false;
        // Remove streaming flag from last message
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage) {
          lastMessage.isStreaming = false;
        }
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isProcessing = false;
        state.messages.push({
          role: 'assistant',
          content: 'An error occurred while processing your message. Please try again later.',
        });
      });
  },
});

// Action creators are generated for each case reducer function
export const { 
  addMessage, 
  clearMessages, 
  updateContextImages, 
  clearContextImages,
  updateStreamingMessage,
  finishStreamingMessage,
  setErrorMessage,
  setInput,
  setSelectedImage,
  setIsSearching 
} = assistantSlice.actions

export const selectMessages = (state: RootState) => state.assistant.messages;
export const selectIsProcessing = (state: RootState) => state.assistant.isProcessing;
export const selectContextImages = (state: RootState) => state.assistant.contextImages;
export const selectInput = (state: RootState) => state.assistant.input;
export const selectSelectedImage = (state: RootState) => state.assistant.selectedImage;
export const selectIsSearching = (state: RootState) => state.assistant.isSearching;

export default assistantSlice.reducer
