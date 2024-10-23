import React from 'react';

interface CommandInputProps {
    value: string;
    className?: string;
}

export function CommandInput({ value, className = '' }: CommandInputProps) {
    const parts = value.match(/^(@\w+)(\s*")(.*?)("?\s*)$/);
    
    if (!parts) {
        return <span className={className}>{value}</span>;
    }

    const [, command, spacing, parameter, endQuote] = parts;

    return (
        <span className={className}>
            <span className="text-blue-600 dark:text-blue-400">{command}</span>
            <span className="text-gray-500">{spacing}</span>
            <span className="text-gray-900 dark:text-gray-100">{parameter}</span>
            <span className="text-gray-500">{endQuote}</span>
        </span>
    );
}
