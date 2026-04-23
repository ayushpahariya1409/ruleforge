import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  previewData: null,
  fileName: null,
  fileSize: null,
  fileType: null,
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
    },
    clearUploadPreview: (state) => {
      state.previewData = null;
      state.fileName = null;
    },
  },
});

export const { setUploadPreview, clearUploadPreview } = uploadSlice.actions;
export default uploadSlice.reducer;
