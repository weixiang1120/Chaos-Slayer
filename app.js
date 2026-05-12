import {
  categories,
  createEmptyMonth,
  getMonthKey,
  getMonthLabel,
  addMonths,
  loadExpenseData,
  saveExpenseData,
  getMonthExpenses,
  sumMonth,
  formatDateTimeLocal,
  parseDateTimeLocal
} from "./storage.js";

const today = new Date();
let selectedMonthOffset = 0;
let expenseData = loadExpenseData();

function setDefaultDateTime() {
  const datetimeInput = document.getElementById("datetimeInput");
  if (!datetimeInput.value) {
    datetimeInput.value = formatDateTimeLocal(new Date());
  }
}

function getMonthOffset(date) {
  return (date.getFullYear() - today.getFullYear()) * 12 + (date.getMonth() - today.getMonth());
}

function getSelectedMonthDate() {
  return addMonths(today, selectedMonthOffset);
}

function updateMonthNavigation() {
  const selectedMonthDate = getSelectedMonthDate();
  const isCurrentMonth = selectedMonthOffset === 0;

  document.getElementById("monthLabel").innerText = getMonthLabel(selectedMonthDate);
  document.getElementById("monthHint").innerText = isCurrentMonth ? "本月，向左可查看更早月份" : "可查看最近 24 个月";
  document.getElementById("totalLabel").innerText = (isCurrentMonth ? "本月" : getMonthLabel(selectedMonthDate)) + "总计";
  document.getElementById("prevMonthBtn").disabled = selectedMonthOffset <= -23;
  document.getElementById("nextMonthBtn").disabled = selectedMonthOffset >= 0;
}

function updateSummary() {
  const selectedMonthDate = getSelectedMonthDate();
  const selectedMonthExpenses = getMonthExpenses(expenseData, getMonthKey(selectedMonthDate));

  for (let i = 0; i < categories.length; i += 1) {
    const category = categories[i];
    document.getElementById("cat-" + category).innerText = selectedMonthExpenses[category].toFixed(2);
  }

  document.getElementById("total").innerText = sumMonth(selectedMonthExpenses).toFixed(2);
  updateMonthNavigation();
}

