import { addGreetingPopup } from "./utils/DOM_SCRIPTS/GreetingPopup";
import { insertHourlySummary } from "./utils/DOM_SCRIPTS/HourlySummary";
import { NudgeUser } from "./utils/main/NudgeUser";
import { ProactiveTimer } from "./utils/main/ProactiveTimer";
import { getTag } from "./utils/queryStorage/GetTag";
import { insertSessionTimer, removeSessionTimer } from "./utils/DOM_SCRIPTS/SessionTimer"

var isExtensionDisabled = false;
var isExtensionDisabledOnWeekend: boolean = true;
var isWeekend: boolean = [0, 6].includes(new Date().getDay());
var nudgeUser: NudgeUser;

function checkDisable(): boolean {
  return isExtensionDisabled || isExtensionDisabledOnWeekend;
}

async function setIsDisabled() {
  isExtensionDisabledOnWeekend =
    ((await chrome.storage.local.get("isDisabledOnWeekend"))
      .isDisabledOnWeekend ||
      false) &&
    isWeekend;
  chrome.storage.local.get("isDisabled", (data: any) => {
    if (data === undefined) {
      chrome.storage.local.set({ isDisabled: false });
      isExtensionDisabled = false;
      return;
    }
    isExtensionDisabled = data.isDisabled;
    if (!nudgeUser) {
      nudgeUser = new NudgeUser(checkDisable());
    } else {
      nudgeUser.setIsDisabled(checkDisable());
    }
  });
  chrome.storage.onChanged.addListener(
    async (changes: any) => {
      if (changes["isDisabled"]) {
        isExtensionDisabled = changes["isDisabled"].newValue;
      }
      if (!nudgeUser) {
        nudgeUser = new NudgeUser(checkDisable());
      } else {
        nudgeUser.setIsDisabled(checkDisable());
        if (changes["promptParameters"]) {
          const currentURL = window.location.origin;
          const promptParameters = changes["promptParameters"].newValue;
          if (promptParameters[currentURL]) {
            nudgeUser.setPromptViolations(
              promptParameters[currentURL].promptViolations
            );
            nudgeUser.setPromptInterval(
              promptParameters[currentURL].promptInterval
            );
          }
        }
      }
      if (changes["isDisabledOnWeekend"]) {
        isExtensionDisabledOnWeekend =
          changes["isDisabledOnWeekend"].newValue && isWeekend;
      }
    }
  );
}

setIsDisabled();

nudgeUser = new NudgeUser(checkDisable());

chrome.storage.local.get("lastGreeted", (data: any) => {
  if (checkDisable()) {
    return;
  }
  setTimeout(() => {
    if (data.lastGreeted === undefined) {
      addGreetingPopup(true);
      chrome.storage.local.set({ lastGreeted: new Date().toDateString() });
    } else {
      const today = new Date().toDateString();
      if (data.lastGreeted !== today) {
        addGreetingPopup();
        chrome.storage.local.set({ lastGreeted: today });
      }
    }
  }, 2000);
});

new ProactiveTimer();

setInterval(async () => {
  if (!document.hasFocus() || checkDisable()) {
    return;
  }
  const lastTimeSummary =
    (await chrome.storage.local.get("lastTimeSummary")).lastTimeSummary || 0;
  const current = new Date().getTime();

  let enableHourly = (await chrome.storage.local.get("enableHourlyUpdates"))
    .enableHourlyUpdates;

  if (typeof enableHourly === "undefined") {
    await chrome.storage.local.set({ enableHourlyUpdates: true });
    enableHourly = true;
  }

  if (current - lastTimeSummary >= 61 * 60 * 1000 && enableHourly) {
    // if summary not shown for more than an hour
    insertHourlySummary();
    await chrome.storage.local.set({ lastTimeSummary: current });
  }
}, 60 * 1000); // check every 1 minute

chrome.storage.local.get("enableSuperFocusMode", (res: any) => {
  const isBlocking = res?.enableSuperFocusMode || false;
  if (isBlocking) {
    getTag(document.location.origin).then((res) => {
      if (res === 3) {
        chrome.runtime.sendMessage({ redirect: "html/superfocus.html" });
      }
    });
  }
});

chrome.storage.local.get("activeSession", (data: any) => {
  if (data.activeSession && !data.activeSession.isPaused) {
    insertSessionTimer();
  }
});

chrome.storage.onChanged.addListener((changes: any) => {
  if (changes.activeSession) {
    const newState = changes.activeSession.newValue;
    if (newState && !newState.isPaused) {
      insertSessionTimer();
    } else {
      removeSessionTimer();
    }
  }
});

export {};
