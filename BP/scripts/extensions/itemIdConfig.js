/**
 * Item ID Configuration & Management System
 * 
 * This system manages ID offsets for custom items without needing to modify modules that use the extension.
 * When adding custom items, simply update the configuration here.
 * 
 * HOW TO USE:
 * 1. When adding a new custom item to custom_content in constants.js
 * 2. Add an entry in CUSTOM_ITEM_OFFSET with the estimated number of items
 * 3. All ID calculations will automatically adjust
 */

/**
 * Tracking for added custom items
 * Format: { version: { count: number of custom items, offset: ID offset applied } }
 */
export const CUSTOM_ITEM_OFFSET = {
	// Example structure for addon version tracking
	// When adding custom items, add a new version or update the count in the current version
	// Offset is calculated automatically based on timestamp
	v1: {
		count: 12, //46,// Update this when adding custom items
		timestamp: Date.now(),
		description: 'Initial version without custom items'
	},
	// v2: { 
	// 	count: 10, 
	// 	timestamp: Date.now(),
	// 	description: 'Added 10 custom items (diamond_gun, emerald_sword, etc)'
	// },
};

/**
 * Get the total offset ID from all registered custom items
 * @returns {number} Total offset for ID calculation
 */
export function getTotalCustomItemOffset() {
	return Object.values(CUSTOM_ITEM_OFFSET).reduce((sum, version) => sum + version.count, 0);
}

/**
 * Safely calculate ID by considering custom item offset
 * @param {number|undefined} ID - ID from typeIdToID or typeIdToDataId
 * @param {number} number_of_custom_items - Number of custom items from constants.js
 * @returns {number|undefined} Offset ID or undefined if ID is invalid
 */
export function calculateSafeItemID(ID, number_of_custom_items) {
	if (ID === undefined) return undefined;

	// Use tracking offset if available, fallback to parameter
	const totalOffset = getTotalCustomItemOffset();
	const offset = totalOffset > 0 ? totalOffset : number_of_custom_items;

	// Vanilla items (ID < 256) do not need offset
	// Custom items (ID >= 256) get offset
	if (ID < 256) {
		return ID;
	}

	return ID + offset;
}

/**
 * Calculate final texture ID for ChestUI with offset
 * @param {number} ID - ID from typeIdToID or typeIdToDataId
 * @param {number} number_of_custom_items - Number of custom items
 * @param {boolean} enchanted - Whether the item is enchanted
 * @returns {number} Final texture ID for form button
 */
export function calculateFinalTextureID(ID, number_of_custom_items, enchanted = false) {
	if (ID === undefined) return undefined;

	const totalOffset = getTotalCustomItemOffset();
	const offset = totalOffset > 0 ? totalOffset : number_of_custom_items;
	const safeID = ID < 256 ? ID : (ID + offset);

	return (safeID * 65536) + (enchanted ? 32768 : 0);
}

/**
 * Validate and log current offset state
 * Use this for debugging when adding custom items
 */
export function logOffsetState() {
	const totalOffset = getTotalCustomItemOffset();
	console.warn(`[ItemID Config] Total Custom Item Offset: ${totalOffset}`);
	console.warn('[ItemID Config] Offset History:', CUSTOM_ITEM_OFFSET);
	return totalOffset;
}

/**
 * GUIDE FOR ADDING NEW CUSTOM ITEMS:
 * 
 * 1. Edit custom_content in constants.js, add custom item
 * 2. In this file, update CUSTOM_ITEM_OFFSET:
 *    - If adding 5 custom items, increment count in the latest version
 *    - Or create a new version if you want more detailed tracking
 * 3. All modules using ChestFormData will automatically adapt
 * 4. No need to change forms.js or other modules
 * 
 * EXAMPLE ADDITION:
 * 
 * // Currently in v1 with 0 custom items
 * v1: { count: 0, timestamp: ..., description: '...' }
 * 
 * // After adding 5 custom items
 * v1: { count: 5, timestamp: ..., description: '...' }
 * 
 * // Or more organized with a new version
 * v2: { count: 5, timestamp: ..., description: 'Added 5 custom items' }
 */
