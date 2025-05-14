import insertConfirmation from "../utils/DOM_SCRIPTS/InsertConfirmation";

async function setStartTime() {
  const startTimeData = await chrome.storage.local.get(["focusModeStartTime", "focusModeDuration", "focusModeEndTime"]);
  
  let startTime = startTimeData.focusModeStartTime;
  if (!startTime) {
    // Fallback to calculation if startTime not available
    const duration = startTimeData.focusModeDuration || 50;
    const endTime = startTimeData.focusModeEndTime || (new Date().getTime() + duration * 60 * 1000);
    startTime = endTime - (duration * 60 * 1000);
  }

  const element = document.getElementById("startTime")!;
  element.innerText = new Date(startTime).toLocaleTimeString(undefined, { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

async function updateTimeRemaining() {
  const endTime =
    (await chrome.storage.local.get("focusModeEndTime")).focusModeEndTime ||
    new Date().getTime() + 50 * 60 * 1000;
  const timeRemaining = (endTime - new Date().getTime()) / 1000;
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = Math.floor(timeRemaining % 60);

  const hoursString = hours.toString().padStart(2, "0");
  const minutesString = minutes.toString().padStart(2, "0");
  const secondsString = seconds.toString().padStart(2, "0");

  const element = document.getElementById("timeRemaining")!;
  if (hours === 0) {
    element.innerText = `${minutesString} : ${secondsString}`;
    return;
  }
  element.innerText = `${hoursString} : ${minutesString} : ${secondsString}`;
}

function handleWork() {
  document.location.href = "https://www.google.com";
}

async function exitFocusMode() {
  await chrome.storage.local.set({ enableSuperFocusMode: false });
  await chrome.storage.local.remove("focusModeEndTime");
  await chrome.storage.local.remove("focusModeDuration");
  await chrome.storage.local.remove("focusModeStartTime");
  await chrome.alarms.clear("updateFocusMode");
  document.location.href = "https://www.google.com";
}

document.getElementById("work")!.addEventListener("click", handleWork);
document.getElementById("exit")!.addEventListener("click", () => {
  insertConfirmation(
    exitFocusMode,
    "Yes, End Focus Mode",
    `Are you sure? Once you turn off Super Focus Mode,
  <strong>Recenter</strong> will not block the distracting websites.`
  );
});

setStartTime();
setInterval(updateTimeRemaining, 1000);

export {};
