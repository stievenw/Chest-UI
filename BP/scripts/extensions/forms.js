import { ActionFormData } from '@minecraft/server-ui';
import { custom_content, custom_content_keys, inventory_enabled, number_of_custom_items, CHEST_UI_SIZES } from './constants.js';
import { typeIdToDataId, typeIdToID } from './typeIds.js';
import { getTotalCustomItemOffset } from './itemIdConfig.js';


function getDisplayTexture(texture) {
	if (custom_content_keys.has(texture)) {
		return custom_content[texture].texture;
	}

	if (texture.includes('/') || texture.includes('.png')) {
		return texture;
	}

	const targetTexture = texture;

	const isRegistered = typeIdToDataId.has(targetTexture) || typeIdToID.has(targetTexture);

	if (!isRegistered) {
		return 'minecraft:info_update2';
	}

	return targetTexture;
}

function formatLocalizationKey(key) {
	if (!key) return null;

	try {
		const potionMatch = key.match(/%?potion\.(\w+)(?:\.(splash|linger))?\.name/);
		if (potionMatch) {
			const effectName = potionMatch[1];
			const potionType = potionMatch[2];

			const titleEffect = effectName
				.replace(/([A-Z])/g, ' $1')
				.split(' ')
				.filter(word => word.length > 0)
				.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');

			if (potionType === 'splash') {
				return `Splash Potion of ${titleEffect}`;
			} else if (potionType === 'linger') {
				return `Lingering Potion of ${titleEffect}`;
			} else {
				return `Potion of ${titleEffect}`;
			}
		}

		const itemMatch = key.match(/^%?item\.(\w+)\.(\w+)\.name$/);
		if (itemMatch) {
			const itemType = itemMatch[1];
			const color = itemMatch[2];

			const titleColor = color
				.replace(/([A-Z])/g, ' $1')
				.split(' ')
				.filter(word => word.length > 0)
				.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');

			const titleType = itemType.charAt(0).toUpperCase() + itemType.slice(1);

			return `${titleColor} ${titleType}`;
		}

		const tileMatch = key.match(/^%?tile\.(\w+)\.(\w+)\.name$/);
		if (tileMatch) {
			const tileType = tileMatch[1];
			const color = tileMatch[2];

			const titleColor = color
				.replace(/([A-Z])/g, ' $1')
				.split(' ')
				.filter(word => word.length > 0)
				.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(' ');

			let titleType = tileType;
			if (tileType === 'stainedHardenedClay') {
				titleType = 'Terracotta';
			} else {
				titleType = tileType.charAt(0).toUpperCase() + tileType.slice(1);
			}

			return `${titleColor} ${titleType}`;
		}

		let formatted = key
			.replace(/^%?item\./, '')
			.replace(/^%?tile\./, '')
			.replace(/^%?potion\./, '')
			.replace(/\.name$/, '');

		formatted = formatted
			.replace(/_/g, ' ')
			.replace(/\./g, ' ');

		return formatted
			.split(' ')
			.filter(word => word.length > 0)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

	} catch (e) {
		return null;
	}
}

