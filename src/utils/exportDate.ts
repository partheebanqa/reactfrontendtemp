import { formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const convertTimestamp = (
  timestamp: number,
  timezone: string = "Asia/Kolkata"
): { dateTime: string; tz: string } => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  let dateTime: string;
  if (diffInHours < 24 && diffInHours > 0) {
    dateTime = formatDistanceToNow(date, { addSuffix: true });
  } else {
    dateTime = formatInTimeZone(date, timezone, "MMM dd, yyyy 'at' hh:mm a");
  }

  return {
    dateTime,
    tz: timezone.split("/")[1] || timezone,
  };
};

export const isValidTimestamp = (value: string): boolean => {
  const num = Number(value);
  return !isNaN(num) && num > 0 && num.toString().length >= 10;
};

export const convertDateStamp = (
  timestamp: number,
  timezone: string = "Asia/Kolkata"
): { dateTime: string; tz: string } => {
  const date = new Date(timestamp);
  let dateTime: string;
  dateTime = formatInTimeZone(date, timezone, "MMM dd, yyyy 'at' hh:mm a");
  return {
    dateTime,
    tz: timezone.split("/")[1] || timezone,
  };
};
