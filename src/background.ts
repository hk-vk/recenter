import { AITagging } from "./utils/chatGPT/AITagging";
import { dailyRecap } from "./utils/chatGPT/DailyRecap";
import { WebTime } from "./utils/main/WebTime";
import { ACTIVE_SESSION_STORAGE_KEY, SESSION_ALARM_NAME } from "./utils/CONSTANTS/SessionConstants";
import { DEFAULT_SESSION_TEMPLATES } from "./utils/CONSTANTS/SessionTemplates";
import { SessionTemplate, ActiveSessionState } from "./types/Session";

let webTime: WebTime | undefined;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.redirect) {
    if (checkDisable()) {
      return;
    }
    chrome.tabs.update(sender.tab!.id!, { url: request.redirect + `?from=${sender.tab?.url}` });
  } else if (request.summarize === "prevDay") {
    dailyRecap()
      .then(function (result) {
        sendResponse({ success: true, result });
      })
      .catch(function (error) {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates that response will be sent asynchronously
  } else if (request.type === 'START_SESSION' && request.templateId) {
    startSession(request.templateId, request.template);
  } else if (request.type === 'PAUSE_SESSION') {
    pauseSession();
  } else if (request.type === 'RESUME_SESSION') {
    resumeSession();
  } else if (request.type === 'END_SESSION') {
    endSession();
  }
});

var isExtensionDisabled: boolean = false;
var isExtensionDisabledOnWeekend: boolean = true;
var isWeekend: boolean = [0, 6].includes(new Date().getDay());

function checkDisable(): boolean {
  return isExtensionDisabled || isExtensionDisabledOnWeekend;
}

async function handleExtensionEnable() {
  isExtensionDisabledOnWeekend =
    ((await chrome.storage.local.get("isDisabledOnWeekend"))
      .isDisabledOnWeekend ||
      false) &&
    isWeekend;
  chrome.storage.local.get("isDisabled", (data) => {
    if (data === undefined) {
      chrome.storage.local.set({ isDisabled: false });
      isExtensionDisabled = false;
      return;
    }
    isExtensionDisabled = data.isDisabled;
    if (webTime) {
      webTime.setDisable(checkDisable());
    }
  });

  chrome.storage.onChanged.addListener(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes["isDisabled"]) {
        isExtensionDisabled = changes["isDisabled"].newValue;
      }
      if (changes["isDisabledOnWeekend"]) {
        isExtensionDisabledOnWeekend =
          changes["isDisabledOnWeekend"].newValue && isWeekend;
      }
      if (webTime) {
        webTime.setDisable(checkDisable());
      }
    }
  );
}

async function tagWebsite() {
  if (checkDisable()) {
    return;
  }
  await AITagging();
}

handleExtensionEnable();

function loadData() {
  fetch("../data/funny_lines.json").then((response) => {
    response.json().then((data) => {
      chrome.storage.local.set({ funnyLines: data });
    });
  });
  fetch("../data/tagged_urls.json").then((response) => {
    response.json().then((data) => {
      chrome.storage.local.set({ preTaggedUrls: data });
    });
  });
}

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === "install") {
    chrome.tabs.create({ url: "https://recenter.netlify.app/docs" });
  }
});

async function checkAlarm() {
  let alarm = await chrome.alarms.get("tagWebsite");
  if (alarm) {
    await chrome.alarms.clear("tagWebsite");
  }
  await chrome.alarms.create("tagWebsite", { periodInMinutes: 0.75 });
  alarm = await chrome.alarms.get("updateFocusMode");
  if (!alarm) {
    const scheduledTime = (await chrome.storage.local.get("focusModeEndTime"))
      .focusModeEndTime;
    if (scheduledTime) {
      const time = scheduledTime - new Date().getTime();
      await chrome.alarms.create("updateFocusMode", {
        when: new Date().getTime() + time,
      });
    }
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tagWebsite") {
    tagWebsite();
  }
  if (alarm.name === "updateFocusMode") {
    await chrome.storage.local.set({ enableSuperFocusMode: false });
    await chrome.storage.local.remove("focusModeEndTime");
    await chrome.storage.local.remove("focusModeDuration");
  }
  if (alarm.name === SESSION_ALARM_NAME) {
    await transitionSessionPhase();
  }
});