function getVariantTypeId(item) {
	if (!item || !item.typeId) return null;

	try {
		const baseTypeId = item.typeId;
		const locKey = item.localizationKey;

		if (!locKey) return baseTypeId;

		if (baseTypeId === 'minecraft:bed') {
			const match = locKey.match(/item\.bed\.(\w+)\.name/);
			if (match) {
				const color = match[1];
				return `minecraft:${color}_bed`;
			}
		}

		if (baseTypeId === 'minecraft:banner') {
			const match = locKey.match(/item\.banner\.(\w+)\.name/);
			if (match) {
				let color = match[1];
				color = color.replace(/([A-Z])/g, '_$1').toLowerCase();
				return `minecraft:${color}_banner`;
			}
		}

		if (baseTypeId === 'minecraft:wool') {
			const match = locKey.match(/item\.wool\.(\w+)\.name/);
			if (match) {
				const color = match[1];
				return `minecraft:${color}_wool`;
			}
		}

		if (baseTypeId === 'minecraft:carpet') {
			const match = locKey.match(/item\.carpet\.(\w+)\.name/);
			if (match) {
				const color = match[1];
				return `minecraft:${color}_carpet`;
			}
		}

		if (baseTypeId === 'minecraft:dye') {
			const match = locKey.match(/item\.dye\.(\w+)\.name/);
			if (match) {
				const color = match[1];
				return `minecraft:${color}_dye`;
			}
		}

		if (baseTypeId === 'minecraft:concrete') {
			const match = locKey.match(/tile\.concrete\.(\w+)\.name/);
			if (match) {
				const color = match[1];
				return `minecraft:${color}_concrete`;
			}
		}

		if (baseTypeId === 'minecraft:stained_hardened_clay' || baseTypeId === 'minecraft:terracotta') {
			const match = locKey.match(/tile\.stainedHardenedClay\.(\w+)\.name/);
			if (match) {
				const color = match[1];
				return `minecraft:${color}_terracotta`;
			}
		}

		if (baseTypeId === 'minecraft:potion' || baseTypeId === 'minecraft:splash_potion' || baseTypeId === 'minecraft:lingering_potion') {
			const potionMatch = locKey.match(/%?potion\.(\w+)(?:\.(splash|linger))?\.name/);
			if (potionMatch) {
				const effectName = potionMatch[1];
				const potionType = potionMatch[2];

				const snakeEffect = effectName.replace(/([A-Z])/g, '_$1').toLowerCase();

				if (potionType === 'splash') {
					return `minecraft:${snakeEffect}_splash_potion`;
				} else if (potionType === 'linger') {
					return `minecraft:${snakeEffect}_lingering_potion`;
				} else {
					return `minecraft:${snakeEffect}_potion`;
				}
			}
		}

		return baseTypeId;

	} catch (e) {
		return item.typeId;
	}
}

function getItemDisplayName(item) {
	if (!item) return 'Unknown Item';

	if (item.nameTag && item.nameTag.trim() !== '') {
		return item.nameTag;
	}

	const variantBaseTypes = [
		'minecraft:bed',
		'minecraft:banner',
		'minecraft:wool',
		'minecraft:carpet',
		'minecraft:dye',
		'minecraft:concrete',
		'minecraft:stained_hardened_clay',
		'minecraft:terracotta',
		'minecraft:potion',
		'minecraft:splash_potion',
		'minecraft:lingering_potion'
	];

	const isVariantItem = variantBaseTypes.includes(item.typeId);

	if (isVariantItem) {
		try {
			if (item.localizationKey) {
				const formatted = formatLocalizationKey(item.localizationKey);
				if (formatted) return formatted;
			}
		} catch (e) {
		}
	}

	try {
		if (!item.typeId) return 'Unknown Item';

		return item.typeId
			.replace(/minecraft:/, '')
			.replace(/_/g, ' ')
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	} catch (e) {
		return 'Unknown Item';
	}
}

function getEnchantmentLore(item) {
	if (!item) return [];

	const enchantComp = item.getComponent('enchantable');
	if (!enchantComp || !enchantComp.getEnchantments) return [];

	const enchantments = enchantComp.getEnchantments();
	if (enchantments.length === 0) return [];

	const loreLines = [];

	const toRoman = (num) => {
		const romanNumerals = {
			1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
			6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
		};
		return romanNumerals[num] || String(num);
	};

	const formatEnchantName = (enchantId) => {
		const name = enchantId.replace(/^minecraft:/, '').replace(/_/g, ' ');
		return name.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
	};

	for (const enchant of enchantments) {
		const enchantName = formatEnchantName(enchant.type.id);
		const level = enchant.level;
		const romanLevel = level > 1 ? ` ${toRoman(level)}` : '';

		const isCurse = enchant.type.id.includes('curse');
		const color = isCurse ? '§c' : '§9';

		loreLines.push(`${color}${enchantName}${romanLevel}`);
	}

	return loreLines;
}

