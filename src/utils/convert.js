/**
 * Utility functions for stock quantity conversions
 */

import {
    isDimensionsSupported as isUnitDimensionSupported,
    isWeightRequired,
    UNITS
} from '../config/units';

// Conversion factors
const CONVERSION_FACTORS = {
    // Length conversions to meters
    LENGTH: {
        m: 1,
        cm: 0.01,
        ft: 0.3048,
        in: 0.0254
    },
    // Volume conversions
    VOLUME: {
        CFT: 1, // Base unit for volume
        m3: 35.3147 // 1 cubic meter = 35.3147 cubic feet
    },
    // Area conversions
    AREA: {
        SFT: 1, // Base unit for area
        m2: 10.7639 // 1 square meter = 10.7639 square feet
    }
};

/**
 * Compute standardized quantity based on item attributes
 * 
 * @param {Object} params - Item parameters
 * @param {string} params.unit - Item unit (CFT, RFT, KG, PCS, etc)
 * @param {number} params.length - Length dimension
 * @param {number} params.breadth - Breadth/width dimension
 * @param {number} params.height - Height dimension
 * @param {string} params.dim_unit - Dimension unit (cm, in, ft, m)
 * @param {number} params.pieces - Number of pieces
 * @param {number} params.quantityRaw - Raw quantity input
 * @param {number} params.weightPerPiece - Weight per piece for weighted items
 * @returns {number} - Computed quantity in canonical unit
 */
export const computeQuantity = (params) => {
    const {
        unit,
        length,
        breadth,
        height,
        dim_unit = 'ft',
        pieces = 1,
        quantityRaw,
        weightPerPiece
    } = params;

    // If unit is not valid, return raw quantity
    if (!unit || !UNITS[unit]) {
        return Number(quantityRaw || 0);
    }

    // If raw quantity is provided and no dimensions/weight needed, use it directly
    if (quantityRaw !== undefined &&
        (!length || !breadth) &&  // No dimensions provided or incomplete
        !isWeightRequired(unit)) {
        return Number(quantityRaw);
    }

    // For count-based units (PCS, BAGS, BOX, etc.), use pieces
    if (UNITS[unit].type === 'count') {
        return Number(pieces || quantityRaw || 0);
    }

    // For weight-based items (KG, GRAMS)
    if (isWeightRequired(unit)) {
        if (weightPerPiece && pieces) {
            // Calculate total weight based on pieces and weight per piece
            const totalWeight = weightPerPiece * pieces;
            return unit === 'GRAMS' ?
                roundToPrecision(totalWeight / 1000) :
                roundToPrecision(totalWeight); // Convert to KG if needed
        }
        return Number(quantityRaw || 0);
    }

    // For dimension-based units, convert dimensions to the right unit then calculate
    if (isDimensionsSupported(unit) && length && breadth) {
        // Get conversion factor based on dimension unit
        const factor = CONVERSION_FACTORS.LENGTH[dim_unit] || 1;

        // Convert dimensions to base unit (ft for our system)
        const lengthConverted = length * factor / CONVERSION_FACTORS.LENGTH.ft;
        const breadthConverted = breadth * factor / CONVERSION_FACTORS.LENGTH.ft;
        const heightConverted = height ? height * factor / CONVERSION_FACTORS.LENGTH.ft : 1;

        let result = 0;
        switch (unit) {
            case 'CFT': // Volume: L × B × H
                result = lengthConverted * breadthConverted * heightConverted * pieces;
                return roundToPrecision(result);

            case 'RFT': // Running feet: L only, can be multiple pieces
                result = lengthConverted * pieces;
                return roundToPrecision(result);

            case 'SFT': // Square feet: L × B
                result = lengthConverted * breadthConverted * pieces;
                return roundToPrecision(result);

            case 'm2': // Square meters: convert L × B to m²
                const areaFt = lengthConverted * breadthConverted * pieces;
                result = areaFt / CONVERSION_FACTORS.AREA.m2;
                return roundToPrecision(result);

            case 'm3': // Cubic meters: convert volume to m³
                const volumeFt = lengthConverted * breadthConverted * heightConverted * pieces;
                result = volumeFt / CONVERSION_FACTORS.VOLUME.m3;
                return roundToPrecision(result);

            default:
                return Number(quantityRaw || 0);
        }
    }

    // Fallback to raw quantity
    return Number(quantityRaw || 0);
};

/**
 * Round to a specific precision to avoid floating point errors
 * @param {number} value - Value to round
 * @param {number} precision - Decimal places (default: 6)
 * @returns {number} Rounded value
 */
const roundToPrecision = (value, precision = 6) => {
    // For integer values like 336, this will return the exact integer
    // For values with many decimal places, it will round appropriately
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
};

/**
 * Format dimensions with the appropriate unit
 * 
 * @param {number} length - Length value
 * @param {number} breadth - Breadth value
 * @param {number} height - Height value
 * @param {string} dim_unit - Dimension unit (cm, in, ft, m)
 * @returns {string} - Formatted dimension string
 */
export const formatDimensions = (length, breadth, height, dim_unit = 'ft') => {
    if (!length || !breadth) return null;

    return `${length} × ${breadth}${height ? ` × ${height}` : ''} ${dim_unit}`;
};

/**
 * Re-export the dimension support check from the units config
 */
export const isDimensionsSupported = isUnitDimensionSupported;

/**
 * Get category units from the API
 * 
 * @param {string|number} categoryId - Category ID
 * @returns {Promise<Array>} - Promise resolving to array of unit options
 */
export const getCategoryUnits = async (categoryId) => {
    if (!categoryId) return [];

    try {
        // Use axios instead of fetch for consistency with other API calls
        const axios = (await import('axios')).default;

        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Include auth headers in the request
        const response = await axios.get(`http://localhost:3000/api/units/categories/${categoryId}`, {
            headers
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching units:', error);

        // Fallback to local config if API fails
        try {
            const { getUnitsForCategory } = await import('../config/units');
            return getUnitsForCategory(categoryId);
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw new Error('Failed to fetch units');
        }
    }
}; 