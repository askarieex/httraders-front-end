/**
 * units.js - Centralized configuration for all units of measurement in the system
 * 
 * This file acts as the single source of truth for all units used in the application.
 * It defines unit types, their respective units with human-friendly labels,
 * and maps which unit types are allowed for each category.
 */

// Unit Types
export const UNIT_TYPES = {
    VOLUME: 'volume',
    AREA: 'area',
    LENGTH: 'length',
    COUNT: 'count',
    WEIGHT: 'weight'
};

// All units with their human-friendly labels and types
export const UNITS = {
    // Volume units
    CFT: { label: 'Cubic Feet (CFT)', type: UNIT_TYPES.VOLUME },
    m3: { label: 'Cubic Meters (m³)', type: UNIT_TYPES.VOLUME },

    // Area units
    SFT: { label: 'Square Feet (SFT)', type: UNIT_TYPES.AREA },
    m2: { label: 'Square Meters (m²)', type: UNIT_TYPES.AREA },

    // Length units
    RFT: { label: 'Running Feet (RFT)', type: UNIT_TYPES.LENGTH },

    // Weight units
    KG: { label: 'Kilograms (KG)', type: UNIT_TYPES.WEIGHT },
    GRAMS: { label: 'Grams', type: UNIT_TYPES.WEIGHT },

    // Count units (discrete items)
    PCS: { label: 'Pieces', type: UNIT_TYPES.COUNT },
    BAGS: { label: 'Bags', type: UNIT_TYPES.COUNT },
    BOX: { label: 'Boxes', type: UNIT_TYPES.COUNT },
    PKG: { label: 'Package', type: UNIT_TYPES.COUNT },
    ROLL: { label: 'Roll', type: UNIT_TYPES.COUNT },
    PATIE: { label: 'Patie', type: UNIT_TYPES.COUNT }
};

// Dimension units for length, width, height measurements
export const DIMENSION_UNITS = [
    { value: 'ft', label: 'Feet (ft)' },
    { value: 'in', label: 'Inches (in)' },
    { value: 'cm', label: 'Centimeters (cm)' },
    { value: 'm', label: 'Meters (m)' }
];

// Mapping of category IDs to allowed unit types
export const CATEGORY_UNIT_TYPES = {
    // Timber/Wood - supports all volume, length, area and count units
    1: [UNIT_TYPES.VOLUME, UNIT_TYPES.LENGTH, UNIT_TYPES.AREA, UNIT_TYPES.COUNT],

    // Construction Materials - supports count, weight, volume, area
    2: [UNIT_TYPES.COUNT, UNIT_TYPES.WEIGHT, UNIT_TYPES.VOLUME, UNIT_TYPES.AREA],

    // Hardware - supports count and weight units
    3: [UNIT_TYPES.COUNT, UNIT_TYPES.WEIGHT],

    // Packaging - supports count and area units
    4: [UNIT_TYPES.COUNT, UNIT_TYPES.AREA]
};

// Which unit types require dimensions
export const DIMENSION_REQUIRED_TYPES = [
    UNIT_TYPES.VOLUME,
    UNIT_TYPES.AREA,
    UNIT_TYPES.LENGTH
];

// Which unit types require weight per piece
export const WEIGHT_REQUIRED_TYPES = [
    UNIT_TYPES.WEIGHT
];

/**
 * Get all units available for a specific category
 * @param {string|number} categoryId - The category ID
 * @returns {Array} Array of unit objects with value and label properties
 */
export const getUnitsForCategory = (categoryId) => {
    if (!categoryId) return [];

    // Get allowed unit types for this category
    const allowedTypes = CATEGORY_UNIT_TYPES[categoryId] || [];

    // Filter units that match the allowed types
    return Object.entries(UNITS)
        .filter(([_, unit]) => allowedTypes.includes(unit.type))
        .map(([code, unit]) => ({
            value: code,
            label: unit.label
        }));
};

/**
 * Check if a unit supports/requires dimensions
 * @param {string} unit - The unit code to check
 * @returns {boolean} Whether dimensions are supported
 */
export const isDimensionsSupported = (unit) => {
    if (!unit || !UNITS[unit]) return false;
    return DIMENSION_REQUIRED_TYPES.includes(UNITS[unit].type);
};

/**
 * Check if a unit requires weight per piece
 * @param {string} unit - The unit code to check
 * @returns {boolean} Whether weight per piece is required
 */
export const isWeightRequired = (unit) => {
    if (!unit || !UNITS[unit]) return false;
    return WEIGHT_REQUIRED_TYPES.includes(UNITS[unit].type);
};

/**
 * Get a formatted display string for an item quantity
 * @param {number} quantity - The quantity value
 * @param {string} unit - The unit code
 * @returns {string} Formatted quantity string
 */
export const formatQuantity = (quantity, unit) => {
    if (!unit || !UNITS[unit]) return `${quantity}`;
    return `${quantity} ${UNITS[unit].label}`;
}; 