function formatDayLabel(dateString) {
  const parts = dateString.split("-");
  return `${parseInt(parts[0], 10)}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
}

function formatTimeLabel(dateTimeValue) {
  return dateTimeValue.indexOf("T") === -1 ? dateTimeValue : dateTimeValue.split("T")[1];
}

function buildHistoryList() {
  const historyList = document.getElementById("historyList");
  if (!historyList) {
    return;
  }

  const records = [...expenseData.records].sort((a, b) => b.datetime.localeCompare(a.datetime));
  historyList.innerHTML = "";

  if (records.length === 0) {
    historyList.innerHTML = `<div class="history-empty">暂无记录</div>`;
    return;
  }

  let currentDate = "";
  let groupElement = null;

  records.forEach(record => {
    const recordDate = record.datetime.split("T")[0];
    if (recordDate !== currentDate) {
      currentDate = recordDate;
      groupElement = document.createElement("div");
      groupElement.className = "history-group";

      const title = document.createElement("div");
      title.className = "history-group-title";

      const dateLabel = document.createElement("span");
      dateLabel.innerText = formatDayLabel(recordDate);

      const totalLabel = document.createElement("span");
      totalLabel.className = "history-group-total";
      totalLabel.innerText = `合计 RM ${records
        .filter(item => item.datetime.split("T")[0] === recordDate)
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
        .toFixed(2)}`;

      title.appendChild(dateLabel);
      title.appendChild(totalLabel);
      groupElement.appendChild(title);
      historyList.appendChild(groupElement);
    }

    const itemElement = document.createElement("div");
    itemElement.className = "history-item";

    const timeLabel = document.createElement("div");
    timeLabel.className = "history-item-time";
    timeLabel.innerText = formatTimeLabel(record.datetime);

    const detailLabel = document.createElement("div");
    detailLabel.className = "history-item-detail";
    detailLabel.innerText = `${record.item || record.category} · ${record.category}`;

    const amountLabel = document.createElement("div");
    amountLabel.className = "history-item-amount";
    amountLabel.innerText = `RM ${parseFloat(record.amount).toFixed(2)}`;

    itemElement.appendChild(timeLabel);
    itemElement.appendChild(detailLabel);
    itemElement.appendChild(amountLabel);
    groupElement.appendChild(itemElement);
  });
}

function setActiveTab(tab) {
  const homeView = document.getElementById("homeView");
  const historyView = document.getElementById("historyView");
  const homeTabBtn = document.getElementById("homeTabBtn");
  const historyTabBtn = document.getElementById("historyTabBtn");

  if (tab === "history") {
    homeView.classList.add("hidden");
    historyView.classList.remove("hidden");
    homeTabBtn.classList.remove("active");
    historyTabBtn.classList.add("active");
    buildHistoryList();
  } else {
    homeView.classList.remove("hidden");
    historyView.classList.add("hidden");
    homeTabBtn.classList.add("active");
    historyTabBtn.classList.remove("active");
  }
}

function recordExpense() {
  const amount = parseFloat(document.getElementById("amountInput").value);
  const dateTimeValue = document.getElementById("datetimeInput").value;
  const item = document.getElementById("itemInput").value.trim();
  const category = document.getElementById("categorySelect").value;
  const msg = document.getElementById("msg");
  const selectedDate = parseDateTimeLocal(dateTimeValue);

  if (isNaN(amount) || amount <= 0) {
    msg.style.color = "red";
    msg.innerText = "请输入有效数额！";
    return;
  }

  if (!selectedDate) {
    msg.style.color = "red";
    msg.innerText = "请选择有效时间！";
    return;
  }

  if (getMonthOffset(selectedDate) > 0 || getMonthOffset(selectedDate) < -23) {
    msg.style.color = "red";
    msg.innerText = "只支持记录最近 24 个月内的月份！";
    return;
  }

  const selectedMonthKey = getMonthKey(selectedDate);
  const selectedMonthExpenses = getMonthExpenses(expenseData, selectedMonthKey);
  selectedMonthExpenses[category] += amount;
  expenseData.records.push({
    amount,
    category,
    item: item || category,
    datetime: dateTimeValue
  });

  const saveOk = saveExpenseData(expenseData);
  if (!saveOk) {
    msg.style.color = "red";
    msg.innerText = "手机浏览器暂时无法写入资料，请改用 Safari 开启网页再试。";
    return;
  }

  updateSummary();

  document.getElementById("amountInput").value = "";
  document.getElementById("itemInput").value = "";
  document.getElementById("datetimeInput").value = formatDateTimeLocal(new Date());
  msg.style.color = "green";
  msg.innerText = "已记录 " + (item || category) + " RM " + amount.toFixed(2) + "，时间：" + dateTimeValue.replace("T", " ");
  buildHistoryList();
}

function changeMonth(step) {
  const nextOffset = selectedMonthOffset + step;
  if (nextOffset > 0 || nextOffset < -23) {
    return;
  }

  selectedMonthOffset = nextOffset;
  updateSummary();
}

function initApp() {
  const recordBtn = document.getElementById("recordBtn");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");

  if (!recordBtn || !prevMonthBtn || !nextMonthBtn) {
    return;
  }

  const homeTabBtn = document.getElementById("homeTabBtn");
  const historyTabBtn = document.getElementById("historyTabBtn");

  recordBtn.addEventListener("click", recordExpense);
  prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  nextMonthBtn.addEventListener("click", () => changeMonth(1));
  homeTabBtn.addEventListener("click", () => setActiveTab("home"));
  historyTabBtn.addEventListener("click", () => setActiveTab("history"));

  setDefaultDateTime();
  updateSummary();
  setActiveTab("home");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
