class DateUtils {
    static formatDate(date, format = 'standard') {
        const d = new Date(date);
        
        const formats = {
            standard: d.toLocaleDateString(),
            full: d.toLocaleDateString() + ' ' + d.toLocaleTimeString(),
            iso: d.toISOString(),
            relative: this.getRelativeTime(d)
        };
        
        return formats[format] || formats.standard;
    }

    static getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return this.formatDate(date, 'standard');
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    static isFuture(date) {
        return new Date(date) > new Date();
    }

    static isPast(date) {
        return new Date(date) < new Date();
    }

    static getTimeUntil(date) {
        const future = new Date(date);
        const now = new Date();
        const diffMs = future - now;

        if (diffMs <= 0) return 'Past';

        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffYears > 0) return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
        if (diffMonths > 0) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
        if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        if (diffMins > 0) return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
        return `${diffSecs} second${diffSecs !== 1 ? 's' : ''}`;
    }

    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    static getJulianDate(date = new Date()) {
        const d = new Date(date);
        return (d.getTime() / 86400000) + 2440587.5;
    }

    static fromJulianDate(jd) {
        return new Date((jd - 2440587.5) * 86400000);
    }

    // Astronomical time calculations
    static getGMST(date = new Date()) {
        // Greenwich Mean Sidereal Time
        const jd = this.getJulianDate(date);
        const t = (jd - 2451545.0) / 36525.0;
        
        let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
                   0.000387933 * t * t - t * t * t / 38710000.0;
        
        return gmst % 360;
    }

    static getLST(longitude, date = new Date()) {
        // Local Sidereal Time
        const gmst = this.getGMST(date);
        return (gmst + longitude) % 360;
    }

    // Mission timeline utilities
    static createMissionTimeline(launchDate, events) {
        const timeline = [];
        const launch = new Date(launchDate);

        events.forEach(event => {
            const eventDate = this.addDays(launch, event.daysAfterLaunch);
            timeline.push({
                ...event,
                date: eventDate,
                relativeDate: this.getRelativeTime(eventDate)
            });
        });

        return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    static calculatePhaseDates(startDate, phases) {
        const result = {};
        let currentDate = new Date(startDate);

        phases.forEach(phase => {
            result[phase.name] = {
                start: new Date(currentDate),
                end: this.addDays(currentDate, phase.duration),
                duration: phase.duration
            };
            currentDate = this.addDays(currentDate, phase.duration);
        });

        return result;
    }

    // Countdown utilities
    static createCountdown(targetDate, updateCallback, interval = 1000) {
        let countdownInterval;

        const update = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target - now;

            if (diff <= 0) {
                clearInterval(countdownInterval);
                updateCallback({ expired: true, timeRemaining: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            updateCallback({
                expired: false,
                timeRemaining: diff,
                days,
                hours,
                minutes,
                seconds,
                formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
            });
        };

        countdownInterval = setInterval(update, interval);
        update(); // Initial call

        return () => clearInterval(countdownInterval);
    }
}

export { DateUtils };