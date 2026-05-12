export const categories = ["饮食", "交通", "购物", "娱乐", "生活", "其他"];

export function twoDigits(value) {
  return value < 10 ? "0" + value : String(value);
}

export function createEmptyMonth() {
  return { "饮食": 0, "交通": 0, "购物": 0, "娱乐": 0, "生活": 0, "其他": 0 };
}

export function mergeMonthData(base, incoming) {
  const merged = createEmptyMonth();
  for (const category in base) {
    merged[category] = base[category];
  }

  if (incoming && typeof incoming === "object") {
    for (const category in incoming) {
      if (Object.prototype.hasOwnProperty.call(merged, category)) {
        merged[category] = Number(incoming[category]) || 0;
      }
    }
  }

  return merged;
}

export function getMonthKey(date) {
  const year = date.getFullYear();
  const month = twoDigits(date.getMonth() + 1);
  return year + "-" + month;
}

export function getMonthLabel(date) {
  return date.getFullYear() + "年" + (date.getMonth() + 1) + "月";
}

export function addMonths(date, monthOffset) {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

export function normalizeData(saved) {
  if (saved && saved.months && typeof saved.months === "object") {
    for (const monthKey in saved.months) {
      const monthData = saved.months[monthKey] || {};
      saved.months[monthKey] = mergeMonthData(createEmptyMonth(), monthData);
    }
    if (!Array.isArray(saved.records)) {
      saved.records = [];
    }
    return saved;
  }

  const migrated = { months: {}, records: [] };
  const currentMonthKey = getMonthKey(new Date());
  migrated.months[currentMonthKey] = createEmptyMonth();

  if (saved && typeof saved === "object") {
    migrated.months[currentMonthKey] = mergeMonthData(createEmptyMonth(), saved);
  }

  return migrated;
}

export function loadExpenseData() {
  let saved = null;
  try {
    saved = localStorage.getItem("expenses");
  } catch (error) {
    return { months: {}, records: [] };
  }

  if (!saved) {
    return { months: {}, records: [] };
  }

  try {
    return normalizeData(JSON.parse(saved));
  } catch (error) {
    return { months: {}, records: [] };
  }
}

export function saveExpenseData(expenseData) {
  try {
    localStorage.setItem("expenses", JSON.stringify(expenseData));
    return true;
  } catch (error) {
    return false;
  }
}

export function getMonthExpenses(expenseData, monthKey) {
  if (!expenseData.months[monthKey]) {
    expenseData.months[monthKey] = createEmptyMonth();
  }
  return expenseData.months[monthKey];
}

export function sumMonth(expenses) {
  let total = 0;
  for (let i = 0; i < categories.length; i += 1) {
    const category = categories[i];
    total += expenses[category] || 0;
  }
  return total;
}

export function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = twoDigits(date.getMonth() + 1);
  const day = twoDigits(date.getDate());
  const hours = twoDigits(date.getHours());
  const minutes = twoDigits(date.getMinutes());
  return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
}

export function parseDateTimeLocal(value) {
  if (!value || value.indexOf("T") === -1) {
    return null;
  }

  const parts = value.split("T");
  const dateParts = parts[0].split("-");
  const timeParts = parts[1].split(":");

  if (dateParts.length !== 3 || timeParts.length < 2) {
    return null;
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const day = parseInt(dateParts[2], 10);
  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}
