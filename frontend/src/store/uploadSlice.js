import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  previewData: null,
  fileName: null,
  fileSize: null,
  fileType: null,
  sessionId: null, // new backend: rows stored server-side in TempUpload
  allRows: null,   // old backend fallback: rows stored in Redux
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
      state.allRows = action.payload.allRows ?? null;
    },
    clearUploadPreview: (state) => {
      state.previewData = null;
      state.fileName = null;
      state.sessionId = null;
      state.allRows = null;
    },
  },
});

export const { setUploadPreview, clearUploadPreview } = uploadSlice.actions;
export default uploadSlice.reducer;