function getEquipmentSlotName(typeId) {
	if (!typeId) return null;

	const lower = typeId.toLowerCase();

	if (lower.includes('sword') || lower.includes('axe') || lower.includes('pickaxe') ||
		lower.includes('shovel') || lower.includes('hoe') || lower.includes('trident')) {
		return 'mainhand';
	}

	if (lower.includes('helmet') || lower.includes('_head')) return 'head';
	if (lower.includes('chestplate') || lower.includes('_chest')) return 'chest';
	if (lower.includes('leggings') || lower.includes('_legs')) return 'legs';
	if (lower.includes('boots') || lower.includes('_feet')) return 'feet';

	return null;
}

function getAttributeModifiers(item) {
	if (!item) return [];

	const loreLines = [];
	const typeId = item.typeId;
	const slot = getEquipmentSlotName(typeId);

	if (!slot) return [];

	try {
		if (slot === 'mainhand') {
			const damageComp = item.getComponent('minecraft:damage');
			if (damageComp) {
				loreLines.push('§7When in Main Hand:');

				const damage = damageComp.damage || 0;
				loreLines.push(`§2 ${damage} Attack Damage`);

				let attackSpeed = 1.6;
				if (typeId.includes('sword')) attackSpeed = 1.6;
				else if (typeId.includes('axe')) attackSpeed = 0.8;
				else if (typeId.includes('pickaxe')) attackSpeed = 1.2;
				else if (typeId.includes('shovel')) attackSpeed = 1.0;
				else if (typeId.includes('hoe')) attackSpeed = 1.0;

				loreLines.push(`§2 ${attackSpeed} Attack Speed`);
			}
		}

		if (['head', 'chest', 'legs', 'feet'].includes(slot)) {
			const armorComp = item.getComponent('minecraft:armor');
			if (armorComp) {
				const slotName = {
					'head': 'Head',
					'chest': 'Chest',
					'legs': 'Legs',
					'feet': 'Feet'
				}[slot];

				loreLines.push(`§7When on ${slotName}:`);

				const protection = armorComp.protection || 0;
				if (protection > 0) {
					loreLines.push(`§2 +${protection} Armor`);
				}

				if (typeId.includes('diamond') || typeId.includes('netherite')) {
					let toughness = 0;
					if (typeId.includes('netherite')) toughness = 3;
					else if (typeId.includes('diamond')) toughness = 2;

					if (toughness > 0) {
						loreLines.push(`§2 +${toughness} Armor Toughness`);
					}
				}

				if (typeId.includes('netherite')) {
					loreLines.push(`§2 +0.1 Knockback Resistance`);
				}
			}
		}
	} catch (e) {
	}

	return loreLines;
}

function getDurabilityLore(item) {
	if (!item) return [];

	try {
		const durability = item.getComponent('durability');
		if (!durability) return [];

		const current = durability.maxDurability - durability.damage;
		const max = durability.maxDurability;

		return [`§7Durability: ${current} / ${max}`];
	} catch (e) {
		return [];
	}
}

function getArmorTrimLore(item) {
	if (!item) return [];

	try {
		const trimComp = item.getComponent('minecraft:trim');
		if (!trimComp) return [];

		const loreLines = [];

		loreLines.push('§7Upgrade:');
		loreLines.push('§9 Armor Trim');

		return loreLines;
	} catch (e) {
		return [];
	}
}

function getComponentCount(item) {
	if (!item) return 0;

	try {
		const components = item.getComponents();
		return components.length;
	} catch (e) {
		return 0;
	}
}

