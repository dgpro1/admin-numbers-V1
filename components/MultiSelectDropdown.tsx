import React, { useState, useEffect, useRef } from 'react';

interface MultiSelectDropdownProps {
    options: { value: string; label: string; }[];
    selectedValues: string[];
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    label: string;
    onEditClick?: () => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = event.target;
        let newSelectedValues;
        if (checked) {
            newSelectedValues = [...selectedValues, value];
        } else {
            newSelectedValues = selectedValues.filter(v => v !== value);
        }
        onChange({ target: { name: 'activeCountries', value: newSelectedValues } } as any);
    };

    const displayValue = selectedValues && selectedValues.length > 0 ? selectedValues.join(', ') : 'Ninguno';

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex items-center p-3 border border-gray-600 rounded-lg bg-gray-700 text-white cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <span className="flex-1 text-gray-300 break-words pr-2">{`${label}: ${displayValue}`}</span>
                 <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {options.map(option => (
                        <label key={option.value} className="flex items-center p-2 hover:bg-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                value={option.value}
                                checked={selectedValues?.includes(option.value)}
                                onChange={handleCheckboxChange}
                                className="form-checkbox h-4 w-4 text-indigo-500 rounded bg-gray-700 border-gray-500"
                            />
                            <span className="ml-2 text-gray-200">{option.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
