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
		lower.includes('shovel') || lower.includes('hoe') || lower.includes('trident') ||
		lower.includes('spear') || lower.includes('mace')) {
		return 'mainhand';
	}

	if (lower.includes('helmet') || lower.includes('_head')) return 'head';
	if (lower.includes('chestplate') || lower.includes('_chest')) return 'chest';
	if (lower.includes('leggings') || lower.includes('_legs')) return 'legs';
	if (lower.includes('boots') || lower.includes('_feet')) return 'feet';

	return null;
}

const WEAPON_DAMAGE = {
	// Swords - Data akurat dari Minecraft Wiki Bedrock Edition
	'minecraft:wooden_sword': 4, 'minecraft:golden_sword': 4, 'minecraft:stone_sword': 5, 'minecraft:iron_sword': 6, 'minecraft:diamond_sword': 7, 'minecraft:netherite_sword': 8,
	// Axes - Bedrock Edition (1 damage kurang dari sword tier yang sama)
	'minecraft:wooden_axe': 3, 'minecraft:golden_axe': 3, 'minecraft:stone_axe': 4, 'minecraft:iron_axe': 5, 'minecraft:diamond_axe': 6, 'minecraft:netherite_axe': 7,
	// Pickaxes
	'minecraft:wooden_pickaxe': 2, 'minecraft:golden_pickaxe': 2, 'minecraft:stone_pickaxe': 3, 'minecraft:iron_pickaxe': 4, 'minecraft:diamond_pickaxe': 5, 'minecraft:netherite_pickaxe': 6,
	// Shovels
	'minecraft:wooden_shovel': 2, 'minecraft:golden_shovel': 2, 'minecraft:stone_shovel': 3, 'minecraft:iron_shovel': 4, 'minecraft:diamond_shovel': 5, 'minecraft:netherite_shovel': 6,
	// Hoes - All tiers deal 1 damage in Bedrock
	'minecraft:wooden_hoe': 1, 'minecraft:golden_hoe': 1, 'minecraft:stone_hoe': 1, 'minecraft:iron_hoe': 1, 'minecraft:diamond_hoe': 1, 'minecraft:netherite_hoe': 1,
	// Trident - Melee attack damage (Bedrock Edition)
	'minecraft:trident': 8,
	// Spears - Jab attack base damage (range 2-6 damage di Bedrock, estimasi berdasarkan tier)
	// Note: Damage spesifik belum dirilis resmi kecuali Netherite (5 damage confirmed)
	'minecraft:wooden_spear': 2, 'minecraft:stone_spear': 3, 'minecraft:copper_spear': 3, 'minecraft:golden_spear': 2, 'minecraft:iron_spear': 4, 'minecraft:diamond_spear': 4, 'minecraft:netherite_spear': 5,
	// Mace - New weapon from 1.21 "Tricky Trials" update (base damage)
	'minecraft:mace': 6
};

