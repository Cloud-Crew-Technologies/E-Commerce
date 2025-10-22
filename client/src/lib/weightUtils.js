// UOM (Unit of Measure) utilities for browser environment
// This file provides SI units for weight and volume conversion functions without Node.js dependencies

// SI Weight units (fundamental unit: kilograms)
export const weightUnits = [
  { value: "mg", label: "mg", fullLabel: "Milligrams" },
  { value: "g", label: "g", fullLabel: "Grams" },
  { value: "kg", label: "kg", fullLabel: "Kilograms" },
];

// SI Volume units (fundamental unit: liters)
export const volumeUnits = [
  { value: "ml", label: "ml", fullLabel: "Milliliters" },
  { value: "l", label: "l", fullLabel: "Liters" },
];

// Combined SI UOM units
export const uomUnits = [
  ...weightUnits,
  ...volumeUnits,
];

// SI Conversion factors to kilograms (base unit for weight)
const weightConversionFactors = {
  mg: 0.000001,   // 1 mg = 0.000001 kg
  g: 0.001,       // 1 g = 0.001 kg
  kg: 1,          // 1 kg = 1 kg (base unit)
};

// SI Conversion factors to liters (base unit for volume)
const volumeConversionFactors = {
  ml: 0.001,      // 1 ml = 0.001 l
  l: 1,           // 1 l = 1 l (base unit)
};

/**
 * Convert weight from one unit to another
 * @param {number} value - The weight value to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @returns {number} - The converted weight value
 */
export function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }

  // Convert to kilograms first
  const kilograms = value * weightConversionFactors[fromUnit];
  
  // Convert from kilograms to target unit
  return kilograms / weightConversionFactors[toUnit];
}

/**
 * Convert volume from one unit to another
 * @param {number} value - The volume value to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @returns {number} - The converted volume value
 */
export function convertVolume(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) {
    return value;
  }

  // Convert to liters first
  const liters = value * volumeConversionFactors[fromUnit];
  
  // Convert from liters to target unit
  return liters / volumeConversionFactors[toUnit];
}

/**
 * Get all available weight units
 * @returns {Array} - Array of weight unit objects
 */
export function getWeightUnits() {
  return weightUnits;
}

/**
 * Get all available volume units
 * @returns {Array} - Array of volume unit objects
 */
export function getVolumeUnits() {
  return volumeUnits;
}

/**
 * Get all available UOM units (weight + volume)
 * @returns {Array} - Array of all unit objects
 */
export function getUOMUnits() {
  return uomUnits;
}

/**
 * Format weight with unit for display
 * @param {number} value - The weight value
 * @param {string} unit - The weight unit
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted weight string
 */
export function formatWeight(value, unit, decimals = 2) {
  const roundedValue = Number(value).toFixed(decimals);
  return `${roundedValue} ${unit}`;
}

/**
 * Validate if a unit is supported
 * @param {string} unit - The unit to validate
 * @returns {boolean} - True if unit is supported
 */
export function isValidUnit(unit) {
  return weightConversionFactors.hasOwnProperty(unit) || volumeConversionFactors.hasOwnProperty(unit);
}

/**
 * Get conversion factor for a weight unit
 * @param {string} unit - The unit
 * @returns {number} - Conversion factor to kilograms
 */
export function getWeightConversionFactor(unit) {
  return weightConversionFactors[unit] || 1;
}

/**
 * Get conversion factor for a volume unit
 * @param {string} unit - The unit
 * @returns {number} - Conversion factor to liters
 */
export function getVolumeConversionFactor(unit) {
  return volumeConversionFactors[unit] || 1;
}

/**
 * Check if a unit is a weight unit
 * @param {string} unit - The unit to check
 * @returns {boolean} - True if it's a weight unit
 */
export function isWeightUnit(unit) {
  return weightConversionFactors.hasOwnProperty(unit);
}

/**
 * Check if a unit is a volume unit
 * @param {string} unit - The unit to check
 * @returns {boolean} - True if it's a volume unit
 */
export function isVolumeUnit(unit) {
  return volumeConversionFactors.hasOwnProperty(unit);
}
