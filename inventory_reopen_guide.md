# ChestFormData Inventory Click Handling

## The Pattern

When using [ChestFormData] with inventory display, always handle inventory clicks manually:

```javascript
form.show(player).then(response => {
    if (response.canceled) return;
    
    const slot = response.selection;
    
    // ✅ Handle inventory clicks FIRST
    if (response.inventorySlot !== null && response.inventorySlot !== undefined) {
        system.runTimeout(() => showThisMenu(player), 1);
        return;
    }
    
    // Handle menu button clicks
    if (slot === 0) {
        // Action or navigate
    }
});
```

## Key Rules

1. **Check inventory FIRST** - Before any button handlers
2. **Use 1 tick delay** - `system.runTimeout(..., 1)`
3. **Return immediately** - Don't process button logic
4. **Reopen same form** - Call the menu function again

## Common Scenarios

### Info Button (reopen same menu)
```javascript
if (slot === 10) {
    // No action needed - inventory handler will reopen
}
```

### Navigation Button
```javascript
if (slot === 20) {
    system.runTimeout(() => otherMenu(player), 5);
}
```

### Close Button
```javascript
if (slot === 30) {
    player.sendMessage('Menu closed');
    return; // Don't reopen
}
```

## Complete Example

```javascript
export function showMyMenu(player) {
    const form = new ChestFormData('27');
    form.title('My Menu');
    
    form.button(0, 'Info', ['Click for info'], 'minecraft:book');
    form.button(18, 'Close', ['Exit'], 'minecraft:barrier');
    
    form.show(player).then(response => {
        if (response.canceled) return;
        
        const slot = response.selection;
        
        // Inventory handler
        if (response.inventorySlot !== null && response.inventorySlot !== undefined) {
            system.runTimeout(() => showMyMenu(player), 1);
            return;
        }
        
        // Button handlers
        if (slot === 0) {
            // Info button - do nothing, auto-reopen handles it
        } else if (slot === 18) {
            player.sendMessage('Closed');
        }
    });
}
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| UI closes after inventory → button click | Add inventory handler at start |
| UI reopens twice | Remove duplicate reopens (auto + manual) |
| Inventory click doesn't reopen | Check 1 tick delay exists |
| Button doesn't work | Ensure inventory handler returns early |

## forms.js Setting

Default: `autoReopenInventory = false` (manual control recommended)

To enable auto (not recommended):
```javascript
form.show(player, { autoReopenInventory: true })
```

## Why Manual Control?

Auto-reopen and manual handlers run in same `.then()` callback → race condition → unpredictable behavior.

Manual control = full predictability.
