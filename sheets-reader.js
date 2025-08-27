/**
 * Google Sheets Reader
 * Requires Google Sheets API v4 and proper authentication
 */

class GoogleSheetsReader {
    constructor(apiKey = null, useProxy = true) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
        this.publicBaseUrl = 'https://docs.google.com/spreadsheets/d';
        this.useProxy = useProxy;
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
        ];
    }

    /**
     * Read data from a public Google Spreadsheet and return as objects
     * @param {string} spreadsheetId - The ID of the Google Spreadsheet
     * @param {string} sheetName - The name or gid of the sheet (default: first sheet)
     * @param {boolean} asObjects - Whether to return objects with header keys (default: false)
     * @returns {Promise<Array>} Array of rows or objects
     */
    async readPublicSpreadsheet(spreadsheetId, sheetName = '0', asObjects = false) {
        try {
            const gid = isNaN(sheetName) ? '0' : sheetName;
            let url = `${this.publicBaseUrl}/${spreadsheetId}/export?format=csv&gid=${gid}`;
            
            // Try without proxy first
            if (!this.useProxy) {
                const csvText = await this.fetchCSVText(url);
                return asObjects ? this.parseCSVAsObjects(csvText) : this.parseCSV(csvText);
            }

            // Try with different CORS proxies
            for (const proxy of this.corsProxies) {
                try {
                    const proxiedUrl = proxy + encodeURIComponent(url);
                    const csvText = await this.fetchCSVText(proxiedUrl);
                    return asObjects ? this.parseCSVAsObjects(csvText) : this.parseCSV(csvText);
                } catch (error) {
                    console.warn(`Failed with proxy ${proxy}:`, error);
                    continue;
                }
            }
            
            throw new Error('All CORS proxies failed. The spreadsheet might not be public or accessible.');
        } catch (error) {
            console.error('Error reading public spreadsheet:', error);
            throw error;
        }
    }

    /**
     * Fetch URL and return CSV text
     * @param {string} url - URL to fetch
     * @returns {Promise<string>} CSV text
     */
    async fetchCSVText(url) {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.text();
    }

    /**
     * Fetch URL and parse CSV content
     * @param {string} url - URL to fetch
     * @returns {Promise<Array>} Parsed CSV data
     */
    async fetchAndParseCSV(url) {
        const csvText = await this.fetchCSVText(url);
        return this.parseCSV(csvText);
    }

    /**
     * Parse CSV text into array of arrays
     * @param {string} csvText - CSV content as string
     * @returns {Array} Array of rows
     */
    parseCSV(csvText) {
        const rows = [];
        const lines = csvText.split('\n');
        
        for (const line of lines) {
            if (line.trim() === '') continue;
            
            const row = [];
            let currentField = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                        // Handle escaped quotes
                        currentField += '"';
                        i++; // Skip next quote
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            
            // Add the last field and trim whitespace
            row.push(currentField.trim());
            
            // Only add non-empty rows
            if (row.some(cell => cell !== '')) {
                rows.push(row);
            }
        }
        
        return rows;
    }

    /**
     * Parse CSV text into array of objects with headers as keys
     * @param {string} csvText - CSV content as string
     * @returns {Array} Array of objects
     */
    parseCSVAsObjects(csvText) {
        const rows = this.parseCSV(csvText);
        
        if (rows.length === 0) return [];
        
        const headers = rows[0].map(header => header.trim());
        const dataRows = rows.slice(1);
        
        return dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                // Ensure we don't have undefined values and trim whitespace
                const value = row[index] || '';
                obj[header.toLowerCase()] = value.trim();
            });
            return obj;
        }).filter(obj => {
            // Filter out completely empty objects
            return Object.values(obj).some(value => value !== '');
        });
    }

    /**
     * Read data from a Google Spreadsheet (uses public method if no API key)
     * @param {string} spreadsheetId - The ID of the Google Spreadsheet
     * @param {string} range - The range to read (ignored for public method)
     * @returns {Promise<Array>} Array of rows with cell values
     */
    async readSpreadsheet(spreadsheetId, range = 'Sheet1!A:Z') {
        if (!this.apiKey) {
            // Extract sheet name from range if provided
            const sheetMatch = range.match(/^([^!]+)!/);
            const sheetName = sheetMatch ? sheetMatch[1] : '0';
            return this.readPublicSpreadsheet(spreadsheetId, sheetName);
        }
        
        try {
            const url = `${this.baseUrl}/${spreadsheetId}/values/${range}?key=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error('Error reading spreadsheet:', error);
            throw error;
        }
    }

    /**
     * Read data and convert to objects with headers as keys
     * @param {string} spreadsheetId - The ID of the Google Spreadsheet
     * @param {string} range - The range to read
     * @returns {Promise<Array>} Array of objects
     */
    async readSpreadsheetAsObjects(spreadsheetId, range = 'Sheet1!A:Z') {
        const rows = await this.readSpreadsheet(spreadsheetId, range);
        
        if (rows.length === 0) return [];
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        return dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    }

    /**
     * Read multiple sheets from a spreadsheet
     * @param {string} spreadsheetId - The ID of the Google Spreadsheet
     * @param {Array<string>} sheetNames - Array of sheet names to read
     * @returns {Promise<Object>} Object with sheet names as keys
     */
    async readMultipleSheets(spreadsheetId, sheetNames) {
        const results = {};
        
        for (const sheetName of sheetNames) {
            try {
                results[sheetName] = await this.readSpreadsheet(spreadsheetId, `${sheetName}!A:Z`);
            } catch (error) {
                console.error(`Error reading sheet ${sheetName}:`, error);
                results[sheetName] = [];
            }
        }
        
        return results;
    }
}

/**
 * Simple function to read Google Spreadsheet (requires API key)
 * @param {string} spreadsheetId - The spreadsheet ID from the URL
 * @param {string} apiKey - Google API key with Sheets API enabled
 * @param {string} range - Range to read (optional)
 * @returns {Promise<Array>} Array of rows
 */
async function readGoogleSheet(spreadsheetId, apiKey, range = 'Sheet1!A:Z') {
    const reader = new GoogleSheetsReader(apiKey);
    return await reader.readSpreadsheet(spreadsheetId, range);
}

/**
 * Simple function to read public Google Spreadsheet (no API key required)
 * @param {string} spreadsheetId - The spreadsheet ID from the URL
 * @param {string} sheetName - Sheet name or gid (optional, defaults to first sheet)
 * @param {boolean} asObjects - Whether to return objects with header keys (default: true)
 * @returns {Promise<Array>} Array of objects or rows
 */
async function readPublicGoogleSheet(spreadsheetId, sheetName = '0', asObjects = true) {
    const reader = new GoogleSheetsReader();
    return await reader.readPublicSpreadsheet(spreadsheetId, sheetName, asObjects);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoogleSheetsReader, readGoogleSheet, readPublicGoogleSheet };
}