checkAlarm();

chrome.storage.local.get((res) => {
  const dailyTime = res.dailyTime || [];
  const weeklyTime = res.weeklyTime || [];
  const monthlyTime = res.monthlyTime || [];
  const hourlyTime = res.hourlyTime || [];
  webTime = new WebTime(
    dailyTime,
    weeklyTime,
    monthlyTime,
    hourlyTime,
    checkDisable()
  );
});

chrome.runtime.onStartup.addListener(() => {});

chrome.action.setBadgeBackgroundColor({ color: [0, 255, 0, 0] });

loadData();

// Session management functions
async function startSession(templateId: string, templateData?: SessionTemplate) {
  let template = templateData;

  if (!template) {
    const data = await chrome.storage.local.get('customSessionTemplates');
    const customTemplates: SessionTemplate[] = data.customSessionTemplates || [];
    template = customTemplates.find(t => t.id === templateId);

    if (!template) {
      template = DEFAULT_SESSION_TEMPLATES.find(t => t.id === templateId);
    }
  }

  if (!template) {
    console.error(`Session template not found for ID: ${templateId}`);
    chrome.notifications.create(SESSION_ALARM_NAME + '_error_start', {
      type: 'basic',
      iconUrl: 'images/recenter_logo.png',
      title: 'Session Start Error',
      message: `Could not find session template: ${templateId}.`,
    });
    return;
  }

  const now = Date.now();
  const phaseEndTime = now + template.workMinutes * 60 * 1000;
  const newState: ActiveSessionState = {
    templateId,
    currentPhase: 'work',
    phaseKey: 'work-1',
    phaseEndTime,
    isPaused: false,
    currentCycle: 1,
    totalCycles: template.cycles || 1
  };

  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
  await chrome.storage.local.set({ enableSuperFocusMode: true });
  
  // Sync the focus mode timer with the session timer
  await chrome.storage.local.set({
    focusModeEndTime: phaseEndTime,
    focusModeDuration: template.workMinutes
  });
  
  await chrome.alarms.create(SESSION_ALARM_NAME, { when: phaseEndTime });
  chrome.notifications.create(SESSION_ALARM_NAME + '_start', {
    type: 'basic',
    iconUrl: 'images/recenter_logo.png',
    title: `Started ${template.name}`,
    message: `Work session: ${template.workMinutes} minutes. (Cycle 1/${template.cycles || 1})`,
  });
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
}