function getAttributeModifiers(item) {
	if (!item) return [];

	const loreLines = [];
	const typeId = item.typeId;
	const slot = getEquipmentSlotName(typeId);

	if (!slot) return [];

	try {
		if (slot === 'mainhand') {
			loreLines.push('§7When in Main Hand:');

			let damage = WEAPON_DAMAGE[typeId] || 1;

			// Check for Sharpness/Power if possible? 
			// Vanilla lore calculation includes enchantments in the "When in Main Hand" number usually.
			// But for now, base damage is a good improvement over "0".

			const enchantComp = item.getComponent('minecraft:enchantable');
			if (enchantComp) {
				const sharpness = enchantComp.getEnchantment('sharpness');
				if (sharpness) {
					// Sharpness adds: 1.25 * level in Bedrock? Or 0.5 * level + 0.5?
					// In Java it's 3 + (0.5 * level) + 0.5?
					// Bedrock: 1.25 * level.
					damage += (1.25 * sharpness.level);
				}
			}

			// Format to 1 decimal place if needed
			damage = Math.round(damage * 100) / 100;

			loreLines.push(`§2 +${damage} Attack Damage`);

			// Note: Bedrock Edition does not have attack cooldown/speed mechanic
			// All weapons attack instantly without cooldown
		}

		if (['head', 'chest', 'legs', 'feet'].includes(slot)) {
			const armorComp = item.getComponent('minecraft:armor');
			if (armorComp) {
				const slotName = {
					'head': 'Head',
					'chest': 'Body', // "Body" or "Chest"? Vanilla says "When on Body" usually? Or "When on Head". Java says "When on Head".
					'legs': 'Legs',
					'feet': 'Feet'
				}[slot] || 'Body';

				// Correct slot name mapping for Java parity if requested
				const displaySlotName = slot === 'chest' ? 'Body' : (slot.charAt(0).toUpperCase() + slot.slice(1));

				loreLines.push(`§7When on ${displaySlotName}:`);

				const protection = armorComp.protection || 0;
				if (protection > 0) {
					loreLines.push(`§2 +${protection} Armor`);
				}

				let toughness = 0;
				if (typeId.includes('netherite')) toughness = 3;
				else if (typeId.includes('diamond')) toughness = 2;

				if (toughness > 0) {
					loreLines.push(`§2 +${toughness} Armor Toughness`);
				}

				if (typeId.includes('netherite')) {
					loreLines.push(`§2 +1 Knockback Resistance`);
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
		const durability = item.getComponent('minecraft:durability');
		if (!durability) return [];

		const current = durability.maxDurability - durability.damage;
		const max = durability.maxDurability;

		return [`§7Durability: ${current} / ${max}`];
	} catch (e) {
		return [];
	}
}

function getPotionLore(item) {
	if (!item) return [];

	try {
		const potionComp = item.getComponent('minecraft:potion');
		if (!potionComp || !potionComp.potionEffectType) return [];

		const loreLines = [];

		// Get effect type and duration
		const effectType = potionComp.potionEffectType;
		const effectId = effectType.id || effectType.name || '';
		const durationTicks = effectType.durationTicks || 0;

		if (!effectId) return [];

		// Format effect name - remove "minecraft:" and clean up
		let effectName = effectId.replace('minecraft:', '').replace(/_/g, ' ');

		// Remove prefixes like "long_", "strong_", etc from display name
		effectName = effectName.replace(/^(long|strong|extended|enhanced)\s+/, '');

		// Capitalize words
		effectName = effectName
			.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		// Convert ticks to time format (20 ticks = 1 second)
		const totalSeconds = Math.floor(durationTicks / 20);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		let timeStr = '';
		if (minutes > 0) {
			timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		} else {
			timeStr = `0:${seconds.toString().padStart(2, '0')}`;
		}

		// Determine color based on effect type (beneficial vs harmful)
		const beneficialEffects = ['regeneration', 'speed', 'strength', 'jump_boost', 'resistance',
			'fire_resistance', 'water_breathing', 'invisibility', 'night_vision',
			'health_boost', 'absorption', 'saturation', 'luck', 'slow_falling', 'conduit_power'];
		const isBeneficial = beneficialEffects.some(effect => effectId.toLowerCase().includes(effect));
		const color = isBeneficial ? '§9' : '§c'; // Blue for beneficial, Red for harmful

		loreLines.push(`${color}${effectName} (${timeStr})`);

		return loreLines;
	} catch (e) {
		return [];
	}
}



function buildJavaStyleLore(item) {
	if (!item) return [];

	const allLore = [];

	const enchantLore = getEnchantmentLore(item);
	if (enchantLore.length > 0) {
		allLore.push(...enchantLore);
		allLore.push('');
	}

	const potionLore = getPotionLore(item);
	if (potionLore.length > 0) {
		allLore.push(...potionLore);
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

	// TypeId and Component count (like Java Edition advanced tooltips)
	allLore.push(`§8${item.typeId}`);

	try {
		const components = item.getComponents();
		if (components && components.length > 0) {
			allLore.push(`§8(${components.length} component${components.length !== 1 ? 's' : ''})`);
		}
	} catch (e) {
		// Ignore if getComponents fails
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
