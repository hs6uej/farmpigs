import { differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';

interface AgeDisplayProps {
    dateOfBirth: Date | string;
    className?: string;
    showDaysOnly?: boolean;
}

export function AgeDisplay({ dateOfBirth, className, showDaysOnly }: AgeDisplayProps) {
    const dob = new Date(dateOfBirth);
    const now = new Date();

    // If date is invalid
    if (isNaN(dob.getTime())) {
        return <span className={className}>-</span>;
    }

    if (showDaysOnly) {
        const days = differenceInDays(now, dob);
        return <span className={className}>{days} วัน</span>;
    }

    const years = differenceInYears(now, dob);
    const months = differenceInMonths(now, dob) % 12;
    const days = differenceInDays(now, dob) % 30; // Approximation for remaining days

    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    if (days > 0 || parts.length === 0) parts.push(`${days} วัน`);

    return (
        <span className={className}>
            {parts.join(' ')}
        </span>
    );
}