function buildJavaStyleLore(item) {
	if (!item) return [];

	const allLore = [];

	const trimLore = getArmorTrimLore(item);
	if (trimLore.length > 0) {
		allLore.push(...trimLore);
		allLore.push('');
	}

	const enchantLore = getEnchantmentLore(item);
	if (enchantLore.length > 0) {
		allLore.push(...enchantLore);
		allLore.push('');
	}

	const attributeLore = getAttributeModifiers(item);
	if (attributeLore.length > 0) {
		allLore.push(...attributeLore);
	}

	const durabilityLore = getDurabilityLore(item);
	if (durabilityLore.length > 0) {
		allLore.push(...durabilityLore);
	}

	allLore.push(`§8${item.typeId}`);

	const componentCount = getComponentCount(item);
	if (componentCount > 0) {
		allLore.push(`§8(${componentCount} components)`);
	}

	const customLore = item.getLore();
	if (customLore.length > 0) {
		const filteredLore = customLore.filter(line => {
			return !line.toLowerCase().includes('worth:');
		});

		if (filteredLore.length > 0) {
			allLore.push('');
			allLore.push(...filteredLore);
		}
	}

	return allLore;
}

class ChestFormData {
	#titleText; #buttonArray; #inventoryOverrides;
	constructor(size = 'small') {
		const sizing = CHEST_UI_SIZES.get(size) ?? ['§c§h§e§s§t§2§7§r', 27];
		/** @internal */
		this.#titleText = { rawtext: [{ text: `${sizing[0]}` }] };
		/** @internal */
		const emptyButton = ['', undefined];
		this.#buttonArray = Array(sizing[1]).fill(null).map(() => [...emptyButton]);
		this.slotCount = sizing[1];
		/** @internal */
		this.#inventoryOverrides = new Map();
	}

	/**
	 * Override specific inventory slot display
	 * @param {number} slot - Inventory slot index (0-35)
	 * @param {Object} data - Override data
	 * @param {number} [data.amount] - Amount to display (<= 0 makes slot appear empty)
	 */
	overrideInventorySlot(slot, data) {
		this.#inventoryOverrides.set(slot, data);
		return this;
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
			rawtext: []
		};
		const prefix = `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r`;

		if (typeof itemName === 'string') {
			buttonRawtext.rawtext.push({ text: prefix + (itemName ? `${itemName}§r` : '§r') });
		}
		else if (typeof itemName === 'object' && itemName.rawtext) {
			buttonRawtext.rawtext.push({ text: prefix }, ...itemName.rawtext, { text: '§r' });
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
				const prefix = `stack#${stackSize}dur#${durValue}§r`;
				let buttonRawtext = {
					rawtext: []
				};
				if (typeof itemName === 'string') {
					buttonRawtext.rawtext.push({ text: prefix + `${itemName}§r` });
				}
				else if (itemName?.rawtext) {
					buttonRawtext.rawtext.push({ text: prefix }, ...itemName.rawtext, { text: '§r' });
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
	show(player) {
		const form = new ActionFormData().title(this.#titleText);
		this.#buttonArray.forEach(button => {
			form.button(button[0], button[1]?.toString());
		});
		if (!inventory_enabled) return form.show(player);
		const totalOffset = getTotalCustomItemOffset() || number_of_custom_items;
		/** @type {Container} */
		const container = player.getComponent('inventory').container;

		const inventorySlotMap = new Map();
		let buttonIndex = this.slotCount;

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);

			let amount = item ? item.amount : 0;
			let overrideName = null;
			let overrideDesc = null;

			const override = this.#inventoryOverrides.get(i);

			if (override) {
				if (override.amount !== undefined) {
					amount = override.amount;
				}
				if (override.itemName !== undefined) {
					overrideName = override.itemName;
				}
				if (override.itemDesc !== undefined) {
					overrideDesc = override.itemDesc;
				}
			}

			inventorySlotMap.set(buttonIndex, i);
			buttonIndex++;

			if (amount <= 0) {
				form.button('', undefined);
				continue;
			}

			const variantTypeId = getVariantTypeId(item);
			const typeId = variantTypeId || (item ? item.typeId : 'minecraft:air');
			const displayTexture = getDisplayTexture(typeId);
			const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
			const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
			const durability = item ? item.getComponent('durability') : null;
			const durDamage = (durability && durability.damage > 0) ? Math.max(1, Math.round((durability.maxDurability - durability.damage) / durability.maxDurability * 99)) : 0;

			const itemDisplayName = overrideName || getItemDisplayName(item);

			const enchantComp = item ? item.getComponent('enchantable') : null;
			const hasEnchantments = enchantComp && enchantComp.getEnchantments && enchantComp.getEnchantments().length > 0;

			let buttonRawtext = {
				rawtext: [
					{
						text: `stack#${String(amount).padStart(2, '0')}dur#${String(durDamage).padStart(2, '0')}§r${itemDisplayName}`
					}
				]
			};

			if (overrideDesc) {
				if (Array.isArray(overrideDesc)) {
					for (const line of overrideDesc) {
						buttonRawtext.rawtext.push({ text: '\n' + line });
					}
				} else if (typeof overrideDesc === 'string') {
					buttonRawtext.rawtext.push({ text: '\n' + overrideDesc });
				}
			}

			if (item) {
				const javaLore = buildJavaStyleLore(item);
				for (const line of javaLore) {
					buttonRawtext.rawtext.push({ text: '\n' + line });
				}
			}

			const finalID = ID === undefined ? targetTexture : ((ID + (ID < 256 ? 0 : totalOffset)) * 65536) + (hasEnchantments ? 32768 : 0);
			form.button(buttonRawtext, finalID.toString());
		}

