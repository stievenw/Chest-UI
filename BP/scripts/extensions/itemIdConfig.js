/**
 * Item ID Configuration & Management System
 * 
 * This system manages ID offsets for custom items without needing to modify modules that use the extension.
 * When adding custom items, simply update the count configuration here.
 * 
 * HOW TO USE:
 * 1. Count all your custom items
 * 2. Update the count in CUSTOM_ITEM_OFFSET
 * 3. All ID calculations will automatically adjust
 */

/**
 * Tracking for added custom items
 * Format: { version: { count: number of custom items } }
 */
export const CUSTOM_ITEM_OFFSET = {
	// When adding custom items, update the count in current version
	// Or create a new version for better tracking
	v1: {
		count: 0, // <-- Update this number when adding custom items
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
 * @param {number} number_of_custom_items - Number of custom items (fallback)
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
 * @param {number} number_of_custom_items - Number of custom items (fallback)
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
 * 1. Count the total number of your custom items
 * 2. Update CUSTOM_ITEM_OFFSET in this file:
 *    - Increment the count in the current version
 *    - Or create a new version for detailed tracking
 * 3. All modules using ChestFormData will automatically adapt
 * 
 * EXAMPLE:
 * 
 * // Before adding custom items
 * v1: { count: 0, ... }
 * 
 * // After adding 5 custom items
 * v1: { count: 5, ... }
 * 
 * // Or with new version for better organization
 * v2: { count: 5, description: 'Added 5 custom items' }
 */
