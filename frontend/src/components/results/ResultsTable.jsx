import React, { useState } from 'react';
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineCommandLine, HiOutlineBeaker } from 'react-icons/hi2';
import ExplanationPanel from './ExplanationPanel';

const ResultsTable = ({ results, rules = [] }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (idx) => {
    setExpandedRows(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (!results || results.length === 0) return (
    <div className="py-10 text-center text-gray-700 italic border border-dashed border-gray-100 rounded-2xl">
      No order records found in this evaluation.
    </div>
  );

  // Extract all unique headers from orderData across all results
  const headers = Array.from(new Set(results.flatMap(r => Object.keys(r.orderData || {}))));
  // Show first 5 important headers to keep table clean
  const displayHeaders = headers.slice(0, 5);

  return (
    <div className="card overflow-hidden border-gray-200/50 animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-4 w-10"></th>
              <th className="px-6 py-4">Status</th>
              {displayHeaders.map(h => (
                <th key={h} className="px-6 py-4 capitalize">{h}</th>
              ))}
              <th className="px-6 py-4 text-right">Matches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/80">
            {results.map((result, idx) => {
              const matchedCount = result.matchedRules?.filter(r => r.matched).length || 0;
              const isExpanded = expandedRows[idx];

              return (
                <React.Fragment key={idx}>
                  <tr 
                    className={`table-row cursor-pointer group ${isExpanded ? 'bg-gray-50/60' : ''}`}
                    onClick={() => toggleRow(idx)}
                  >
                    <td className="px-6 py-4">
                      {isExpanded ? <HiOutlineChevronUp className="text-gray-700" /> : <HiOutlineChevronDown className="text-gray-700 group-hover:text-primary-400" />}
                    </td>
                    <td className="px-6 py-4">
                      {matchedCount > 0 ? (
                        <span className="badge-pass">Matched</span>
                      ) : (
                        <span className="badge-fail bg-gray-50 text-gray-700 border-gray-200">No Match</span>
                      )}
                    </td>
                    {displayHeaders.map(h => {
                      const value = result.orderData?.[h];
                      const isPrimitive = typeof value !== 'object' || value === null;
                      return (
                        <td key={h} className="px-6 py-4 text-sm text-gray-700">
                          {isPrimitive ? (
                            (value === null || value === undefined || value === '') ? (
                              <span className="text-gray-300 font-mono text-[10px]">null</span>
                            ) : typeof value === 'boolean' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${value ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                {String(value)}
                              </span>
                            ) : String(value)
                          ) : JSON.stringify(value)}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${matchedCount > 0 ? 'text-primary-400' : 'text-gray-700'}`}>
                        {matchedCount} Rules
                      </span>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-white/50 animate-slide-down">
                      <td colSpan={displayHeaders.length + 3} className="px-8 py-6 border-b border-gray-100/80">
                         <div className="flex flex-col lg:flex-row gap-8">
                            {/* Order Details Left */}
                            <div className="lg:w-1/3">
                               <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-700 mb-4 flex items-center gap-2">
                                 <HiOutlineCommandLine className="w-4 h-4" />
                                 Full Order Payload
                               </h5>
                               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono text-[11px] text-primary-300/80 max-h-80 overflow-y-auto">
                                 <pre>{JSON.stringify(result.orderData, null, 2)}</pre>
                               </div>
                            </div>

                            {/* Evaluation Details Right */}
                            <div className="flex-1">
                               <div className="flex items-center justify-between mb-4">
                                 <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-700 flex items-center gap-2">
                                   <HiOutlineBeaker className="w-4 h-4 text-primary-400" />
                                   Explainability Report
                                 </h5>
                               </div>
                               <div className="space-y-4">
                                  {result.matchedRules.length === 0 ? (
                                    <p className="text-sm text-gray-700 italic py-4">No active rules were applied to this order.</p>
                                  ) : (
                                    [...result.matchedRules]
                                      .sort((a, b) => (b.matched === a.matched ? 0 : b.matched ? 1 : -1))
                                      .map((mr, rIdx) => (
                                        <ExplanationPanel key={rIdx} ruleMatch={mr} rules={rules} />
                                      ))
                                  )}
                                </div>
                            </div>
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
