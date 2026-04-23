import React from 'react';
import { HiChevronRight, HiOutlineCheckCircle } from 'react-icons/hi2';
import Button from '../shared/Button';

const CATEGORY_STYLES = {
    users: { label: 'Users', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', activeBg: 'bg-blue-500/20' },
    products: { label: 'Products', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', activeBg: 'bg-emerald-500/20' },
    orders: { label: 'Orders', color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/30', activeBg: 'bg-primary-500/20' },
};

const ColumnPicker = ({ grouped, selectedColumns, onToggle, onDone }) => {
    const categories = ['users', 'products', 'orders'];

    return (
        <div className="flex flex-col min-h-[calc(100vh-180px)]">
            <div className="flex-1 space-y-5 pb-8">
                <h3 className="text-lg font-black text-surface-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Select Rule Parameters</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map(cat => {
                        const style = CATEGORY_STYLES[cat];
                        const fields = grouped?.[cat] || [];

                        return (
                            <div key={cat} className={`p-5 rounded-2xl border ${style.bg} ${style.border} shadow-sm`}>
                                <h4 className={`font-black mb-4 uppercase tracking-widest text-[11px] ${style.color}`}>{style.label}</h4>

                                <div className="space-y-2">
                                    {fields.map(field => {
                                        const isSelected = selectedColumns.some(
                                            c => c.fieldName === field.fieldName && c.category === cat
                                        );

                                        return (
                                            <button
                                                key={field.fieldName}
                                                onClick={() => onToggle({
                                                    fieldName: field.fieldName,
                                                    category: cat,
                                                    dataType: field.dataType
                                                })}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${isSelected 
                                                    ? `${style.activeBg} border-transparent shadow-inner font-bold` 
                                                    : 'bg-white border-surface-100 hover:border-surface-300 text-surface-600'
                                                }`}
                                            >
                                                <span className="text-sm">{field.fieldName}</span>
                                                {isSelected && <HiOutlineCheckCircle className={`w-5 h-5 ${style.color}`} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default ColumnPicker;