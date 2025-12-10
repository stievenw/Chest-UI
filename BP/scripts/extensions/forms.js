import { Container, system } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { custom_content, custom_content_keys, inventory_enabled, number_of_custom_items, CHEST_UI_SIZES } from './constants.js';
import { typeIdToDataId, typeIdToID } from './typeIds.js';
import { getTotalCustomItemOffset } from './itemIdConfig.js';

// Track pending auto-reopen timeouts per player to prevent conflicts
// When control buttons are clicked, pending timeouts are automatically cancelled
const pendingAutoReopens = new Map(); // playerId -> timeoutId


// Helper: Get display texture for unregistered items
function getDisplayTexture(texture) {
	// If item is not registered in typeIds, use info_update2 as display fallback
	const targetTexture = custom_content_keys.has(texture) ? custom_content[texture]?.texture : texture;

	// Check if texture is registered
	const isRegistered = typeIdToDataId.has(targetTexture) || typeIdToID.has(targetTexture);

	// If not registered, use info_update2 as fallback
	if (!isRegistered) {
		return 'minecraft:info_update2';
	}

	return targetTexture;
}

class ChestFormData {
	#titleText; #buttonArray;
	constructor(size = 'small') {
		const sizing = CHEST_UI_SIZES.get(size) ?? ['§c§h§e§s§t§2§7§r', 27];
		/** @internal */
		this.#titleText = { rawtext: [{ text: `${sizing[0]}` }] };
		/** @internal */
		// Use empty string for text to trigger UI binding: (not (#form_button_text = ''))
		// This makes the button invisible and non-clickable while maintaining grid position
		const emptyButton = ['', undefined];
		this.#buttonArray = Array(sizing[1]).fill(null).map(() => [...emptyButton]);
		this.slotCount = sizing[1];
	}
	title(text) {
		if (typeof text === 'string') {
			this.#titleText.rawtext.push({ text: text });
		}
		else if (typeof text === 'object') {
			if (text.rawtext) {
				this.#titleText.rawtext.push(...text.rawtext);
			}
			else {
				this.#titleText.rawtext.push(text);
			}
		}
		return this;
	}
	button(slot, itemName, itemDesc, texture, stackSize = 1, durability = 0, enchanted = false) {
		const displayTexture = getDisplayTexture(texture);
		const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
		const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
		let buttonRawtext = {
			rawtext: [
				{
					text: `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r`
				}
			]
		};
		if (typeof itemName === 'string') {
			buttonRawtext.rawtext.push({ text: itemName ? `${itemName}§r` : '§r' });
		}
		else if (typeof itemName === 'object' && itemName.rawtext) {
			buttonRawtext.rawtext.push(...itemName.rawtext, { text: '§r' });
		}
		else return;
		if (Array.isArray(itemDesc) && itemDesc.length > 0) {
			for (const obj of itemDesc) {
				if (typeof obj === 'string') {
					buttonRawtext.rawtext.push({ text: `\n${obj}` });
				}
				else if (typeof obj === 'object' && obj.rawtext) {
					buttonRawtext.rawtext.push({ text: `\n` }, ...obj.rawtext);
				}
			}
		}
		// NEW APPROACH: Send numeric ID encoding for 1.21.130 compatibility
		if (ID === undefined) {
			this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [buttonRawtext, targetTexture]);
		} else {
			// Send numeric ID encoding to match inventory format
			const totalOffset = getTotalCustomItemOffset() || number_of_custom_items;
			const safeID = ID + (ID < 256 ? 0 : totalOffset);
			this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
				buttonRawtext,
				(safeID * 65536) + (enchanted ? 32768 : 0)
			]);
		}
		return this;
	}
	pattern(pattern, key) {
		const totalOffset = getTotalCustomItemOffset() || number_of_custom_items;
		for (let i = 0; i < pattern.length; i++) {
			const row = pattern[i];
			for (let j = 0; j < row.length; j++) {
				const letter = row.charAt(j);
				const data = key[letter];
				if (!data) continue;
				const slot = j + i * 9;
				const displayTexture = getDisplayTexture(data.texture);
				const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
				const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
				const { stackAmount = 1, durability = 0, itemName, itemDesc, enchanted = false } = data;
				const stackSize = String(Math.min(Math.max(stackAmount, 1), 99)).padStart(2, '0');
				const durValue = String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0');
				let buttonRawtext = {
					rawtext: [{ text: `stack#${stackSize}dur#${durValue}§r` }]
				};
				if (typeof itemName === 'string') {
					buttonRawtext.rawtext.push({ text: `${itemName}§r` });
				}
				else if (itemName?.rawtext) {
					buttonRawtext.rawtext.push(...itemName.rawtext, { text: '§r' });
				}
				else continue;
				if (Array.isArray(itemDesc) && itemDesc.length > 0) {
					for (const obj of itemDesc) {
						if (typeof obj === 'string') {
							buttonRawtext.rawtext.push({ text: `\n${obj}` });
						} else if (obj?.rawtext) {
							buttonRawtext.rawtext.push({ text: `\n`, ...obj.rawtext });
						}
					}
				}
				if (ID === undefined) {
					this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [buttonRawtext, targetTexture]);
				} else {
					const safeID = ID + (ID < 256 ? 0 : totalOffset);
					this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
						buttonRawtext,
						(safeID * 65536) + (enchanted ? 32768 : 0)
					]);
				}
			}
		}
		return this;
	}
	show(player, options = {}) {
		const { autoReopenInventory = false, priceCalculator = null, hideInventorySlot = null } = options;

		// Cancel any pending auto-reopens for this player to prevent conflicts
		const playerId = player.id;
		if (pendingAutoReopens.has(playerId)) {
			system.clearRun(pendingAutoReopens.get(playerId));
			pendingAutoReopens.delete(playerId);
		}

		const form = new ActionFormData().title(this.#titleText);
		this.#buttonArray.forEach(button => {
			form.button(button[0], button[1]?.toString());
		});
		if (!inventory_enabled) return form.show(player);
		const totalOffset = getTotalCustomItemOffset() || number_of_custom_items;
		/** @type {Container} */
		const container = player.getComponent('inventory').container;

		// Track inventory slot mapping: button index -> inventory slot
		const inventorySlotMap = new Map();
		let buttonIndex = this.slotCount; // Start after chest buttons

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);

			// Map this button index to the actual inventory slot (INCLUDING EMPTY SLOTS)
			inventorySlotMap.set(buttonIndex, i);
			buttonIndex++;

			// If empty slot, use empty string to make it non-clickable
			if (!item) {
				form.button('', undefined);
				continue;
			}

			// Check if this slot should be hidden (e.g., already in sell queue)
			const shouldHide = hideInventorySlot ? hideInventorySlot(i) : false;
			if (shouldHide) {
				form.button('', undefined);
				continue;
			}

			const typeId = item.typeId;
			const displayTexture = getDisplayTexture(typeId);
			const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
			const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
			const durability = item.getComponent('durability');
			const durDamage = durability ? Math.round((durability.maxDurability - durability.damage) / durability.maxDurability * 99) : 0;
			const amount = item.amount;
			const formattedItemName = typeId.replace(/.*(?<=:)/, '').replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
			let buttonRawtext = {
				rawtext: [
					{
						text: `stack#${String(amount).padStart(2, '0')}dur#${String(durDamage).padStart(2, '0')}§r${formattedItemName}`
					}
				]
			};
			const loreText = item.getLore().join('\n');
			if (loreText) buttonRawtext.rawtext.push({ text: loreText });

			// Add price information if calculator provided
			if (priceCalculator) {
				try {
					const priceText = priceCalculator(item);
					if (priceText) {
						buttonRawtext.rawtext.push({ text: `\n§7Worth: §a${priceText}` });
					}
				} catch (e) {
					// Silently ignore price calculation errors
				}
			}

			const finalID = ID === undefined ? targetTexture : (ID + (ID < 256 ? 0 : totalOffset)) * 65536;
			form.button(buttonRawtext, finalID.toString());
		}

		// Return wrapped response with inventory slot mapping and auto-reopen
		return form.show(player).then(response => {
			if (!response.canceled && response.selection !== undefined) {
				// Add inventorySlot property if button clicked is an inventory item
				response.inventorySlot = inventorySlotMap.get(response.selection) ?? null;

				// Add reopen helper
				response.reopen = () => this.show(player, options);

				// ✅ UNIVERSAL AUTO-REOPEN: Works for ALL modules
				// Cancel any pending reopen on ANY click (prevents double reopen)
				if (pendingAutoReopens.has(playerId)) {
					system.clearRun(pendingAutoReopens.get(playerId));
					pendingAutoReopens.delete(playerId);
				}

				// Schedule reopen ONLY for inventory clicks
				// autoReopenInventory option allows modules to disable if needed
				if (autoReopenInventory && response.inventorySlot !== null) {
					const timeoutId = system.runTimeout(() => {
						// Don't delete here - keeps timeout ID for cancellation
						this.show(player, options);
					}, 3); // 3 ticks - reliable timing

					pendingAutoReopens.set(playerId, timeoutId);
				}
			}
			return response;
		});
	}
}

