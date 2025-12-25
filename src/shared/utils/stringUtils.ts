export const convertNumbers = (number: string) => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Convert Persian numbers
  let result = number.replace(/[۰-۹]/g, (match) => {
    const index = persianNumbers.indexOf(match);
    return englishNumbers[index];
  });

  // Convert Arabic numbers
  result = result.replace(/[٠-٩]/g, (match) => {
    const index = arabicNumbers.indexOf(match);
    return englishNumbers[index];
  });

  return result;
};

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianNumbers = (num: number | string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .split('')
    .map((digit) => {
      if (digit >= '0' && digit <= '9') {
        return persianNumbers[parseInt(digit, 10)];
      }
      return digit;
    })
    .join('');
};

/**
 * تبدیل تاریخ میلادی به شمسی
 * الگوریتم دقیق تبدیل میلادی به شمسی
 */
export const toPersianDate = (
  date: Date,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} => {
  // محاسبه زمان ایران (UTC+3:30)
  const iranOffset = 3.5 * 60 * 60 * 1000; // 3.5 ساعت
  const iranTime = new Date(date.getTime() + iranOffset);

  const gYear = iranTime.getUTCFullYear();
  const gMonth = iranTime.getUTCMonth() + 1;
  const gDay = iranTime.getUTCDate();

  // الگوریتم تبدیل میلادی به شمسی (Jalali)
  const gy = gYear - 1600;
  const gm = gMonth - 1;
  const gd = gDay - 1;

  let gDayNo =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400) +
    gd;

  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < gm; i++) {
    gDayNo += monthDays[i];
  }

  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) {
    gDayNo++;
  }

  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo = jDayNo % 12053;
  let jYear = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo = jDayNo % 1461;

  if (jDayNo >= 366) {
    jYear += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  const jMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jMonth = 1;
  for (let i = 0; i < 11 && jDayNo >= jMonthDays[i]; i++) {
    jDayNo -= jMonthDays[i];
    jMonth++;
  }

  const jDay = jDayNo + 1;

  return {
    year: jYear,
    month: jMonth,
    day: jDay,
    hour: iranTime.getUTCHours(),
    minute: iranTime.getUTCMinutes(),
    second: iranTime.getUTCSeconds(),
  };
};
