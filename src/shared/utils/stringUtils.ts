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
