import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineCloudArrowDown, HiOutlineEye, HiOutlineMagnifyingGlass, HiOutlineFunnel, HiOutlineClock, HiOutlineChevronDown } from 'react-icons/hi2';
import ResultsTable from '../components/results/ResultsTable';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import Modal from '../components/shared/Modal';
import Pagination from '../components/shared/Pagination';
import { useEvaluations, useEvaluation, useEvaluationResults } from '../hooks/useEvaluations';
import { resultApi } from '../api/resultApi';
import { formatDate, getMatchRate } from '../utils/formatters';
import { useRules } from '../hooks/useRules';
import toast from 'react-hot-toast';
import Reveal from '../components/shared/Reveal';

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_HISTORY_PAGE_SIZE = 10;

import PerPageControl from '../components/shared/PerPageControl';

const ResultsPage = () => {
  // ✅ History pagination
  const [page, setPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(DEFAULT_HISTORY_PAGE_SIZE);

  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [isRuleFilterOpen, setIsRuleFilterOpen] = useState(false);

  const [detailPage, setDetailPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // ✅ Pass dynamic historyPageSize to hook
  const { data: listData, isLoading: listLoading } = useEvaluations({ page, limit: historyPageSize });
  const { data: detailData, isLoading: detailLoading } = useEvaluation(selectedEvalId);
  const { 
    data: resultsData, 
    isLoading: resultsLoading 
  } = useEvaluationResults(selectedEvalId, { 
    page: detailPage, 
    limit: pageSize,
    search: searchTerm,
    ruleIds: selectedRuleIds.join(',')
  });

  const { data: rulesData } = useRules();
  const ruleFilterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ruleFilterRef.current && !ruleFilterRef.current.contains(event.target)) {
        setIsRuleFilterOpen(false);
      }
    };
    if (isRuleFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRuleFilterOpen]);

  const handleViewDetail = (id) => {
    setSelectedEvalId(id);
    setIsDetailOpen(true);
    setSearchTerm('');
    setSelectedRuleIds([]);
    setDetailPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  };



  const toggleRuleFilter = (id) => {
    const stringId = String(id);
    setSelectedRuleIds(prev =>
      prev.includes(stringId) ? prev.filter(r => r !== stringId) : [...prev, stringId]
    );
    setDetailPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setDetailPage(1);
  };

  // ✅ History page size change — keep position
  const handleHistoryPageSizeChange = (newSize) => {
    const currentFirstRow = (page - 1) * historyPageSize;
    const newPage = Math.floor(currentFirstRow / newSize) + 1;
    setHistoryPageSize(newSize);
    setPage(Math.max(1, newPage));
  };

  const historyTotal = listData?.pagination?.total || 0;
  const historyRangeStart = historyTotal === 0 ? 0 : (page - 1) * historyPageSize + 1;
  const historyRangeEnd = Math.min(page * historyPageSize, historyTotal);

  const resultsTotal = resultsData?.pagination?.total || 0;
  const detailTotalPages = resultsData?.pagination?.totalPages || 1;
  const rangeStart = resultsTotal === 0 ? 0 : (detailPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(detailPage * pageSize, resultsTotal);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ✅ Header with history PerPageControl */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-surface-900 -tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Analysis History
          </h1>
          <p className="text-surface-600 max-w-3xl leading-relaxed font-medium">
            Review detailed analytical reports from all previous order evaluation runs. You can drill down into specific matches and export results.
          </p>
        </div>
        <PerPageControl
          pageSize={historyPageSize}
          onPageSizeChange={handleHistoryPageSizeChange}
          max={100}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {listLoading ? (
          <div className="py-20 card border-gray-200">
            <Spinner size="lg" />
          </div>
        ) : !listData?.evaluations?.length ? (
          <div className="py-20 card text-center border-gray-200">
            <HiOutlineCloudArrowDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700">No Evaluations Found</h3>
            <p className="text-gray-500 text-sm">You haven't processed any order files yet.</p>
          </div>
        ) : (
          <>
              <div className="grid grid-cols-1 gap-4">
              {listData.evaluations.map((evalItem, index) => (
                <Reveal key={evalItem._id} delay={index * 50}>
                  <div className="card p-5 border-surface-200 hover:border-primary-500/30 transition-all group bg-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h3 className="text-base font-bold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
                            {evalItem.fileName}
                          </h3>
                          <span className="text-[9px] font-black uppercase tracking-widest bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full border border-surface-200">Dataset</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-surface-500 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 font-medium">
                            <HiOutlineClock className="w-4 h-4 text-surface-400" /> 
                            {formatDate(evalItem.createdAt)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-surface-300 hidden sm:block" />
                          <span className="font-semibold text-surface-700">{evalItem.totalOrders.toLocaleString()} records</span>
                          <span className="w-1 h-1 rounded-full bg-surface-300 hidden sm:block" />
                          <span className="font-bold text-success-600 bg-success-50 px-2 py-0.5 rounded-lg border border-success-100">
                            {evalItem.totalMatches.toLocaleString()} Matches ({getMatchRate(evalItem.totalMatches, evalItem.totalOrders)})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Button variant="secondary" size="sm" icon={HiOutlineEye} onClick={() => handleViewDetail(evalItem._id)} className="font-bold">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* ✅ History pagination with range counter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
              {historyTotal > 0 && (
                <p className="text-xs text-gray-500">
                  Showing{' '}
                  <span className="text-gray-900 font-bold">{historyRangeStart}–{historyRangeEnd}</span>
                  {' '}of{' '}
                  <span className="text-gray-900 font-bold">{historyTotal}</span>
                  {' '}evaluations
                </p>
              )}
              {listData.pagination?.pages > 1 && (
                <Pagination
                  page={page}
                  totalPages={listData.pagination.pages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Results for ${detailData?.fileName || 'Evaluation'}`}
        size="xl"
      >
        {detailLoading ? (
          <div className="py-20"><Spinner /></div>
        ) : detailData ? (
          <div className="space-y-6 min-h-[600px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{detailData.totalOrders}</p>
              </div>
              <div className="bg-success-50 border border-success-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Matches Found</p>
                <p className="text-xl font-bold text-success-600">{detailData.totalMatches}</p>
              </div>
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-black text-gray-500 mb-1">Match Rate</p>
                <p className="text-xl font-bold text-primary-600">{getMatchRate(detailData.totalMatches, detailData.totalOrders)}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex-1 relative w-full">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input-field pl-10 py-2 text-sm w-full"
                  placeholder="Search record content..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setDetailPage(1); }}
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative" ref={ruleFilterRef}>
                  <button
                    onClick={() => setIsRuleFilterOpen(!isRuleFilterOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium whitespace-nowrap ${selectedRuleIds.length > 0 ? 'bg-primary-600/10 border-primary-500/30 text-primary-600' : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                    <HiOutlineFunnel className="w-4 h-4" />
                    Rules ({rulesData?.rules?.filter(r => r.isActive).length || 0})
                    <HiOutlineChevronDown className={`w-3 h-3 transition-transform ${isRuleFilterOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isRuleFilterOpen && (
                    <div className="absolute top-full right-0 mt-3 min-w-[280px] w-max max-w-sm bg-white border border-gray-200 rounded-xl shadow-xl z-[100] p-3 animate-scale-in">
                      <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Filter by Rules</span>
                        <button onClick={() => { setSelectedRuleIds([]); setDetailPage(1); }} className="text-[10px] text-primary-600 hover:text-primary-800 font-bold uppercase transition-colors">Clear</button>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1 text-gray-900">
                        {rulesData?.rules?.filter(r => r.isActive)?.map(rule => {
                          const stringId = String(rule._id);
                          const isSelected = selectedRuleIds.includes(stringId);
                          
                          return (
                            <label key={rule._id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                                checked={isSelected} 
                                onChange={() => toggleRuleFilter(rule._id)} 
                              />
                              <span className={`text-sm ${isSelected ? 'text-gray-950 font-bold' : 'text-gray-700'} whitespace-nowrap`}>
                                {rule.ruleName || 'Unnamed Rule'}
                              </span>
                            </label>
                          );
                        })}
                        {(!rulesData?.rules || rulesData.rules.filter(r => r.isActive).length === 0) && (
                          <p className="text-xs text-gray-400 p-2 italic text-center">No active rules available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <PerPageControl pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />

                <div className="text-xs text-gray-500 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200 min-w-[150px] text-center">
                  Showing <span className="text-gray-900 font-bold">{rangeStart}–{rangeEnd}</span> of <span className="text-gray-900 font-bold">{resultsTotal}</span>
                </div>
              </div>
            </div>

            {resultsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center card border-gray-200">
                <Spinner size="lg" className="mb-4" />
                <p className="text-gray-400 text-sm animate-pulse font-mono uppercase tracking-widest text-[10px]">Fetching batch from server...</p>
              </div>
            ) : resultsData?.results?.length === 0 ? (
              <div className="py-20 text-center card border-gray-200">
                 <p className="text-gray-500 italic">No results match your current filters.</p>
              </div>
            ) : (
              <>
                <ResultsTable results={resultsData.results} rules={rulesData?.rules} />
                <Pagination
                  page={detailPage}
                  totalPages={detailTotalPages}
                  onPageChange={setDetailPage}
                />
              </>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">Failed to load evaluation details.</div>
        )}
      </Modal>
    </div>
  );
};

export default ResultsPage;
