#!/bin/bash
#
# Radxa X4 NVMe Active Cooling Control
# 4-wire PWM fan + heatsink thermal management
# Monitors NVMe temp, controls fan speed via sysfs PWM
#
# Setup:
# 1. Connect 4-wire fan:
#    - Red: +12V (or +5V depending on fan)
#    - Black: GND
#    - Yellow: RPM sense (optional, for monitoring)
#    - Green: PWM control (to GPIO PWM pin)
#
# 2. Find your PWM chip and pin:
#    ls -la /sys/class/pwm/
#    # Look for pwmchip0 or pwmchip1
#
# 3. Enable PWM:
#    sudo bash -c 'echo 1 > /sys/class/pwm/pwmchip0/export'
#
# 4. Set frequency (4-wire fans typically 25kHz):
#    sudo bash -c 'echo 1000000 > /sys/class/pwm/pwmchip0/pwm1/period'
#
# 5. Run this script as systemd service
#

set -e

# Configuration
NVME_TEMP_PATH="/sys/class/nvme/nvme0/device/hwmon/hwmon0/temp1_input"
PWM_PATH="/sys/class/pwm/pwmchip0/pwm1/duty_cycle"
PWM_PERIOD=1000000  # 1MHz for 25kHz @ 1000000ns period
LOG_FILE="/var/log/nvme-fan-control.log"

# Temperature thresholds (°C)
TEMP_MIN=30       # Fan off below this
TEMP_MAX=60       # Fan max above this
TEMP_CRITICAL=75  # Alert if exceeds

# Check prerequisites
if [[ ! -f "$NVME_TEMP_PATH" ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] NVMe temp sensor not found at $NVME_TEMP_PATH" | tee -a "$LOG_FILE"
    exit 1
fi

if [[ ! -f "$PWM_PATH" ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] PWM control not found at $PWM_PATH" | tee -a "$LOG_FILE"
    echo "Initialize PWM first:" | tee -a "$LOG_FILE"
    echo "  sudo bash -c 'echo 1 > /sys/class/pwm/pwmchip0/export'" | tee -a "$LOG_FILE"
    exit 1
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] NVMe fan control started" | tee -a "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Temp sensor: $NVME_TEMP_PATH" | tee -a "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] PWM control: $PWM_PATH" | tee -a "$LOG_FILE"

# Main loop
while true; do
    # Read NVMe temperature (in millidegrees Celsius)
    temp_raw=$(cat "$NVME_TEMP_PATH" 2>/dev/null || echo "0")
    temp_c=$((temp_raw / 1000))
    
    # Calculate PWM duty cycle (0-100%)
    if (( temp_c < TEMP_MIN )); then
        # Fan off
        pwm_duty=0
        status="OFF"
    elif (( temp_c >= TEMP_MAX )); then
        # Fan max
        pwm_duty=$PWM_PERIOD
        status="MAX"
    else
        # Linear interpolation between MIN and MAX
        pwm_duty=$(( (temp_c - TEMP_MIN) * PWM_PERIOD / (TEMP_MAX - TEMP_MIN) ))
        percentage=$(( pwm_duty * 100 / PWM_PERIOD ))
        status="${percentage}%"
    fi
    
    # Write to PWM control
    echo "$pwm_duty" > "$PWM_PATH" 2>/dev/null || {
        echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Failed to write PWM" | tee -a "$LOG_FILE"
    }
    
    # Log and alert
    if (( temp_c > TEMP_CRITICAL )); then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [CRITICAL] NVMe temp ${temp_c}°C (fan: $status)" | tee -a "$LOG_FILE"
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] NVMe temp ${temp_c}°C (fan: $status)" >> "$LOG_FILE"
    fi
    
    # Sleep before next check
    sleep 5
done
