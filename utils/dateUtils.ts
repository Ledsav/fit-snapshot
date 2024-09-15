import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  parseISO,
} from "date-fns";

export function getTimeDifference(
  date1: string,
  date2: string,
  t: (key: string) => string
): string {
  const d1 = parseISO(date1);
  const d2 = parseISO(date2);
  const days = differenceInDays(d2, d1);
  const months = differenceInMonths(d2, d1);
  const years = differenceInYears(d2, d1);

  if (years > 0) {
    return `${years} ${
      years === 1 ? t("timeDifference.year") : t("timeDifference.years")
    }`;
  } else if (months > 0) {
    return `${months} ${
      months === 1 ? t("timeDifference.month") : t("timeDifference.months")
    }`;
  } else {
    return `${days} ${
      days === 1 ? t("timeDifference.day") : t("timeDifference.days")
    }`;
  }
}
