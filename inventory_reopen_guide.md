# ChestFormData - Inventory Click Handling Guide

## Quick Pattern

When using `ChestFormData` with inventory display, handle inventory clicks to prevent the menu from closing:

```javascript
form.show(player).then(response => {
    if (response.canceled) return;
    
    // ✅ ALWAYS check inventory clicks FIRST
    if (response.inventorySlot !== null) {
        system.runTimeout(() => reopenMenu(player), 1);
        return;
    }
    
    // Handle menu button clicks
    const slot = response.selection;
    if (slot === 0) {
        // Button action...
    }
});
```

## Key Rules

1. **Check `inventorySlot` FIRST** - Before any button logic
2. **Use 1-tick delay** - `system.runTimeout(..., 1)`
3. **Return immediately** - Don't continue to button handlers
4. **Reopen the same form** - Call your menu function again

## Understanding `inventorySlot`

The `response` object includes:
- **`inventorySlot`**: The player's inventory slot number (0-35) if clicked, or `null` if a menu button was clicked
- **`inventorySlotMap`**: Map of button indices to inventory slots (advanced usage)
- **`selection`**: The button index that was clicked

## Common Patterns

### Menu with Info Button
```javascript
export function showInfoMenu(player) {
    const form = new ChestFormData('27');
    form.title('Info Menu');
    form.button(13, 'Information', ['Click to view'], 'minecraft:book');
    
    form.show(player).then(response => {
        if (response.canceled) return;
        
        // Inventory reopen
        if (response.inventorySlot !== null) {
            system.runTimeout(() => showInfoMenu(player), 1);
            return;
        }
        
        // Info button - show message then reopen
        if (response.selection === 13) {
            player.sendMessage('§aHere is some info!');
            system.runTimeout(() => showInfoMenu(player), 5);
        }
    });
}
```

### Menu with Navigation
```javascript
export function showMainMenu(player) {
    const form = new ChestFormData('27');
    form.title('Main Menu');
    form.button(10, 'Settings', [...], 'minecraft:gear');
    form.button(16, 'Close', [...], 'minecraft:barrier');
    
    form.show(player).then(response => {
        if (response.canceled) return;
        
        // Inventory reopen
        if (response.inventorySlot !== null) {
            system.runTimeout(() => showMainMenu(player), 1);
            return;
        }
        
        const slot = response.selection;
        
        // Navigate to settings
        if (slot === 10) {
            system.runTimeout(() => showSettingsMenu(player), 5);
        }
        // Close button
        else if (slot === 16) {
            player.sendMessage('§cMenu closed');
            // Don't reopen
        }
    });
}
```

### Menu with Pagination
```javascript
export function showPagedMenu(player, page = 0) {
    const form = new ChestFormData('54');
    form.title(`Items - Page ${page + 1}`);
    
    // Previous/Next buttons
    if (page > 0) {
        form.button(45, '◀ Back', [...], 'minecraft:arrow');
    }
    form.button(53, 'Next ▶', [...], 'minecraft:arrow');
    
    form.show(player).then(response => {
        if (response.canceled) return;
        
        // Inventory reopen
        if (response.inventorySlot !== null) {
            system.runTimeout(() => showPagedMenu(player, page), 1);
            return;
        }
        
        const slot = response.selection;
        
        // Navigation
        if (slot === 45 && page > 0) {
            system.runTimeout(() => showPagedMenu(player, page - 1), 5);
        } else if (slot === 53) {
            system.runTimeout(() => showPagedMenu(player, page + 1), 5);
        }
    });
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Menu closes when clicking inventory | Add `inventorySlot` check at the start |
| Menu reopens twice | Remove duplicate reopen calls |
| Buttons don't work after inventory click | Ensure `return` after inventory handler |
| Delay feels wrong | Use 1 tick for inventory, 5 ticks for navigation |

## Best Practices

✅ **DO:**
- Check `inventorySlot` before any button logic
- Use `system.runTimeout(() => menu(player), 1)` for inventory reopens
- Use `system.runTimeout(() => nextMenu(player), 5)` for navigation
- Return early after inventory handler

❌ **DON'T:**
- Skip the inventory check if you have menu buttons
- Use longer delays for inventory reopens (causes flickering)
- Continue to button handlers after inventory detection
- Forget to import `system` from `@minecraft/server`

## Template

Copy this template for new menus:

```javascript
import { system } from '@minecraft/server';
import { ChestFormData } from '../path/to/forms.js';

export function showMyMenu(player) {
    const form = new ChestFormData('27');
    form.title('My Menu');
    
    // Add your buttons
    form.button(0, 'Button 1', ['Description'], 'minecraft:diamond');
    
    form.show(player).then(response => {
        if (response.canceled) return;
        
        // Inventory handler (ALWAYS FIRST)
        if (response.inventorySlot !== null) {
            system.runTimeout(() => showMyMenu(player), 1);
            return;
        }
        
        // Button handlers
        const slot = response.selection;
        if (slot === 0) {
            // Handle button 1
        }
    });
}
```

---

**Note:** This pattern ensures smooth UX where clicking inventory items doesn't accidentally close your menu.
