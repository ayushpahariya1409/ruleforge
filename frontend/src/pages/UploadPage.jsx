import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRight, HiOutlineChartBarSquare, HiPlay, HiCheckCircle,
  HiOutlineTableCells, HiOutlineDocumentText, HiOutlineArrowDownTray,
  HiOutlineCloudArrowUp,
} from 'react-icons/hi2';
import * as XLSX from 'xlsx';
import FileDropzone from '../components/upload/FileDropzone';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import { uploadApi } from '../api/uploadApi';
import { evaluationApi } from '../api/evaluationApi';
import { schemaApi } from '../api/schemaApi';
import { useRules } from '../hooks/useRules';
import { useDispatch, useSelector } from 'react-redux';
import { setUploadPreview, clearUploadPreview } from '../store/uploadSlice';
import toast from 'react-hot-toast';
import Reveal from '../components/shared/Reveal';



const UploadPage = () => {
  const { previewData, fileName, fileSize, sessionId, allRows } = useSelector((state) => state.upload);
  const dispatch = useDispatch();

  const [uploading, setUploading] = useState(false);   // background server upload
  const [evaluating, setEvaluating] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const navigate = useNavigate();

  const { data: rulesData } = useRules();

  /**
   * Parse first 10 rows from the file on the client side using SheetJS.
   * This is near-instant (~50ms) even for 100k row files.
   */
  const parsePreviewClientSide = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          // sheetRows: 11 = 1 header + 10 data rows — blazing fast
          const workbook = XLSX.read(data, { type: 'array', sheetRows: 11 });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          // Get total row count from ref without loading all data
          const ref = sheet['!ref'] || 'A1:A1';
          const lastRowMatch = ref.match(/:.*?(\d+)$/);
          const totalRows = lastRowMatch ? Math.max(0, parseInt(lastRowMatch[1]) - 1) : 0;

          const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const preview = rawRows.slice(0, 10).map(row => {
            const cleaned = {};
            for (const [k, v] of Object.entries(row)) {
              cleaned[k.trim()] = v;
            }
            return cleaned;
          });
          const headers = preview.length > 0 ? Object.keys(preview[0]) : [];
          resolve({ headers, preview, totalRows });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) {
      dispatch(clearUploadPreview());
      return;
    }

    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExts.includes(ext)) {
      toast.error('Invalid file format. Only Excel (.xlsx, .xls) and CSV (.csv) files are accepted.');
      return;
    }

    // ─── STEP 1: Parse preview client-side INSTANTLY (no spinner, no server round-trip) ───
    try {
      const clientPreview = await parsePreviewClientSide(selectedFile);

      // Show preview immediately
      dispatch(setUploadPreview({
        previewData: {
          headers: clientPreview.headers,
          preview: clientPreview.preview,
          totalRows: clientPreview.totalRows,
        },
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: ext,
        sessionId: null,   // Not available yet — server upload in progress
        allRows: null,
      }));
    } catch (err) {
      toast.error('Could not read file. Make sure it is a valid Excel or CSV file.');
      return;
    }

    // ─── STEP 2: Upload file to server in background ───────────────────────────
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await uploadApi.upload(formData);
      const responseData = response.data.data;

      // Update Redux with the real sessionId from server (enables Evaluate button fully)
      dispatch(setUploadPreview({
        previewData: {
          headers: responseData.headers,
          preview: responseData.preview,
          totalRows: responseData.totalRows,
        },
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: ext,
        sessionId: responseData.sessionId ?? null,
        allRows: null,
      }));
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(typeof msg === 'string' ? msg : 'Server upload failed. Please try again.');
      // Keep the client-side preview visible, just clear sessionId
    } finally {
      setUploading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!sessionId && !allRows) {
      toast.error('No data available for evaluation. Please upload a file first.');
      return;
    }

    if (!rulesData?.rules || rulesData.rules.filter(r => r.isActive).length === 0) {
      toast.error('No active rules found. An admin must create rules before evaluation.');
      return;
    }

    setEvaluating(true);
    const toastId = toast.loading('Initiating evaluation job…');

    try {
      // 1. Start the asynchronous job
      const triggerResponse = await evaluationApi.evaluate(
        sessionId
          ? { sessionId, fileName, ruleIds: null }
          : { orders: allRows, fileName, ruleIds: null }
      );

      const evalId = triggerResponse.data.data.evaluationId;
      toast.loading('Evaluation in progress... processing background task.', { id: toastId });

      // 2. Poll for status every 2 seconds
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          const statusRes = await evaluationApi.getStatus(evalId);
          const { status, totalMatches, error: backendError } = statusRes.data.data;

          if (status === 'completed') {
            clearInterval(pollInterval);
            toast.success(`Evaluation complete! ${totalMatches} matches found.`, { id: toastId, duration: 5000 });
            navigate('/results');
            dispatch(clearUploadPreview());
            setEvaluating(false);
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            toast.error(`Evaluation failed: ${backendError || 'Unknown error'}`, { id: toastId });
            setEvaluating(false);
          } else if (pollCount > 150) { // 5-minute timeout
            clearInterval(pollInterval);
            toast.error('Evaluation taking too long. Please check the results dashboard later.', { id: toastId });
            setEvaluating(false);
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
          // Don't clear interval on a single network error, keep trying
        }
      }, 2000);

    } catch (err) {
      const errMsg = err.response?.data?.error;
      toast.error(typeof errMsg === 'string' ? errMsg : 'Failed to start evaluation. Please try again.', { id: toastId });
      setEvaluating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    const toastId = toast.loading('Generating template…');
    try {
      const response = await schemaApi.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded!', { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to download template. Make sure entity fields are defined first.';
      toast.error(msg, { id: toastId });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 -tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Dataset Import
          </h1>
          <p className="text-surface-600 max-w-3xl leading-relaxed font-medium">
            Select your spreadsheet to begin the evaluation process. We recommend using our <span className="text-primary-600 font-bold">Standard Template</span> for 100% accurate rule processing.
          </p>
        </div>
        <Button
          icon={HiOutlineArrowDownTray}
          variant="secondary"
          onClick={handleDownloadTemplate}
          loading={downloadingTemplate}
          className="shadow-lg"
        >
          Download Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload zone */}
        <div className={`lg:col-span-12 space-y-6 ${previewData ? 'hidden lg:block' : ''}`}>
          <Reveal>
            <FileDropzone 
              onFileSelect={handleFileSelect} 
              loading={uploading} 
              currentFile={fileName ? { name: fileName, size: fileSize } : null}
            />
          </Reveal>
        </div>

        {/* Loading state — only shown if there's no preview yet (edge case) */}
        {!previewData && uploading ? (
          <div className="lg:col-span-12 flex flex-col items-center justify-center py-20 card border-primary-500/20">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-800 font-medium animate-pulse">Reading file…</p>
          </div>
        ) : previewData && (
          <>
            {/* Summary Statistics */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Reveal className="h-full" delay={0}>
                <div className="card p-6 bg-primary-600/5 border-primary-500/20 ring-1 ring-primary-500/10 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-600/20 rounded-2xl flex items-center justify-center text-primary-400">
                      <HiOutlineTableCells className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-[0.2em] mb-0.5">Records Detected</p>
                      <h4 className="text-2xl font-black text-surface-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{previewData.totalRows} Rows</h4>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal className="h-full" delay={100}>
                <div className="card p-6 bg-white/50 border-gray-200/30 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-800">
                      <HiOutlineChartBarSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-[0.2em] mb-0.5">Columns Found</p>
                      <h4 className="text-2xl font-black text-surface-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{previewData.headers?.length || 0}</h4>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal className="h-full" delay={200}>
                <div className="card p-6 bg-white/50 border-gray-200/30 h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-800">
                      <HiOutlineDocumentText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-[0.2em] mb-0.5">Rules Ready</p>
                      <h4 className="text-2xl font-black text-surface-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{rulesData?.rules?.filter(r => r.isActive).length || 0} Active</h4>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Preview Table */}
            <Reveal delay={300} className="lg:col-span-12">
              <div className="card overflow-hidden border-gray-200/50 flex flex-col h-full">
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200/50 flex items-center justify-between">
                  <h2 className="text-[11px] font-black text-surface-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <HiOutlineTableCells className="w-5 h-5 text-primary-500" />
                    Data Preview
                  </h2>
                  <span className="text-[10px] bg-white px-2 py-1 rounded border border-gray-200 text-gray-800 font-mono">
                    {fileName?.endsWith('.csv') ? 'CSV' : 'XLSX'}_ENGINE_V2
                  </span>
                </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="table-header">
                    <tr>
                      {previewData.headers.map(header => (
                        <th key={header} className="px-6 py-4 whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/80">
                    {previewData?.preview?.map((row, idx) => (
                      <tr key={idx} className="table-row group">
                        {previewData.headers.map(header => {
                          const value = row[header];
                          const isPrimitive = typeof value !== 'object' || value === null;

                          return (
                            <td key={header} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap group-hover:text-gray-900">
                              {typeof value === 'number'
                                ? value.toLocaleString()
                                : isPrimitive
                                  ? (value === null || value === undefined || value === '' ? <span className="text-gray-400 italic font-mono text-[10px]">null/empty</span> : String(value))
                                  : JSON.stringify(value)
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-white/80 mt-auto border-t border-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <HiCheckCircle className="w-5 h-5 text-success-500" />
                  File parsed successfully. Unrecognized columns will simply have no matching rules.
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => dispatch(clearUploadPreview())}>
                    Choose Different File
                  </Button>
                  {uploading && !sessionId ? (
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm text-gray-500 font-medium">
                      <Spinner size="sm" />
                      <span>Uploading to server…</span>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleEvaluate}
                      loading={evaluating}
                      disabled={!sessionId && !allRows}
                      icon={HiPlay}
                      className="shadow-primary-600/30 shadow-xl px-10"
                    >
                      Execute Evaluation
                    </Button>
                  )}
                </div>
              </div>
            </div>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