async function transitionSessionPhase() {
  const storage = await chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY);
  const state: ActiveSessionState = storage[ACTIVE_SESSION_STORAGE_KEY];
  if (!state) return;

  let template = DEFAULT_SESSION_TEMPLATES.find(t => t.id === state.templateId);
  if (!template) {
    const data = await chrome.storage.local.get('customSessionTemplates');
    const customTemplates: SessionTemplate[] = data.customSessionTemplates || [];
    template = customTemplates.find(t => t.id === state.templateId);
    if (!template) {
      console.error(`Template not found for session: ${state.templateId}`);
      return;
    }
  }

  const isLastPhaseOfCycle = state.currentPhase === 'break';
  const isLastCycle = state.currentCycle >= state.totalCycles;

  if (isLastPhaseOfCycle && isLastCycle) {
    await endSession();
    return;
  }

  const nextPhase = state.currentPhase === 'work' ? 'break' : 'work';
  const nextCycle = isLastPhaseOfCycle ? state.currentCycle + 1 : state.currentCycle;
  const durationMinutes = nextPhase === 'work' ? template.workMinutes : template.breakMinutes;
  const nextPhaseKey = `${nextPhase}-${nextCycle}`;
  
  const now = Date.now();
  const phaseEndTime = now + durationMinutes * 60 * 1000;
  
  const newState: ActiveSessionState = {
    ...state,
    currentPhase: nextPhase,
    currentCycle: nextCycle,
    phaseKey: nextPhaseKey,
    phaseEndTime,
    isPaused: false,
    pausedTimeRemainingMs: undefined,
  };

  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
  await chrome.storage.local.set({ enableSuperFocusMode: nextPhase === 'work' });
  
  if (nextPhase === 'work') {
    // Only sync focus mode timer for work phases
    await chrome.storage.local.set({
      focusModeEndTime: phaseEndTime,
      focusModeDuration: durationMinutes
    });
  } else {
    // For break phases, clear the focus mode
    await chrome.storage.local.remove("focusModeEndTime");
    await chrome.storage.local.remove("focusModeDuration");
  }
  
  await chrome.alarms.create(SESSION_ALARM_NAME, { when: phaseEndTime });

  const title = nextPhase === 'work' 
    ? `Break over! Time to work.` 
    : `Work session complete! Time for a break.`;
  const cycleInfo = `(Cycle ${nextCycle}/${state.totalCycles})`;
  
  chrome.notifications.create(SESSION_ALARM_NAME + '_' + nextPhase, {
    type: 'basic',
    iconUrl: 'images/recenter_logo.png',
    title,
    message: `${durationMinutes} minutes ${nextPhase}. ${cycleInfo}`,
  });
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
}

async function pauseSession() {
  const storage = await chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY);
  const state: ActiveSessionState = storage[ACTIVE_SESSION_STORAGE_KEY];
  if (!state || state.isPaused) {
    return;
  }
  const remaining = state.phaseEndTime - Date.now();
  await chrome.alarms.clear(SESSION_ALARM_NAME);
  const newState: ActiveSessionState = {
    ...state,
    isPaused: true,
    pausedTimeRemainingMs: remaining,
  };
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
  await chrome.storage.local.set({ enableSuperFocusMode: false });
  
  // Clear the focus mode when session is paused
  await chrome.storage.local.remove("focusModeEndTime");
  await chrome.storage.local.remove("focusModeDuration");
  
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
}

async function resumeSession() {
  const storage = await chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY);
  const state: ActiveSessionState = storage[ACTIVE_SESSION_STORAGE_KEY];
  if (!state || !state.isPaused || state.pausedTimeRemainingMs === undefined) {
    return;
  }
  const now = Date.now();
  const phaseEndTime = now + state.pausedTimeRemainingMs;
  await chrome.alarms.create(SESSION_ALARM_NAME, { when: phaseEndTime });
  const newState: ActiveSessionState = {
    ...state,
    isPaused: false,
    phaseEndTime,
    pausedTimeRemainingMs: undefined,
  };
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
  await chrome.storage.local.set({ enableSuperFocusMode: newState.currentPhase === 'work' });
  
  // Resync the focus mode timer when session is resumed
  if (newState.currentPhase === 'work') {
    await chrome.storage.local.set({
      focusModeEndTime: phaseEndTime,
      focusModeDuration: Math.ceil(state.pausedTimeRemainingMs / (60 * 1000))
    });
  }
  
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
}

async function endSession() {
  await chrome.alarms.clear(SESSION_ALARM_NAME);
  await chrome.storage.local.set({ enableSuperFocusMode: false });
  await chrome.storage.local.remove(ACTIVE_SESSION_STORAGE_KEY);
  chrome.notifications.create(SESSION_ALARM_NAME + '_ended', {
    type: 'basic',
    iconUrl: 'images/recenter_logo.png',
    title: 'Session ended',
    message: 'Your session has been ended.',
  });
  chrome.runtime.sendMessage({ type: 'SESSION_ENDED' });
}

export {};
