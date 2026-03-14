# Radxa X4 — NVMe Active Cooling Setup

Complete guide to set up a 4-wire PWM fan with heatsink on Radxa X4 running Ubuntu.

## Hardware Setup

### 4-Wire PWM Fan Connections

```
Fan Connector          Radxa X4
├─ Red (12V)    ────→ +12V power rail
├─ Black (GND)  ────→ GND
├─ Yellow (RPM) ────→ GPIO input (optional, for monitoring)
└─ Green (PWM)  ────→ PWM GPIO pin (e.g., GPIO3_C4)
```

### Heatsink Installation

1. **Clean NVMe:** Remove any stickers, apply thin thermal paste layer
2. **Install heatsink:** Secure to NVMe with thermal adhesive or clip
3. **Attach fan:** Mount 50mm fan above heatsink for airflow
4. **Verify clearance:** Ensure fan doesn't interfere with case/display

---

## Software Setup (Ubuntu)

### Step 1: Identify PWM Pin

```bash
# List available PWM chips
ls -la /sys/class/pwm/

# Output example:
# drwxr-xr-x pwmchip0 -> ../../devices/platform/fe680000.pwm/pwm/pwmchip0/
# drwxr-xr-x pwmchip1 -> ../../devices/platform/fe6a0000.pwm/pwm/pwmchip1/

# For Radxa X4, typically pwmchip0 (GPIO3_C4) is available
```

### Step 2: Enable PWM (One-time)

```bash
# Check if pwm0 is already exported
ls /sys/class/pwm/pwmchip0/

# If pwm0 doesn't exist, export it:
sudo bash -c 'echo 0 > /sys/class/pwm/pwmchip0/export'

# Verify:
ls /sys/class/pwm/pwmchip0/pwm0/
# Should show: device  period  duty_cycle
```

### Step 3: Configure PWM Frequency

```bash
# 4-wire PWM fans typically run at 25kHz
# 25kHz = 40,000ns period, but we'll use 1MHz (1,000,000ns) for compatibility

sudo bash -c 'echo 1000000 > /sys/class/pwm/pwmchip0/pwm0/period'

# Verify:
cat /sys/class/pwm/pwmchip0/pwm0/period
# Should output: 1000000
```

### Step 4: Verify NVMe Temperature Sensor

```bash
# Find NVMe temp sensor path
ls /sys/class/nvme/nvme0/device/hwmon/

# Example output:
# hwmon0

# Test reading temperature
cat /sys/class/nvme/nvme0/device/hwmon/hwmon0/temp1_input

# Should output something like: 42000 (meaning 42°C)
```

### Step 5: Install Fan Control Script

```bash
# Copy script to system location
sudo cp /home/phill/.openclaw/workspace/scripts/radxa-nvme-fan-control.sh \
         /usr/local/bin/radxa-nvme-fan-control.sh

# Make executable
sudo chmod +x /usr/local/bin/radxa-nvme-fan-control.sh

# Test manually (run in background, watch output)
sudo /usr/local/bin/radxa-nvme-fan-control.sh &
tail -f /var/log/nvme-fan-control.log
```

### Step 6: Install Systemd Service

```bash
# Copy service file
sudo cp /home/phill/.openclaw/workspace/scripts/radxa-nvme-fan-control.service \
        /etc/systemd/system/radxa-nvme-fan-control.service

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start
sudo systemctl enable radxa-nvme-fan-control.service

# Start service
sudo systemctl start radxa-nvme-fan-control.service

# Verify running
sudo systemctl status radxa-nvme-fan-control.service

# Watch logs live
sudo journalctl -u radxa-nvme-fan-control.service -f
```

---

## Temperature Control Logic

```
Temperature     Fan Speed   Status
─────────────   ──────────  ────────────
< 30°C          0%          OFF
30°C            10%         RAMPING UP
45°C            50%         MEDIUM
60°C            100%        MAX
> 75°C          100%        CRITICAL ALERT
```

**Tuning:** Edit thresholds in `radxa-nvme-fan-control.sh`:
```bash
TEMP_MIN=30       # Fan starts here
TEMP_MAX=60       # Fan reaches max here
TEMP_CRITICAL=75  # Alert temperature
```

---

## Monitoring

### Check Current Status

