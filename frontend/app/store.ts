import { configureStore } from '@reduxjs/toolkit'
import assistantReducer from './dashboard/assistant/assistantSlice'
import resourceReducer from './dashboard/resources/resourceSlice'

export const store = configureStore({
  reducer: {
    assistant: assistantReducer,
    resources: resourceReducer,
  },
})

export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
