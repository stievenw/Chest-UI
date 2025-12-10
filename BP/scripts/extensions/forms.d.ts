import { Player, RawMessage } from "@minecraft/server";
import { ActionFormResponse } from "@minecraft/server-ui";

/**
 * Enhanced response from ChestFormData that includes inventory slot mapping
 */
interface ChestFormResponse extends ActionFormResponse {
	/** Map of button index to actual inventory slot number */
	inventorySlotMap: Map<number, number>;
	/** Number of control buttons before auto-inventory starts */
	controlButtonCount: number;
	/** 
	 * Inventory slot number if an inventory item was clicked, null otherwise.
	 * Use this to detect inventory clicks and handle them appropriately.
	 */
	inventorySlot: number | null;
	/**
	 * Set to true in your handler to prevent auto-reopen (if enabled).
	 * IMPORTANT: Set this immediately when handling inventory clicks to prevent timing issues.
	 */
	handled?: boolean;
	/**
	 * Helper function to manually reopen the form.
	 * Useful when you want to handle the reopen timing yourself.
	 */
	reopen?: () => void;
}

declare class ChestFormData {
	/**
	 * @param size The size of the chest to display as.
	 */
	constructor(size?: 'small' | 'single' | 'large' | 'double' | '5' | '9' | '18' | '27' | '36' | '45' | '54');
	/**
	 * @remarks The number of slots in the chest ui.
	 */
	public slotCount: number;
	/**
	 * @remarks This builder method sets the title for the chest ui.
	 * @param text The title text for the chest ui.
	 */
	title(text: string | RawMessage): ChestFormData;
	/**
	 * @remarks Adds a button to this chest ui with an icon from a resource pack.
	 * @param slot The slot to display the item in.
	 * @param itemName The name of the item to display.
	 * @param itemDesc The item's lore to display.
	 * @param texture The type ID or the path to the texture. **YOU MUST INCLUDE THE ITEM PREFIX!** For vanilla it is `minecraft:`. Check `typeIds.js` for valid items & data values.
	 * @param stackAmount The stack size for the item. Clamped between 1 & 99.
	 * @param durability Durability for the item. Default=0. Clamped between 1 & 99.
	 * @param enchanted If the item is enchanted or not.
	 */
	button(slot: number, itemName?: string | RawMessage, itemDesc?: (string | RawMessage)[], texture?: string, stackAmount?: number, durability?: number, enchanted?: boolean): ChestFormData;
	/**
	* @remarks Fills slots based off of strings and a key, with the first slot being the cordinate that the pattern starts at.
	* @param pattern The pattern to use, with characters not defined in key being left empty.
	* @param key The data to display for each character in the pattern.
	* @example
	* gui.pattern([
				'xxxxxxxxx',
				'x_______x',
				'x___a___x',
				'x_______x',
				'x_______x',
				'xxxxxxxxx'
		], {
			x:  { itemName: '', itemDesc: [], enchanted: false, stackAmount: 1, texture: 'minecraft:stained_glass_pane' },
			a:  { itemName: 'Anvil', itemDesc: [], enchanted: true, stackAmount: 16, texture: 'minecraft:anvil'},
		})
	*/
	pattern(pattern: string[], key: { [key: string]: { itemName?: string | RawMessage, itemDesc?: (string | RawMessage)[], stackSize?: number, enchanted?: boolean, durability?: number, texture: string } }): ChestFormData;
	/**
	  * @remarks
	  * Creates and shows this modal popup form. Returns asynchronously when the player confirms or cancels the dialog.
	  * 
	  * Response includes inventory slot mapping for clickable items.
	  * 
	  * **AUTO-REOPEN FEATURE:**
	  * By default, clicking inventory items will auto-reopen the form (anti-close).
	  * Set `options.autoReopenInventory = false` if your form has menu buttons to avoid timing conflicts.
	  * 
	  * **IMPORTANT:** When disabling auto-reopen, you MUST handle inventory clicks manually:
	  * ```typescript
	  * form.show(player, { autoReopenInventory: false }).then(response => {
	  *     if (response.inventorySlot !== null) {
	  *         response.handled = true;
	  *         system.runTimeout(() => reopenForm(), 3);
	  *         return;
	  *     }
	  *     // Handle menu buttons...
	  * });
	  * ```
	  *
	  * This function can't be called in read-only mode.
	  *
	  * @param player Player to show this dialog to.
	  * @param options Optional configuration { autoReopenInventory?: boolean }
	  */
	show(player: Player, options?: { autoReopenInventory?: boolean }): Promise<ChestFormResponse>;
}
declare class FurnaceFormData {
	/**
	 * @param isLit If the furnace appears lit in the ui.
	 */
	constructor(isLit?: boolean);
	/**
	 * @remarks The number of slots in the furnace ui.
	 */
	public slotCount: number;
	/**
	 * @remarks This builder method sets the title for the furnace ui.
	 * @param text The title text for the furnace ui.
	 */
	title(text: string | RawMessage): FurnaceFormData;
	/**
	 * @remarks Adds a button to this furnace ui with an icon from a resource pack.
	 * @param slot The slot to display the item in. Clamped between 0 & 2.
	 * @param itemName The name of the item to display.
	 * @param itemDesc The item's lore to display.
	 * @param texture The type ID or the path to the texture. **YOU MUST INCLUDE THE ITEM PREFIX!** For vanilla it is `minecraft:`. Check `typeIds.js` for valid items & data values.
	 * @param stackAmount The stack size for the item. Clamped between 1 & 99.
	 * @param durability Durability for the item. Default=0. Clamped between 1 & 99.
	 * @param enchanted If the item is enchanted or not.
	 */
	button(slot: number, itemName?: string | RawMessage, itemDesc?: (string | RawMessage)[], texture?: string, stackAmount?: number, durability?: number, enchanted?: boolean): FurnaceFormData;
	/**
	  * @remarks
	  * Creates and shows this modal popup form. Returns
	  * asynchronously when the player confirms or cancels the
	  * dialog. Response includes inventory slot mapping for clickable items.
	  *
	  * This function can't be called in read-only mode.
	  *
	  * @param player
	  * Player to show this dialog to.
	  */
	show(player: Player): Promise<ChestFormResponse>;
}
export { ChestFormData, FurnaceFormData, ChestFormResponse };