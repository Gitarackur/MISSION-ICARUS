import { toNumberIfPossible } from "./utils";

export interface ParsedCSVResult<T> {
    data: T[];
    headers: string[];
    errors: string[];
}

export const parseCSV = <T>(csvText: string): ParsedCSVResult<T> => {
    const errors: string[] = [];

    if (!csvText.trim()) {
        throw new Error('File is empty');
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
    }

    // Detect delimiter more reliably
    const firstLine = lines[0];
    let delimiter = ',';
    const delimiters = [',', '\t', ';', '|'];

    // Count occurrences of each delimiter and pick the most common one
    const delimiterCounts = delimiters.map(d => ({
        delimiter: d,
        count: firstLine.split(d).length - 1
    }));

    const bestDelimiter = delimiterCounts
        .filter(d => d.count > 0)
        .sort((a, b) => b.count - a.count)[0];

    if (bestDelimiter) {
        delimiter = bestDelimiter.delimiter;
    }

    // Parse CSV with basic quoted field support
    const parseCSVLine = (line: string, delimiter: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                    continue;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
            i++;
        }

        result.push(current.trim());
        return result;
    };


    const headers = parseCSVLine(firstLine, delimiter)
        .map(h => h.replace(/^["']|["']$/g, '').trim())
        .filter(h => h.length > 0);

    if (headers.length === 0) {
        throw new Error('No valid headers found');
    }


    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const values = parseCSVLine(line, delimiter)
                .map(v => v.replace(/^["']|["']$/g, '').trim());


            if (values.every(v => !v)) {
                continue;
            }

            const obj: Record<string, string | number> = {};
            let hasValidData = false;

            headers.forEach((header, index) => {
                const value = values[index] || '';
                const processedValue = toNumberIfPossible(value);
                obj[header] = processedValue;

                if (processedValue !== '') {
                    hasValidData = true;
                }
            });

            if (hasValidData) {
                data.push({
                    ...obj,
                    id: data.length + 1
                } as T);
            }
        } catch (rowError) {
            const errorMsg = `Error parsing row ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`;
            errors.push(errorMsg);
            continue;
        }
    }

    if (data.length === 0) {
        throw new Error('No valid data rows found in file');
    }

    return {
        data,
        headers: headers.slice(0, 8),
        errors
    };
};


export const parseCSVFromFile = async <T>(file: File): Promise<ParsedCSVResult<T>> => {
    const text = await file.text();
    return parseCSV<T>(text);
};