```bash
# View last 20 log entries
sudo tail -20 /var/log/nvme-fan-control.log

# Watch live
sudo journalctl -u radxa-nvme-fan-control.service -f

# Check NVMe temp directly
cat /sys/class/nvme/nvme0/device/hwmon/hwmon0/temp1_input
```

### Verify Fan Speed

```bash
# Read current PWM duty cycle (0-1000000 = 0-100%)
cat /sys/class/pwm/pwmchip0/pwm0/duty_cycle

# If value is:
# 0        = fan off
# 500000   = fan at 50%
# 1000000  = fan at 100%
```

### Monitor Service Health

```bash
# Check service is running
sudo systemctl is-active radxa-nvme-fan-control.service

# Check restart count (if failing)
sudo systemctl status radxa-nvme-fan-control.service

# View detailed logs with timestamps
sudo journalctl -u radxa-nvme-fan-control.service --since "1 hour ago"
```

---

## Troubleshooting

### PWM Not Found

```bash
# Error: "PWM control not found at /sys/class/pwm/pwmchip0/pwm0/duty_cycle"

# Solution: Check which PWM chip is available
ls /sys/class/pwm/
# If only pwmchip0 exists without pwm0:
sudo bash -c 'echo 0 > /sys/class/pwm/pwmchip0/export'

# Or try pwmchip1:
sudo bash -c 'echo 0 > /sys/class/pwm/pwmchip1/export'
```

### Temperature Sensor Not Found

```bash
# Error: "NVMe temp sensor not found"

# Solution: Find correct hwmon path
ls /sys/class/nvme/nvme0/device/hwmon/
# If hwmon0 doesn't exist, check hwmon1, hwmon2, etc.

# Update script NVME_TEMP_PATH to correct path
```

### Fan Not Spinning

```bash
# Check fan connections: Red/Black to power, Green to GPIO PWM

# Verify PWM is writing:
cat /sys/class/pwm/pwmchip0/pwm0/duty_cycle
# Should be > 0 if temp > 30°C

# Check fan specs: confirm it's 4-wire PWM (not 3-wire)
# 3-wire fans don't have PWM control

# Test fan manually: connect to +12V directly (should spin)
```

### Service Won't Start

```bash
# Check logs
sudo journalctl -u radxa-nvme-fan-control.service -n 50

# Run script manually for detailed errors
sudo /usr/local/bin/radxa-nvme-fan-control.sh

# Check file permissions
ls -la /usr/local/bin/radxa-nvme-fan-control.sh
# Should be: -rwxr-xr-x
```

---

## Performance Impact

- **CPU usage:** <1% (sleeps 5 seconds between reads)
- **Memory:** ~10MB
- **Disk I/O:** None (only reads sysfs, writes PWM)
- **Latency:** No impact on FiberQuest agent performance

---

## Integration with FiberQuest Agent

The fan control runs independently in the background. Your FiberQuest Agent systemd service can coexist:

```bash
# Both services run together:
sudo systemctl status radxa-nvme-fan-control.service
sudo systemctl status fiberquest-agent.service

# No conflicts — one manages cooling, one manages escrow
```

---

## Testing the Setup

```bash
# 1. Verify service started
sudo systemctl status radxa-nvme-fan-control.service

# 2. Check current temp
cat /sys/class/nvme/nvme0/device/hwmon/hwmon0/temp1_input

# 3. Check PWM value
cat /sys/class/pwm/pwmchip0/pwm0/duty_cycle

# 4. Listen for fan (should hear startup spin)

# 5. Stress test NVMe to raise temp
sudo fio --name=randread --ioengine=libaio --iodepth=16 --rw=randread \
         --bs=4k --direct=1 --size=100G --numjobs=4 \
         --filename=/dev/nvme0n1 --group_reporting

# 6. Watch logs while stressing
sudo journalctl -u radxa-nvme-fan-control.service -f
```

---

## Summary

✅ **Hardware:** 4-wire PWM fan + heatsink connected
✅ **Software:** Ubuntu systemd service auto-starts on boot
✅ **Control:** Temperature-based PWM scaling (30-60°C range)
✅ **Monitoring:** Logs all activity, alerts on critical temps
✅ **Integration:** Runs alongside FiberQuest Agent seamlessly

**Result:** Radxa X4 NVMe stays cool, stable, and ready for 24/7 operation. 🎯