class FurnaceFormData {
	#titleText; #buttonArray;
	constructor(isLit = false) {
		/** @internal */
		this.#titleText = { rawtext: [{ text: isLit ? '§f§u§r§n§a§c§e§l§i§t§r' : '§f§u§r§n§a§c§e§r' }] };
		/** @internal */
		this.#buttonArray = Array(3).fill(['', undefined]);
		this.slotCount = 3;
	}
	title(text) {
		if (typeof text === 'string') {
			this.#titleText.rawtext.push({ text });
		}
		else if (typeof text === 'object' && text.rawtext) {
			this.#titleText.rawtext.push(...text.rawtext);
		}
		else {
			this.#titleText.rawtext.push({ text: '' });
		}
		return this;
	}
	button(slot, itemName, itemDesc, texture, stackSize = 1, durability = 0, enchanted = false) {
		const displayTexture = getDisplayTexture(texture);
		const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
		const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
		let buttonRawtext = {
			rawtext: [{ text: `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r` }]
		};

		if (typeof itemName === 'string') {
			buttonRawtext.rawtext.push({ text: itemName ? `${itemName}§r` : '§r' });
		}
		else if (typeof itemName === 'object' && itemName.rawtext) {
			buttonRawtext.rawtext.push(...itemName.rawtext, { text: '§r' });
		}
		else return;
		if (Array.isArray(itemDesc) && itemDesc.length) {
			itemDesc.forEach(obj => {
				if (typeof obj === 'string') {
					buttonRawtext.rawtext.push({ text: `\n${obj}` });
				} else if (typeof obj === 'object' && obj.rawtext) {
					buttonRawtext.rawtext.push({ text: `\n` }, ...obj.rawtext);
				}
			});
		}
		if (ID === undefined) {
			this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [buttonRawtext, targetTexture]);
		} else {
			const totalOffset = getTotalCustomItemOffset() || number_of_custom_items;
			const safeID = ID + (ID < 256 ? 0 : totalOffset);
			this.#buttonArray.splice(Math.max(0, Math.min(slot, this.slotCount - 1)), 1, [
				buttonRawtext,
				(safeID * 65536) + (enchanted ? 32768 : 0)
			]);
		}
		return this;
	}
	show(player) {
		const form = new ActionFormData().title(this.#titleText);
		this.#buttonArray.forEach(button => {
			form.button(button[0], button[1]?.toString());
		});
		if (!inventory_enabled) return form.show(player);
		const totalOffset = getTotalCustomItemOffset() || number_of_custom_items;
		/** @type {Container} */
		const container = player.getComponent('inventory').container;

		// Track inventory slot mapping: button index -> inventory slot
		const inventorySlotMap = new Map();
		let buttonIndex = this.slotCount; // Start after furnace buttons

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);

			// Map this button index to the actual inventory slot (INCLUDING EMPTY SLOTS)
			inventorySlotMap.set(buttonIndex, i);
			buttonIndex++;

			// If empty slot, use empty string to make it non-clickable
			if (!item) {
				form.button('', undefined);
				continue;
			}

			const typeId = item.typeId;
			const displayTexture = getDisplayTexture(typeId);
			const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
			const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
			const durability = item.getComponent('durability');
			const durDamage = durability ? Math.round((durability.maxDurability - durability.damage) / durability.maxDurability * 99) : 0;
			const amount = item.amount;
			const formattedItemName = typeId.replace(/.*(?<=:)/, '').replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
			let buttonRawtext = {
				rawtext: [
					{
						text: `stack#${String(amount).padStart(2, '0')}dur#${String(durDamage).padStart(2, '0')}§r${formattedItemName}`
					}
				]
			};
			const loreText = item.getLore().join('\n');
			if (loreText) buttonRawtext.rawtext.push({ text: loreText });
			const finalID = ID === undefined ? targetTexture : (ID + (ID < 256 ? 0 : totalOffset)) * 65536;
			form.button(buttonRawtext, finalID.toString());
		}

		// Return wrapped response with inventory slot mapping
		return form.show(player).then(response => {
			if (!response.canceled && response.selection !== undefined) {
				// Add inventorySlot property if button clicked is an inventory item
				response.inventorySlot = inventorySlotMap.get(response.selection) ?? null;
			}
			return response;
		});
	}
}

export { ChestFormData, FurnaceFormData };