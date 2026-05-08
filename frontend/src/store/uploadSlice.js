import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  previewData: null,
  fileName: null,
  fileSize: null,
  fileType: null,
  sessionId: null, // server-side session ID — rows stored in TempUpload on backend
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadPreview: (state, action) => {
      state.previewData = action.payload.previewData;
      state.fileName = action.payload.fileName;
      state.fileSize = action.payload.fileSize;
      state.fileType = action.payload.fileType;
      state.sessionId = action.payload.sessionId ?? null;
    },
    clearUploadPreview: (state) => {
      state.previewData = null;
      state.fileName = null;
      state.sessionId = null;
    },
  },
});

export const { setUploadPreview, clearUploadPreview } = uploadSlice.actions;
export default uploadSlice.reducer;

