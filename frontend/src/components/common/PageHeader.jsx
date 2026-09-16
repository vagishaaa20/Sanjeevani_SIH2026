import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon }) => {
    return (
        <div className="flex items-center gap-4 mb-6">
            {Icon && (
                <div className="w-12 h-12 rounded-2xl bg-[#ffe6ee] flex items-center justify-center text-[#e13b68] shadow-sm">
                    <Icon className="w-6 h-6" />
                </div>
            )}
            <div className="flex flex-col">
                <h1 className="text-2xl font-black text-[#2d2329] font-heading">{title}</h1>
                {subtitle && <p className="text-sm font-semibold text-[#7d6974]">{subtitle}</p>}
            </div>
        </div>
    );
};

export default PageHeader;
