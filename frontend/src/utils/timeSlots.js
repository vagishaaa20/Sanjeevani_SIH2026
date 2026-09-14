/**
 * Time Slot Helper Utilities for Sanjeevani Teleconsultations
 * Generates dynamic, short-range (5-10 min) future time slots relative to current time.
 */

export function formatTimeAmPm(date) {
    if (!date) return '';
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function generateDynamicFutureSlots() {
    const now = new Date();
    const slots = [];

    // 1. Right now (Immediate next 5-10 mins)
    const endNow = new Date(now.getTime() + 10 * 60 * 1000);
    slots.push({
        label: `Right Now · Immediate (Next 5–10 mins)`,
        shortLabel: 'Right Now',
        startTime: now.toISOString(),
        endTime: endNow.toISOString(),
        isImmediate: true,
        minutesFromNow: 0
    });

    // 2. In 10 mins (5-10 min window: +10m to +20m)
    const start10 = new Date(now.getTime() + 10 * 60 * 1000);
    const end10 = new Date(now.getTime() + 20 * 60 * 1000);
    slots.push({
        label: `In 10 mins (${formatTimeAmPm(start10)} – ${formatTimeAmPm(end10)})`,
        shortLabel: `In 10 mins (${formatTimeAmPm(start10)})`,
        startTime: start10.toISOString(),
        endTime: end10.toISOString(),
        isImmediate: false,
        minutesFromNow: 10
    });

    // 3. In 20 mins (5-10 min window: +20m to +30m)
    const start20 = new Date(now.getTime() + 20 * 60 * 1000);
    const end20 = new Date(now.getTime() + 30 * 60 * 1000);
    slots.push({
        label: `In 20 mins (${formatTimeAmPm(start20)} – ${formatTimeAmPm(end20)})`,
        shortLabel: `In 20 mins (${formatTimeAmPm(start20)})`,
        startTime: start20.toISOString(),
        endTime: end20.toISOString(),
        isImmediate: false,
        minutesFromNow: 20
    });

    // 4. In 30 mins (5-10 min window: +30m to +40m)
    const start30 = new Date(now.getTime() + 30 * 60 * 1000);
    const end30 = new Date(now.getTime() + 40 * 60 * 1000);
    slots.push({
        label: `In 30 mins (${formatTimeAmPm(start30)} – ${formatTimeAmPm(end30)})`,
        shortLabel: `In 30 mins (${formatTimeAmPm(start30)})`,
        startTime: start30.toISOString(),
        endTime: end30.toISOString(),
        isImmediate: false,
        minutesFromNow: 30
    });

    // 5. In 45 mins (5-10 min window: +45m to +55m)
    const start45 = new Date(now.getTime() + 45 * 60 * 1000);
    const end45 = new Date(now.getTime() + 55 * 60 * 1000);
    slots.push({
        label: `In 45 mins (${formatTimeAmPm(start45)} – ${formatTimeAmPm(end45)})`,
        shortLabel: `In 45 mins (${formatTimeAmPm(start45)})`,
        startTime: start45.toISOString(),
        endTime: end45.toISOString(),
        isImmediate: false,
        minutesFromNow: 45
    });

    // 6. In 1 hour (5-10 min window: +60m to +70m)
    const start60 = new Date(now.getTime() + 60 * 60 * 1000);
    const end60 = new Date(now.getTime() + 70 * 60 * 1000);
    slots.push({
        label: `In 1 hour (${formatTimeAmPm(start60)} – ${formatTimeAmPm(end60)})`,
        shortLabel: `In 1 hr (${formatTimeAmPm(start60)})`,
        startTime: start60.toISOString(),
        endTime: end60.toISOString(),
        isImmediate: false,
        minutesFromNow: 60
    });

    return slots;
}

/**
 * Checks if a scheduled slot or appointment date is reached and ready to connect.
 * Grace period: opens 1 minute before exact start time.
 */
export function checkSlotReadiness(scheduledAt) {
    if (!scheduledAt) {
        return { ready: true, remainingSecs: 0, countdownText: '' };
    }

    const targetDate = typeof scheduledAt === 'string' || typeof scheduledAt === 'number' 
        ? new Date(scheduledAt) 
        : scheduledAt;

    if (isNaN(targetDate.getTime())) {
        return { ready: true, remainingSecs: 0, countdownText: '' };
    }

    const now = Date.now();
    const targetMs = targetDate.getTime();
    // Strictly active only after the scheduled time has arrived
    const diffMs = targetMs - now;

    if (diffMs <= 0) {
        return { 
            ready: true, 
            remainingSecs: 0, 
            countdownText: 'Ready to connect',
            targetTimeFormatted: formatTimeAmPm(targetDate)
        };
    }

    const totalSeconds = Math.ceil((targetMs - now) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    let countdownText = '';
    if (mins > 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        countdownText = `Opens in ${hrs}h ${remMins}m`;
    } else if (mins > 0) {
        countdownText = `Opens in ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    } else {
        countdownText = `Opens in ${secs}s`;
    }

    return {
        ready: false,
        remainingSecs: totalSeconds,
        countdownText,
        targetTimeFormatted: formatTimeAmPm(targetDate)
    };
}
