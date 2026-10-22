/**
 * 🦷 Dentia Platform: Clinic Schedule & Live Open/Closed Status Utility
 * Parses clinic operating hours strings (e.g. "Mon - Sat: 03:00 - 20:00", "Mon - Fri: 09:00 - 18:00")
 * and computes real-time Open / Closed status, next opening time, and countdown.
 */

const DAYS_MAP = {
    'sun': 0, 'sunday': 0,
    'mon': 1, 'monday': 1,
    'tue': 2, 'tues': 2, 'tuesday': 2,
    'wed': 3, 'wednesday': 3,
    'thu': 4, 'thur': 4, 'thurs': 4, 'thursday': 4,
    'fri': 5, 'friday': 5,
    'sat': 6, 'saturday': 6
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Normalizes time string ("03:00", "3:00 PM", "20:00") into minutes from midnight (0 - 1439).
 */
export function timeStringToMinutes(timeStr) {
    if (!timeStr) return null;
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const numPart = clean.replace(/[^0-9:]/g, '');
    const parts = numPart.split(':');
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into 24h "HH:mm" or friendly 12h display.
 */
export function minutesToDisplayTime(totalMinutes, format12h = false) {
    if (totalMinutes === null || totalMinutes === undefined) return '';
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (!format12h) {
        return `${pad(h)}:${pad(m)}`;
    }
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${pad(m)} ${ampm}`;
}

/**
 * Parses operating hour string into structured days & time ranges.
 * Supports patterns like:
 * - "Mon - Sat: 03:00 - 20:00"
 * - "Mon - Fri: 09:00 - 18:00, Sat: 09:00 - 14:00"
 * - "Daily: 08:00 - 20:00"
 * - "09:00 - 18:00"
 */
export function parseOperatingSchedule(scheduleStr) {
    const defaultSchedule = {
        activeDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
        openMinutes: 9 * 60, // 09:00
        closeMinutes: 18 * 60, // 18:00
        raw: scheduleStr || 'Mon - Sat: 09:00 - 18:00'
    };

    if (!scheduleStr || typeof scheduleStr !== 'string') {
        return defaultSchedule;
    }

    const str = scheduleStr.trim();

    // Check for 24/7 or Always Open
    if (str.toLowerCase().includes('24/7') || str.toLowerCase().includes('emergency 24 hours')) {
        return {
            is24x7: true,
            activeDays: [0, 1, 2, 3, 4, 5, 6],
            openMinutes: 0,
            closeMinutes: 1440,
            raw: str
        };
    }

    let activeDays = [];
    let openMinutes = 9 * 60;
    let closeMinutes = 18 * 60;

    // Detect Day Range (e.g. "Mon - Sat", "Mon to Fri", "Daily", "All Days")
    const lower = str.toLowerCase();
    if (lower.includes('daily') || lower.includes('everyday') || lower.includes('all days') || lower.includes('mon - sun')) {
        activeDays = [0, 1, 2, 3, 4, 5, 6];
    } else {
        const dayRangeMatch = str.match(/([A-Za-z]{3,9})\s*(?:-|to)\s*([A-Za-z]{3,9})/i);
        if (dayRangeMatch) {
            const startKey = dayRangeMatch[1].toLowerCase().slice(0, 3);
            const endKey = dayRangeMatch[2].toLowerCase().slice(0, 3);
            const startIdx = DAYS_MAP[startKey] !== undefined ? DAYS_MAP[startKey] : 1;
            const endIdx = DAYS_MAP[endKey] !== undefined ? DAYS_MAP[endKey] : 6;

            if (startIdx <= endIdx) {
                for (let d = startIdx; d <= endIdx; d++) activeDays.push(d);
            } else {
                for (let d = startIdx; d <= 6; d++) activeDays.push(d);
                for (let d = 0; d <= endIdx; d++) activeDays.push(d);
            }
        } else {
            // Check single days or list (e.g. "Mon, Wed, Fri")
            for (const [key, idx] of Object.entries(DAYS_MAP)) {
                if (key.length === 3 && lower.includes(key) && !activeDays.includes(idx)) {
                    activeDays.push(idx);
                }
            }
        }
    }

    if (activeDays.length === 0) {
        activeDays = [1, 2, 3, 4, 5, 6]; // default Mon - Sat
    }

    // Extract Times: Match patterns like "03:00 - 20:00" or "9:00 AM - 6:00 PM"
    const timeMatch = str.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    if (timeMatch) {
        let t1 = timeStringToMinutes(timeMatch[1]);
        let t2 = timeStringToMinutes(timeMatch[2]);

        // Smart adjustment: If someone writes "03:00 - 20:00" without PM,
        // in dental practices in Pakistan & South Asia "03:00" often means 3:00 PM (15:00)
        // when paired with an evening closing time like 20:00 (8:00 PM).
        // If t1 < 480 (8 AM) and t2 >= 720 (12 PM), and (t1 + 720) < t2, treat t1 as PM (e.g. 15:00 - 20:00)
        if (t1 !== null && t2 !== null) {
            if (t1 < 480 && t2 >= 720 && (t1 + 720) < t2) {
                t1 += 720; // 3:00 -> 15:00
            }
            openMinutes = t1;
            closeMinutes = t2;
        }
    }

    return {
        activeDays,
        openMinutes,
        closeMinutes,
        raw: str
    };
}

/**
 * Computes live Open / Closed status against current time or specified Date.
 * Supports manual override (null = auto, true = Force Open, false = Force Closed).
 */
export function getClinicLiveStatus(scheduleStr, manualOverride = null, targetDate = new Date()) {
    // 1. Manual Override takes highest precedence
    if (manualOverride === true || manualOverride === 1 || manualOverride === 'true') {
        return {
            isOpen: true,
            status: 'OPEN',
            label: 'Open Now',
            detail: 'Clinic Open (Doctor Override)',
            badgeVariant: 'emerald',
            isManual: true,
            scheduleText: scheduleStr || 'Operating Hours'
        };
    }
    if (manualOverride === false || manualOverride === 0 || manualOverride === 'false') {
        return {
            isOpen: false,
            status: 'CLOSED',
            label: 'Closed Now',
            detail: 'Clinic Closed (Doctor Break / Away)',
            badgeVariant: 'rose',
            isManual: true,
            scheduleText: scheduleStr || 'Operating Hours'
        };
    }

    const schedule = parseOperatingSchedule(scheduleStr);

    if (schedule.is24x7) {
        return {
            isOpen: true,
            status: 'OPEN',
            label: 'Open 24/7',
            detail: 'Emergency & General Dental Care 24/7',
            badgeVariant: 'emerald',
            isManual: false,
            scheduleText: schedule.raw
        };
    }

    const currentDay = targetDate.getDay(); // 0 = Sun, 1 = Mon...
    const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();

    const isOpenToday = schedule.activeDays.includes(currentDay);
    const isWithinHours = currentMinutes >= schedule.openMinutes && currentMinutes < schedule.closeMinutes;

    const openTimeStr = minutesToDisplayTime(schedule.openMinutes);
    const closeTimeStr = minutesToDisplayTime(schedule.closeMinutes);

    if (isOpenToday && isWithinHours) {
        const remainingMinutes = schedule.closeMinutes - currentMinutes;
        let detail = `Closes at ${closeTimeStr}`;
        if (remainingMinutes <= 60 && remainingMinutes > 0) {
            detail = `Closing in ${remainingMinutes}m (${closeTimeStr})`;
        }
        return {
            isOpen: true,
            status: 'OPEN',
            label: 'Open Now',
            detail: detail,
            badgeVariant: 'emerald',
            isManual: false,
            openTime: openTimeStr,
            closeTime: closeTimeStr,
            scheduleText: schedule.raw
        };
    }

    // Clinic is CLOSED
    let detail = '';
    if (isOpenToday && currentMinutes < schedule.openMinutes) {
        detail = `Opens today at ${openTimeStr}`;
    } else {
        // Find next active day
        let nextDay = (currentDay + 1) % 7;
        let daysUntil = 1;
        while (!schedule.activeDays.includes(nextDay) && daysUntil <= 7) {
            nextDay = (nextDay + 1) % 7;
            daysUntil++;
        }
        if (daysUntil === 1) {
            detail = `Opens tomorrow at ${openTimeStr}`;
        } else {
            detail = `Opens ${DAY_NAMES[nextDay]} at ${openTimeStr}`;
        }
    }

    return {
        isOpen: false,
        status: 'CLOSED',
        label: 'Closed Now',
        detail: detail,
        badgeVariant: 'rose',
        isManual: false,
        openTime: openTimeStr,
        closeTime: closeTimeStr,
        scheduleText: schedule.raw
    };
}
