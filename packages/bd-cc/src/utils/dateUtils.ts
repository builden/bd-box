import dayjs, { type Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { TFunction } from "i18next";

// 扩展 dayjs
dayjs.extend(relativeTime);

/**
 * 格式化时间为相对时间（如 "5 mins ago"）
 * @param dateString ISO 日期字符串
 * @param currentTime 当前时间（用于测试场景）
 * @param t i18n 翻译函数
 */
export const formatTimeAgo = (dateString: string, currentTime: Date, t?: TFunction): string => {
  const date = dayjs(dateString);

  // Check if date is valid
  if (!date.isValid()) {
    return t ? t("status.unknown") : "Unknown";
  }

  // 如果传入了 currentTime，使用它作为基准
  const now = currentTime ? dayjs(currentTime) : dayjs();
  const diffInMs = now.valueOf() - date.valueOf();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // 使用 dayjs 的国际化能力
  if (diffInSeconds < 60) return t ? t("time.justNow") : "Just now";
  if (diffInMinutes === 1) return t ? t("time.oneMinuteAgo") : "1 min ago";
  if (diffInMinutes < 60) return t ? t("time.minutesAgo", { count: diffInMinutes }) : `${diffInMinutes} mins ago`;
  if (diffInHours === 1) return t ? t("time.oneHourAgo") : "1 hour ago";
  if (diffInHours < 24) return t ? t("time.hoursAgo", { count: diffInHours }) : `${diffInHours} hours ago`;
  if (diffInDays === 1) return t ? t("time.oneDayAgo") : "1 day ago";
  if (diffInDays < 7) return t ? t("time.daysAgo", { count: diffInDays }) : `${diffInDays} days ago`;

  // 超过一周，返回本地日期格式
  return date.format("YYYY-MM-DD");
};

/**
 * 解析日期字符串为 Dayjs 对象
 */
export const parseDate = (dateString: string | Date): Dayjs => {
  return dayjs(dateString);
};

/**
 * 格式化日期为指定格式
 */
export const formatDate = (dateString: string | Date, format: string = "YYYY-MM-DD"): string => {
  return dayjs(dateString).format(format);
};
