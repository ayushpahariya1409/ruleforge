import React, { useState } from 'react';
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiOutlineChevronDown } from 'react-icons/hi2';
import { 
  generateLogicSummary as generateSummaryHelper, 
  generateReadableSummary 
} from '../../utils/formatters';

const ExplanationPanel = ({ ruleMatch, rules = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!ruleMatch) return null;
  const { ruleName, matched, explanation = [], ruleId } = ruleMatch;

  // Just-In-Time (JIT) generation of summaries to optimize performance for large datasets
  const activeRule = rules.find(r => String(r._id) === String(ruleId));
  const finalLogic = activeRule ? generateSummaryHelper(activeRule.conditions) : null;
  const finalReason = generateReadableSummary(ruleMatch);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${matched ? 'bg-success-500/5 border-success-500/20' : 'bg-gray-50/50 border-gray-200/50'} mb-3 last:mb-0 overflow-hidden`}>
      {/* Header / Trigger */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          {matched ? (
            <HiCheckCircle className="w-8 h-8 text-success-500 shrink-0" />
          ) : (
            <HiXCircle className="w-8 h-8 text-danger-500/40 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={`text-sm font-bold truncate ${matched ? 'text-gray-900' : 'text-gray-700'}`}>
                {ruleName}
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${matched ? 'bg-success-500/20 text-success-600' : 'bg-gray-200 text-gray-500'}`}>
                {matched ? 'PASS' : 'FAIL'}
              </span>
            </div>
            {finalLogic && (
              <p className="text-[10px] font-mono mb-2 bg-gray-50 px-2.5 py-1.5 rounded-md inline-block border border-gray-100 leading-relaxed">
                <span className="text-gray-400 mr-2 font-black uppercase text-[8px] tracking-widest">LOGIC:</span>
                {(() => {
                  // Split by common delimiters and operators but keep them in the result
                  const parts = finalLogic.split(/(\(|\)| AND | OR )/g);
                  return parts.map((part, i) => {
                    const trimmedPart = part.trim();
                    if (!trimmedPart || ['(', ')', 'AND', 'OR'].includes(trimmedPart)) {
                      return <span key={i} className="text-indigo-400 font-bold">{part}</span>;
                    }

                    // Check if this condition part matches any failed or passed item in explanation
                    const resultMatch = explanation.find(exp => {
                      return trimmedPart.includes(exp.field) && trimmedPart.includes(String(exp.expected));
                    });

                    if (resultMatch) {
                      const isPass = resultMatch.result === 'PASS';
                      return (
                        <span 
                          key={i} 
                          className={`px-1 rounded ${isPass ? 'text-emerald-600 bg-emerald-50/50' : 'text-rose-600 bg-rose-50 font-black'}`}
                          title={`Value was: ${resultMatch.actual}`}
                        >
                          {part}
                        </span>
                      );
                    }

                    return <span key={i} className="text-gray-600">{part}</span>;
                  });
                })()}
              </p>
            )}
            <p className={`text-xs font-medium line-clamp-2 ${matched ? 'text-success-800' : 'text-gray-600'}`}>
              {finalReason || (matched ? 'The order data successfully met all conditions defined for this rule.' : 'The order data failed to meet one or more required conditions for this rule.')}
            </p>
          </div>
        </div>
        <div className="ml-4 flex flex-col items-center gap-1">
          <HiOutlineChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{isExpanded ? 'Hide' : 'View Details'}</span>
        </div>
      </button>

      {/* Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-4 pt-0 border-t border-black/5">
          {/* Detailed Field Breakdown */}
          {explanation.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-[9px] font-black uppercase tracking-tighter text-gray-400 ml-1">Technical Logic Verification</p>
              {explanation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-2 px-3 rounded-lg bg-white border border-gray-100 group hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.result === 'PASS' ? 'bg-success-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-danger-500'}`} />
                    <span className="font-mono font-bold text-gray-600">{item.field}</span>
                    <span className="text-gray-400 font-bold px-1">{item.operator}</span>
                    <span className="text-primary-600 font-bold bg-primary-50 px-1.5 py-0.5 rounded">
                      {String(item.expected)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-gray-400 uppercase font-black tracking-tighter">Actual Value</span>
                      <span className={`font-bold ${item.result === 'PASS' ? 'text-gray-900' : 'text-danger-600'}`}>
                        {item.actual === 'MISSING' ? (
                          <span className="text-danger-700 bg-danger-50 px-1.5 py-0.5 rounded italic font-black text-[9px]">Missing</span>
                        ) : (item.actual === '' || item.actual === null || item.actual === undefined) ? (
                          <span className="text-gray-400 italic font-medium px-1.5 py-0.5 bg-gray-100 rounded text-[9px]">empty/null</span>
                        ) : typeof item.actual === 'boolean' ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight ${item.actual ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            {String(item.actual)}
                          </span>
                        ) : (
                          <span className="text-gray-900">{String(item.actual)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplanationPanel;