		return form.show(player).then(response => {
			if (!response.canceled && response.selection !== undefined) {
				response.inventorySlot = inventorySlotMap.get(response.selection) ?? null;
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
			rawtext: []
		};
		const prefix = `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r`;

		if (typeof itemName === 'string') {
			buttonRawtext.rawtext.push({ text: prefix + (itemName ? `${itemName}§r` : '§r') });
		}
		else if (typeof itemName === 'object' && itemName.rawtext) {
			buttonRawtext.rawtext.push({ text: prefix }, ...itemName.rawtext, { text: '§r' });
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

		const inventorySlotMap = new Map();
		let buttonIndex = this.slotCount;

		for (let i = 0; i < container.size; i++) {
			const item = container.getItem(i);

			inventorySlotMap.set(buttonIndex, i);
			buttonIndex++;

			if (!item) {
				form.button('', undefined);
				continue;
			}

			const variantTypeId = getVariantTypeId(item);
			const typeId = variantTypeId || item.typeId;
			const displayTexture = getDisplayTexture(typeId);
			const targetTexture = custom_content_keys.has(displayTexture) ? custom_content[displayTexture]?.texture : displayTexture;
			const ID = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
			const durability = item.getComponent('durability');
			const durDamage = (durability && durability.damage > 0) ? Math.max(1, Math.round((durability.maxDurability - durability.damage) / durability.maxDurability * 99)) : 0;
			const amount = item.amount;

			const itemDisplayName = getItemDisplayName(item);

			const enchantComp = item.getComponent('enchantable');
			const hasEnchantments = enchantComp && enchantComp.getEnchantments && enchantComp.getEnchantments().length > 0;

			let buttonRawtext = {
				rawtext: [
					{
						text: `stack#${String(amount).padStart(2, '0')}dur#${String(durDamage).padStart(2, '0')}§r${itemDisplayName}`
					}
				]
			};

			const javaLore = buildJavaStyleLore(item);
			for (const line of javaLore) {
				buttonRawtext.rawtext.push({ text: '\n' + line });
			}

			const finalID = ID === undefined ? targetTexture : ((ID + (ID < 256 ? 0 : totalOffset)) * 65536) + (hasEnchantments ? 32768 : 0);
			form.button(buttonRawtext, finalID.toString());
		}

		return form.show(player).then(response => {
			if (!response.canceled && response.selection !== undefined) {
				response.inventorySlot = inventorySlotMap.get(response.selection) ?? null;
			}
			return response;
		});
	}
}

export { ChestFormData, FurnaceFormData, getVariantTypeId, buildJavaStyleLore };
