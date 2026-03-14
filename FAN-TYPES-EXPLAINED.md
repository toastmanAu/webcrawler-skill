# 4-Wire PWM vs 3-Wire vs 2-Wire Fans — Which Do You Have?

## Fan Types Explained

### 2-Wire Fan (Voltage Controlled)
```
Red (12V)  ─────→ +12V
Black (GND) ────→ GND
           
Speed control: Vary voltage (0V = off, 12V = max)
Control method: Analog voltage regulator or PWM to analog converter
```

**The AliExpress fan you found:** Likely 2-wire or 3-wire

**Problem:** Radxa X4 PWM control expects 4-wire PWM signal, not voltage variation

---

### 3-Wire Fan (Voltage + RPM Sense)
```
Red (12V)   ────→ +12V
Black (GND) ────→ GND
Yellow (RPM) ───→ GPIO input (tachometer sense only)

Speed control: Voltage only, RPM sensing for monitoring
Control method: Analog voltage regulator
```

**The AliExpress fan you found:** Likely this one

**Problem:** Still can't do proper PWM control on Radxa X4

---

### 4-Wire PWM Fan (Proper PWM Control) ✅
```
Red (12V)    ────→ +12V
Black (GND)  ────→ GND
Yellow (RPM) ────→ GPIO input (tachometer sense)
Green (PWM)  ────→ PWM GPIO pin (duty cycle control)

Speed control: PWM signal (0-100% duty cycle)
Control method: Radxa X4 PWM GPIO directly
```

**This is what we built the script for**

---

## The AliExpress Fan: What You Actually Got

```
"4010 DC 5V 12V 24V 40mm 40x40x10mm Fan"
"With Heat Sink Cooler Cooling Fan 2PIN 3PIN"
```

**Likely specs:**
- 40x40x10mm (compact, good size)
- 2PIN or 3PIN (NOT 4-wire PWM)
- Voltage-controlled (not PWM)
- Works at 5V, 12V, or 24V

**Can it work with Radxa X4?**
- ✅ Yes, but not with the PWM script we built
- You'd need to use **PWM-to-analog converter** (adds complexity)
- Or just run at fixed voltage

---

## Your Options

### Option A: Use This Fan + PWM-to-Analog Converter
```
Radxa X4 PWM pin
    ↓
    └─ PWM-to-analog converter IC (e.g., TL7712)
         ↓
         └─ Variable voltage output
              ↓
              └─ Fan positive rail

Cost: ~$2 for converter IC + resistors
Complexity: Medium (needs soldering)
Result: Works, but adds extra component
```

### Option B: Use This Fan at Fixed Voltage (Simplest)
```
+12V power rail ──→ Fan
GND ──────────────→ Fan

Result: Fan always runs at max speed
Pros: Simplest, no extra components
Cons: Always loud, high power draw
```

### Option C: Find a Proper 4-Wire PWM Fan ✅ (Recommended)

**Search for:**
- "40mm 4-wire PWM fan" on AliExpress
- "40x40x10 4PIN PWM cooling fan"
- "NoctUA 4-wire" (premium option, ~$15)

**Specs to look for:**
- 4-wire or 4PIN in description
- 25kHz PWM frequency mentioned
- Works at 12V or 24V

**Example search:**
```
"40mm 40x40x10 4-pin PWM fan"
Price: $3-8 on AliExpress
Shipping: ~2 weeks
```

---

## What To Do Now

### If You Want to Use the AliExpress Fan:

**Simplest:** Just wire it to +12V and it runs
```bash
# No PWM control needed
# Fan always spins at max
# Works fine, just noisier

Red  → +12V
Black → GND
(Yellow if present: leave disconnected or connect to GPIO for RPM monitoring)
```

**Better:** Add PWM-to-analog converter (~$2 extra)
```
Radxa X4 PWM pin → TL7712 IC → Variable voltage → Fan
```

### If You Want Full PWM Control:

**Get a proper 4-wire PWM fan** and use the script I built
```
Takes advantage of full PWM scaling (0-100%)
Quieter (scales down at low temps)
More efficient power usage
```

---

## My Recommendation

**For your Radxa X4 setup:**

✅ **Best:** Find a proper 4-wire PWM fan
- Search: "40mm 4-pin PWM fan" AliExpress
- Cost: $3-8
- Use the script we built
- Full temperature-based control

⚠️ **If you want to use the fan you found:**
- Wire to +12V (fan always on)
- Works fine, just not temperature-controlled
- Or add PWM-to-analog converter (more complex)

---

## Quick Test

**If you want to check what you have:**

When it arrives, count the wires:
- **2 wires:** Red + Black (voltage controlled, no PWM possible)
- **3 wires:** Red + Black + Yellow (voltage controlled, RPM sense)
- **4 wires:** Red + Black + Yellow + Green (proper PWM, full control)

---

## Bottom Line

The AliExpress fan you found will **work**, but **not with the PWM script** we built.

Your options:
1. **Use it at fixed 12V** (always spins, no temp control) — easiest
2. **Add PWM converter IC** (more complex, adds cost) — medium
3. **Get a 4-wire PWM fan** (proper solution) — recommended

**My call:** Grab a 4-wire PWM fan for $5-8 while you're at it. Makes the whole thing cleaner. ✅
