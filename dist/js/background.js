/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/utils/CONSTANTS/ChatGPT.ts
// ChatGPT CONSTANTS
const baseUrl = "https://api.openai.com/v1";
const model = "gpt-3.5-turbo-0125";
const costPer1000Token_INPUT = 0.0005;
const costPer1000Token_OUTPUT = 0.0015;
// Prompts
const HOURLY_RECAP_PROMPT = (history, productivePercentage) => {
    return `
    Productive for ${productivePercentage.toFixed(2)}%
    History:
      ${history}
      This is the browser history in a certain time period. Summarize this into a simple 4 or 5 sentence summary. The goal of this summary is to help the user realize what they have been browsing and if that is wasteful. This should encourage them to spend less time on wasteful non-productive sites. This is also a summary for one hour and can say so. It is implicit that this is the browser history so need not be mentioned. This can be funny. This should be in accessible english and speak directly to the user and refer to them as "you". Pay special attention to any interesting titles and use those in commenting on what the user might have been doing. Have an unusual introduction and a cold-open to the summary. Acknowledge how well the user spent time overall without referring to the percentage`;
};
const DAILY_RECAP_PROMPT = (history, productivePercentage) => {
    return `
  Productive for ${productivePercentage.toFixed(2)}%
    History:
  ${history}
  This is the browser history in a certain time period. Summarize this into a simple 7-8 sentence summary. The goal of this summary is to help the user realize what they have been browsing and if that is wasteful. This should encourage them to spend less time on wasteful non-productive sites. This is also a summary for the previous day and can say so. It is implicit that this is the browser history so need not be mentioned. This can be funny. This should be in accessible english and speak directly to the user and refer to them as "you". Pay special attention to any interesting titles and use those in commenting on what the user might have been doing. Have an unusual introduction and a cold-open to the summary. Acknowledge how well the user spent time overall without referring to the percentage`;
};

;// ./src/utils/queryStorage/UpdateWebsitesInStorage.ts
/*
Function to update websites in storage
*/
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function updateWebsitesInStorage(websites) {
    return __awaiter(this, void 0, void 0, function* () {
        const oldTaggedWebsites = (yield chrome.storage.local.get("taggedURLs")).taggedURLs || [];
        const oldVisitedWebsites = (yield chrome.storage.local.get("visitedURLs")).visitedURLs || [];
        for (let i = 0; i < websites.length; i++) {
            for (let j = 0; j < oldTaggedWebsites.length; j++) {
                if (oldTaggedWebsites[j].website === websites[i].website) { // if the website was already tagged, remove it
                    oldTaggedWebsites.splice(j, 1);
                }
            }
            if (oldVisitedWebsites.includes(websites[i].website)) { // if the website was already in un-tagged list, remove it
                oldVisitedWebsites.splice(oldVisitedWebsites.indexOf(websites[i].website), 1);
            }
            if (websites[i].tag !== 0) { // if the website is tagged, add it to tagged list
                oldTaggedWebsites.push(websites[i]);
            }
            else { // if the website is not tagged, add it to un-tagged list
                oldVisitedWebsites.push(websites[i].website);
            }
        }
        yield chrome.storage.local.set({
            taggedURLs: oldTaggedWebsites,
        });
        yield chrome.storage.local.set({
            visitedURLs: oldVisitedWebsites,
        });
    });
}

;// ./src/utils/chatGPT/EstimatedCost.ts
var EstimatedCost_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function estimatedCost(inputToken, outputToken, purpose) {
    var _a;
    return EstimatedCost_awaiter(this, void 0, void 0, function* () {
        let prevUsage = ((_a = (yield chrome.storage.local.get("usage"))) === null || _a === void 0 ? void 0 : _a.usage) || {
            monthly: { month: "", usage: [] },
            weekly: { week: "", usage: [] },
            daily: { day: "", usage: [] },
        };
        if (prevUsage.monthly === undefined ||
            prevUsage.weekly === undefined ||
            prevUsage.daily === undefined) {
            prevUsage = {
                monthly: { month: "", usage: [] },
                weekly: { week: "", usage: [] },
                daily: { day: "", usage: [] },
            };
        }
        const inputCost = costPer1000Token_INPUT / 1000;
        const outputCost = costPer1000Token_OUTPUT / 1000;
        let usage = 0;
        usage += inputCost * inputToken;
        usage += outputCost * outputToken;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentWeek = currentDate.getDay();
        const currentDay = currentDate.toDateString();
        // Update current month, week, and day if necessary
        if (prevUsage.monthly.month !== currentMonth) {
            // new month
            prevUsage.monthly.month = currentMonth;
            prevUsage.monthly.usage = [];
        }
        if (prevUsage.weekly.week !== currentWeek && currentWeek === 1) {
            // monday
            prevUsage.weekly.week = currentWeek;
            prevUsage.weekly.usage = [];
        }
        if (prevUsage.daily.day !== currentDay) {
            // new day
            prevUsage.daily.day = currentDay;
            prevUsage.daily.usage = [];
        }
        // Store usage in the corresponding arrays
        prevUsage.monthly.usage.push({ cost: usage, purpose: purpose });
        prevUsage.weekly.usage.push({ cost: usage, purpose: purpose });
        prevUsage.daily.usage.push({ cost: usage, purpose: purpose });
        yield chrome.storage.local.set({ usage: prevUsage });
    });
}

;// ./src/utils/chatGPT/AITagging.ts
var AITagging_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



function pushToArray(classification, taggedWebsites, website) {
    let tag = 0;
    if (classification === "productive") {
        tag = 1;
    }
    else if (classification === "unsure") {
        tag = 2;
    }
    else if (classification === "wasteful") {
        tag = 3;
    }
    taggedWebsites.push({ id: website, website, tag });
}
function apiCall(website, authKey) {
    return AITagging_awaiter(this, void 0, void 0, function* () {
        try {
            const requestBody = {
                model: model,
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "user",
                        content: `Tag the given site as wasteful, productive, or unsure depending on whether it is something that helps in work or is used to kill time. Your output should be a json object containing the classification, the URL. For example, if the website is Netflix.com and the description is your response might be: {'CLASSIFICATION': 'Wasteful', 'URL': 'netflix.com'}. Now, classify ${website}
      `,
                    },
                ],
            };
            const timeoutPromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    const timeoutError = new Error("API call timeout");
                    const timeoutResponse = new Response(JSON.stringify({ error: timeoutError }), {
                        status: 408,
                        statusText: "Request Timeout",
                        headers: { "Content-Type": "application/json" },
                    });
                    reject(timeoutResponse);
                }, 30000);
            });
            const fetchPromise = fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authKey}`,
                },
                body: JSON.stringify(requestBody),
            });
            const res = yield Promise.race([fetchPromise, timeoutPromise]);
            if (!res.ok) {
                throw new Error("API request failed");
            }
            const data = yield res.json();
            const inputTokens = data.usage.prompt_tokens;
            const outputTokens = data.usage.completion_tokens;
            yield estimatedCost(inputTokens, outputTokens, "tagging");
            const classifiedWebsites = data.choices[0].message.content;
            const classifiedWebsitesObject = JSON.parse(classifiedWebsites);
            yield chrome.storage.local.set({ lastApiCall: new Date().getTime() });
            return classifiedWebsitesObject;
        }
        catch (err) {
            console.log(err);
            yield chrome.storage.local.set({ lastApiCall: new Date().getTime() }); // don't let any api call for next 2.5 min
            return { website: website, CLASSIFICATION: "untagged" };
        }
    });
}
function AITagging() {
    var _a, _b, _c, _d, _e;
    return AITagging_awaiter(this, void 0, void 0, function* () {
        try {
            const authKey = (_a = (yield chrome.storage.local.get("authKey"))) === null || _a === void 0 ? void 0 : _a.authKey; // api key
            const websiteList = (_b = (yield chrome.storage.local.get("visitedURLs"))) === null || _b === void 0 ? void 0 : _b.visitedURLs; // untagged urls
            if (!websiteList || websiteList.length === 0) {
                return;
            }
            const preTaggedUrls = ((_c = (yield chrome.storage.local.get("preTaggedUrls"))) === null || _c === void 0 ? void 0 : _c.preTaggedUrls) || []; // list of pre tagged urls
            const taggedWebsites = [];
            const website = websiteList[0]; // get the first untagged website
            let classification = "untagged";
            const obj = preTaggedUrls.find((obj) => obj.URL === website); // find the current url in pre-tagged list
            if (obj) {
                // if found, push it to our list
                classification = obj.CLASSIFICATION.toLowerCase();
                pushToArray(classification, taggedWebsites, website);
            }
            else if (authKey) {
                // if api key is stored, try tagging it using chat gpt
                const lastApiCall = ((_d = (yield chrome.storage.local.get("lastApiCall"))) === null || _d === void 0 ? void 0 : _d.lastApiCall) ||
                    new Date(0).getTime();
                const currentTime = new Date().getTime();
                if (currentTime - lastApiCall < 30000) {
                    // if last api call was less than 2 minutes ago, skip to prevent rate limit
                    return;
                }
                const tagged = yield apiCall(website, authKey); // tag the website
                classification = (_e = tagged.CLASSIFICATION) === null || _e === void 0 ? void 0 : _e.toLowerCase();
                pushToArray(classification, taggedWebsites, website);
            }
            updateWebsitesInStorage(taggedWebsites); // update the website in storage
        }
        catch (e) {
            console.error(e);
        }
    });
}

;// ./src/utils/CONSTANTS/texts.ts
const NO_API_KEY_SUMMARY = "Please enter an OPENAI API Key to create and display summaries. Here's <a href='https://community.openai.com/t/how-do-i-get-my-api-key/29343' rel='noreferrer' target='_blank'>how to get one</a>";
const API_CALL_FAILED_SUMMARY = "Whoops, couldn't generate a summary. Not sure why.";
const SUMMARY_TIME_TOO_SHORT = "Looks like you didn't browse for long enough for a summary. That's probably a good thing!";
const SUMMARY_NO_DATA = "Huh, we couldn't find any browsing data from yesterday.";
const ALERT_TEXT__LIGHT = "Feeling Distracted?";
const ALERT_TEXT__DARK = "Let's Get Back to Work.";
const ALERT_TEXT__DARK_2 = "You got this!";
const ALERT_ACTIVITY = "Here is a quick activity to get you back to focus. Step away from the computer and try 5 pushups.";
const TYPE_PHRASE = "Type the phrase “Let Me Browse” to confirm";
const ALERT_GO_BACK = "You can still get Back to Work";
const ALERT_LEAVE_BUTTON = "Let's Go";
const ALERT_STAY_BUTTON = "Maybe Later";
const GREETING_TEXT__LIGHT = "Good Morning!";
const GREETING_TEXT__DARK = "Let's Do Great Things Today";
const GREETING_TEXT__DARK_2 = "And That Needs Focus";
const GREETING_RECAP = "Quick Recap From Yesterday";
const NO_FUNNY_LINES = "Feeling Distracted?";
const focusMessage = [
    { line1: "Yikes!", line2: "Are you not working?" },
    { line1: "Way off track!", line2: "Your mind is not on work right now!" },
    { line1: "At this rate…", line2: "It'll take you three years instead of one." },
    { line1: "More than half your time…", line2: "Is being frittered away" },
    { line1: "More than half your time…", line2: "Is being frittered away" },
    { line1: "Just about staying afloat", line2: "Want a wonderfully productive day? Step it up" },
    { line1: "Not bad, but lots of room", line2: "That is 20 minutes wasted every hour" },
    { line1: "Good job!", line2: "Go for glory and get to 90%" },
    { line1: "Feeling fantastically focused!", line2: "Keep it up, champ!" },
    { line1: "You're a zen master!", line2: "On top of the world!" },
];

;// ./src/utils/queryStorage/GetTaggedTime.ts
/*
Function to get the time of the user on a website along with tag
*/
var GetTaggedTime_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function msToHMS(ms) {
    // 1- Convert to seconds:
    let seconds = Math.floor(ms / 1000);
    // 2- Extract hours:
    const hours = Math.floor(seconds / 3600); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    const minutes = Math.floor(seconds / 60); // 60 seconds in 1 minute
    // 4- Keep only seconds not extracted to minutes:
    seconds = seconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}
function getTaggedTime(type) {
    var _a, _b, _c, _d;
    return GetTaggedTime_awaiter(this, void 0, void 0, function* () {
        const data = (_a = (yield chrome.storage.local.get(type))) === null || _a === void 0 ? void 0 : _a[type];
        if (!data) {
            return;
        }
        // get website tag data
        const taggedData = (_b = (yield chrome.storage.local.get("taggedURLs"))) === null || _b === void 0 ? void 0 : _b.taggedURLs;
        const result = data.map((d) => {
            return { url: d.url, time: d.time, tag: 0, value: msToHMS(d.time) };
        });
        if (type === "weeklyTime") {
            const numberOfDays = ((_c = (yield chrome.storage.local.get("numberOfDaysInWeek"))) === null || _c === void 0 ? void 0 : _c.numberOfDaysInWeek) || 1;
            result.forEach((d) => {
                d.time = d.time / numberOfDays;
                d.value = msToHMS(d.time);
            });
        }
        if (type === "monthlyTime") {
            const numberOfDays = ((_d = (yield chrome.storage.local.get("numberOfDays"))) === null || _d === void 0 ? void 0 : _d.numberOfDays) || 1;
            result.forEach((d) => {
                d.time = d.time / numberOfDays;
                d.value = msToHMS(d.time);
            });
        }
        if (taggedData) {
            for (const d of result) {
                for (const tag of taggedData) {
                    if (tag.website === d.url) {
                        d.tag = tag.tag;
                    }
                }
            }
        }
        return result;
    });
}

;// ./src/utils/scripts/mmToHM.ts
function msToHM(ms) {
    // 1- Convert to seconds:
    let seconds = Math.floor(ms / 1000);
    // 2- Extract hours:
    const hours = Math.floor(seconds / 3600); // 3,600 seconds in 1 hour
    seconds = seconds % 3600; // seconds remaining after extracting hours
    // 3- Extract minutes:
    const minutes = Math.floor(seconds / 60); // 60 seconds in 1 minute
    if (hours === 0 && minutes === 0) {
        return "<0m";
    }
    if (hours === 0) {
        return `${minutes}m`;
    }
    if (minutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
}

;// ./src/utils/scripts/processHistory.ts
var processHistory_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function organizeHistoryByBaseUrl(history, time) {
    return processHistory_awaiter(this, void 0, void 0, function* () {
        const organizedHistory = {};
        const times = time ||
            (yield chrome.storage.local.get("yesterdayTime")).yesterdayTime ||
            [];
        history.forEach((entry) => {
            var _a;
            const url = entry.url;
            const baseUrl = cleanURL(new URL(url).origin);
            if (!organizedHistory[baseUrl]) {
                const time = ((_a = times.find((x) => x.url === baseUrl)) === null || _a === void 0 ? void 0 : _a.time) || 0;
                organizedHistory[baseUrl] = { Explored: [], time: time };
            }
            if (!organizedHistory[baseUrl]["Explored"].includes(entry.title))
                organizedHistory[baseUrl]["Explored"].push(entry.title);
        });
        Object.keys(organizedHistory).forEach((key) => {
            organizedHistory[key].Explored = removeRedundantTerms(organizedHistory[key].Explored);
        });
        return convertToString(removeLessSignificantTerms(organizedHistory));
    });
}
function removeRedundantTerms(titles) {
    const termMap = new Map();
    // Loop through each title
    titles.forEach((title) => {
        // Split title into individual terms
        const terms = title.split(" - ");
        // Iterate over each term
        terms.forEach((term) => {
            // Remove leading and trailing whitespaces
            term = term.trim();
            // Add term to map with its count
            if (termMap.has(term)) {
                termMap.set(term, termMap.get(term) + 1);
            }
            else {
                termMap.set(term, 1);
            }
        });
    });
    // Filter out terms that occur more than once
    const uniqueTerms = Array.from(termMap.keys()).filter((term) => termMap.get(term) === 1);
    // Reconstruct titles with unique terms
    const uniqueTitles = titles.map((title) => {
        const terms = title.split(" - ");
        const uniqueTermsInTitle = terms.filter((term) => uniqueTerms.includes(term.trim()));
        return uniqueTermsInTitle.join(" - ");
    });
    return uniqueTitles;
}
function cleanURL(url) {
    // Remove protocol (e.g., https://)
    let cleanedURL = url.replace(/^(https?:\/\/)?/, "");
    // Remove www subdomain if present
    cleanedURL = cleanedURL.replace(/^www\./, "");
    // Remove top-level domain and any subdomains
    cleanedURL = cleanedURL.replace(/\.[a-z]{2,}$/, "");
    return cleanedURL;
}
function convertToString(organizedHistory) {
    // Replace all double quotes with an empty string
    const str = JSON.stringify(organizedHistory);
    return str.replace(/"/g, "");
}
function removeLessSignificantTerms(organizedHistory) {
    // removing sites with time less than 1 minute and less than 3 visits
    const keys = Object.keys(organizedHistory);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const site = organizedHistory[key];
        const time = site.time;
        if (time < 60 * 1000 && site.Explored.length < 3) {
            delete organizedHistory[key];
        }
        else {
            site.time = msToHM(time);
        }
    }
    return organizedHistory;
}

;// ./src/utils/chatGPT/API_CALL.ts
var API_CALL_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


function apiCallWithTimeout(prompt, timeout = 30000, purpose, authKey) {
    return API_CALL_awaiter(this, void 0, void 0, function* () {
        try {
            const requestBody = {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            };
            const timeoutPromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    const timeoutError = new Error("API call timeout");
                    const timeoutResponse = new Response(JSON.stringify({ error: timeoutError }), {
                        status: 408,
                        statusText: "Request Timeout",
                        headers: { "Content-Type": "application/json" },
                    });
                    reject(timeoutResponse);
                }, timeout);
            });
            const fetchPromise = fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authKey}`,
                },
                body: JSON.stringify(requestBody),
            });
            const res = yield Promise.race([fetchPromise, timeoutPromise]);
            if (!res.ok) {
                console.log(res);
                throw new Error("API request failed");
            }
            const data = yield res.json();
            const inputTokens = data.usage.prompt_tokens;
            const outputTokens = data.usage.completion_tokens;
            yield estimatedCost(inputTokens, outputTokens, purpose);
            const summary = data.choices[0].message.content;
            return summary;
        }
        catch (err) {
            return err.message;
        }
    });
}

;// ./src/utils/chatGPT/DailyRecap.ts
var DailyRecap_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





function dailyRecap() {
    var _a;
    return DailyRecap_awaiter(this, void 0, void 0, function* () {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var startTime = yesterday.setHours(0, 0, 0, 0);
        var endTime = yesterday.setHours(23, 59, 59, 999);
        const historyItems = yield chrome.history.search({
            text: "",
            startTime: startTime,
            endTime: endTime,
            maxResults: 1000,
        });
        const organizedHistory = yield organizeHistoryByBaseUrl(historyItems);
        const authKey = (_a = (yield chrome.storage.local.get("authKey"))) === null || _a === void 0 ? void 0 : _a.authKey; // api key
        if (!authKey) {
            yield chrome.storage.local.set({
                prevDaySummary: [NO_API_KEY_SUMMARY, yesterday.toDateString()],
            });
            return false;
        }
        const lastCalled = (yield chrome.storage.local.get("summaryLock"))
            .summaryLock;
        if (new Date().getTime() - lastCalled <= 30 * 1000) {
            return false;
        }
        yield chrome.storage.local.set({ summaryLock: new Date().getTime() });
        const yesterdayTime = yield getTaggedTime("yesterdayTime");
        if (!yesterdayTime) {
            yield chrome.storage.local.set({
                prevDaySummary: [SUMMARY_NO_DATA, yesterday.toDateString()],
            });
            return false;
        }
        const totalTime = yesterdayTime.reduce((acc, website) => acc + website.time, 0);
        const focusRate = totalTime &&
            (yesterdayTime.reduce((acc, website) => acc + (website.tag === 1 ? website.time : 0), 0) /
                totalTime) *
                100;
        const summary = yield prevDaySummary(organizedHistory, authKey, yesterday, focusRate);
        if (summary === "") {
            yield chrome.storage.local.set({
                prevDaySummary: [API_CALL_FAILED_SUMMARY, yesterday.toDateString()],
            });
            return false;
        }
        yield chrome.storage.local.set({
            prevDaySummary: [summary, yesterday.toDateString()],
        });
        return true;
    });
}
function prevDaySummary(history, authKey, date, focusRate) {
    return DailyRecap_awaiter(this, void 0, void 0, function* () {
        return yield apiCallWithTimeout(DAILY_RECAP_PROMPT(history, focusRate), 30000, `dailyRecap ${date.toDateString()}`, authKey);
    });
}

;// ./src/utils/chatGPT/HourlyRecap.ts
var HourlyRecap_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};




function hourlyRecap(hourlyTime, date) {
    var _a;
    return HourlyRecap_awaiter(this, void 0, void 0, function* () {
        // var today = date + 60 * 60 * 1000;
        var today = new Date().getTime();
        var hourAgo = date;
        const authKey = (_a = (yield chrome.storage.local.get("authKey"))) === null || _a === void 0 ? void 0 : _a.authKey; // api key
        if (!hourlyTime) {
            if (!authKey) {
                yield chrome.storage.local.set({
                    prevHourSummary: [NO_API_KEY_SUMMARY, today, 0, 0],
                });
                return false;
            }
            yield chrome.storage.local.set({
                prevHourSummary: [SUMMARY_TIME_TOO_SHORT, today, 0, 0],
            });
            return false;
        }
        yield chrome.storage.local.set({
            lastHourlyTime: {
                hourlyTime: hourlyTime,
                hour: date,
            },
        });
        const timeSpent = hourlyTime.reduce((acc, website) => acc + website.time, 0);
        const productiveTime = hourlyTime.reduce((acc, website) => {
            if (website.tag === 1) {
                return acc + website.time;
            }
            else {
                return acc;
            }
        }, 0);
        const unfocusedTime = timeSpent - productiveTime;
        if (!authKey) {
            yield chrome.storage.local.set({
                prevHourSummary: [
                    NO_API_KEY_SUMMARY,
                    today,
                    productiveTime,
                    unfocusedTime,
                ],
            });
            return false;
        }
        if (timeSpent <= 15 * 60 * 1000) {
            // if time spent less than 15 min
            yield chrome.storage.local.set({
                prevHourSummary: [
                    SUMMARY_TIME_TOO_SHORT,
                    today,
                    productiveTime,
                    unfocusedTime,
                ],
            });
            return false;
        }
        const historyItems = yield chrome.history.search({
            text: "",
            startTime: hourAgo,
            endTime: today,
            maxResults: 1000,
        });
        const organizedHistory = yield organizeHistoryByBaseUrl(historyItems, hourlyTime);
        const lastCalled = (yield chrome.storage.local.get("summaryLock"))
            .summaryLock;
        if (new Date().getTime() - lastCalled <= 30 * 1000) {
            return false;
        }
        yield chrome.storage.local.set({ summaryLock: new Date().getTime() });
        const productivePercentage = (productiveTime / (timeSpent + 1)) * 100;
        const summary = yield prevHourSummary(organizedHistory, authKey, today, productivePercentage);
        if (summary === "") {
            yield chrome.storage.local.set({
                prevHourSummary: [
                    API_CALL_FAILED_SUMMARY,
                    today,
                    productiveTime,
                    unfocusedTime,
                ],
            });
            return false;
        }
        yield chrome.storage.local.set({
            prevHourSummary: [summary, today, productiveTime, unfocusedTime],
        });
        return true;
    });
}
function prevHourSummary(history, authKey, date, productiveTime) {
    return HourlyRecap_awaiter(this, void 0, void 0, function* () {
        return yield apiCallWithTimeout(HOURLY_RECAP_PROMPT(history, productiveTime), 30000, `hourlyRecap ${date}`, authKey);
    });
}

;// ./src/utils/scripts/setBadgeText.ts
function setBadgeText(time, tabId) {
    chrome.action.setBadgeText({ text: getTime(time), tabId: tabId });
}
function getTime(time) {
    const sec = time;
    const min = Number((time / 60).toFixed(0));
    const hours = Number((time / (60 * 60)).toFixed(1));
    if (sec < 60)
        return ``;
    else if (min < 60)
        return `${min}m`;
    else
        return `${hours}h`;
}

;// ./src/utils/main/WebTime.ts
/*
    Monitor user activity and store the time spent on websites
*/
var WebTime_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



class WebTime {
    constructor(dailyTime, weeklyTime, monthlyTime, hourlyTime, isDisabled) {
        this.idleTime = 30;
        this.isInFocus = true;
        this.dailyTime = [];
        this.weeklyTime = [];
        this.monthlyTime = [];
        this.hourlyTime = [];
        this.isDisabled = isDisabled;
        this.focusInterval = setInterval(this.updateFocus.bind(this), 1000);
        this.saveInterval = setInterval(this.updateData.bind(this), 1000);
        this.dailyTime = dailyTime;
        this.weeklyTime = weeklyTime;
        this.monthlyTime = monthlyTime;
        this.hourlyTime = hourlyTime;
    }
    updateFocus() {
        chrome.windows.getLastFocused({ populate: true }, (windows) => {
            this.isInFocus = windows.focused;
        });
    }
    updateData() {
        chrome.windows.getLastFocused({ populate: true }, (windows) => {
            if (!windows || !windows.tabs) {
                return;
            }
            for (let tab of windows.tabs) {
                if (tab.active) {
                    this.focusedTab = tab;
                    break;
                }
            }
            if (this.focusedTab === undefined) {
                return;
            }
            chrome.idle.queryState(this.idleTime, (state) => {
                const url = this.focusedTab.url;
                if (!url) {
                    return;
                }
                const origin = new URL(url).origin;
                if (state === "active" &&
                    origin !== "" &&
                    !origin.startsWith("chrome://") &&
                    !origin.startsWith("chrome-extension://") &&
                    !this.isDisabled) {
                    this.isInFocus && this.updateDataHelper(origin, this.focusedTab.id);
                    this.isInFocus && this.saveData();
                    this.isInFocus && this.addToUntagged(origin);
                }
            });
        });
    }
    updateDataHelper(origin, tabId) {
        let found = false;
        for (let i = 0; i < this.hourlyTime.length; i++) {
            if (this.hourlyTime[i].url === origin) {
                this.hourlyTime[i].time += 1000;
                found = true;
                break;
            }
        }
        if (!found) {
            this.hourlyTime.push({ url: origin, time: 1000 });
            found = false;
        }
        for (let i = 0; i < this.dailyTime.length; i++) {
            if (this.dailyTime[i].url === origin) {
                this.dailyTime[i].time += 1000;
                setBadgeText(this.dailyTime[i].time / 1000, tabId);
                found = true;
                break;
            }
        }
        if (!found) {
            this.dailyTime.push({ url: origin, time: 1000 });
            found = false;
        }
        for (let i = 0; i < this.weeklyTime.length; i++) {
            if (this.weeklyTime[i].url === origin) {
                this.weeklyTime[i].time += 1000;
                found = true;
                break;
            }
        }
        if (!found) {
            this.weeklyTime.push({ url: origin, time: 1000 });
            found = false;
        }
        for (let i = 0; i < this.monthlyTime.length; i++) {
            if (this.monthlyTime[i].url === origin) {
                this.monthlyTime[i].time += 1000;
                found = true;
                break;
            }
        }
        if (!found) {
            this.monthlyTime.push({ url: origin, time: 1000 });
            found = false;
        }
    }
    saveData() {
        this.storeDailyTime();
        this.storeWeeklyTime();
        this.storeMonthlyTime();
        this.storeHourlyTime();
    }
    addToUntagged(url) {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const visited = yield this.checkIfURLVisited(url);
            if (!visited) {
                chrome.storage.local.get(["visitedURLs"], (data) => {
                    const visitedURLs = data.visitedURLs || [];
                    visitedURLs.push(url);
                    chrome.storage.local.set({ visitedURLs: visitedURLs });
                });
            }
        });
    }
    storeWeeklyTime() {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const day = new Date().getDay();
            const lastDay = (yield chrome.storage.local.get("dayToday")).dayToday || 0;
            if (day === 1 && day !== lastDay) {
                // Monday
                yield this.setNewWeek();
            }
            else if (day !== lastDay) {
                // Same week but new day
                yield chrome.storage.local.set({ dayToday: day });
                const numberOfDaysInWeek = (yield chrome.storage.local.get("numberOfDaysInWeek"))
                    .numberOfDaysInWeek || 0;
                yield chrome.storage.local.set({
                    numberOfDaysInWeek: numberOfDaysInWeek + 1,
                });
            }
            yield chrome.storage.local.set({ weeklyTime: this.weeklyTime });
            return;
        });
    }
    storeMonthlyTime() {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const month = new Date().getMonth();
            const lastMonth = (yield chrome.storage.local.get("monthToday")).monthToday || 0;
            if (month !== lastMonth) {
                yield this.setNewMonth();
            }
            yield chrome.storage.local.set({ monthlyTime: this.monthlyTime });
            return;
        });
    }
    storeDailyTime() {
        var _a;
        return WebTime_awaiter(this, void 0, void 0, function* () {
            // Store the time spent on the website for the day
            const dateString = new Date().toDateString(); // Get the current date
            const oldDate = ((_a = (yield chrome.storage.local.get("today"))) === null || _a === void 0 ? void 0 : _a.today) || ""; // Get the last date the user was active
            if (oldDate !== dateString) {
                const month = new Date().getMonth();
                const lastMonth = (yield chrome.storage.local.get("monthToday")).monthToday || 0;
                if (month !== lastMonth) {
                    yield this.setNewDay(false);
                }
                else {
                    yield this.setNewDay(true);
                }
            }
            yield chrome.storage.local.set({ dailyTime: this.dailyTime });
            return;
        });
    }
    storeHourlyTime() {
        var _a;
        return WebTime_awaiter(this, void 0, void 0, function* () {
            // Store the time spent on the website for the hour
            const dateString = new Date().getTime(); // Get the current time
            const oldDate = ((_a = (yield chrome.storage.local.get("hourBegin"))) === null || _a === void 0 ? void 0 : _a.hourBegin) || 0; // Get the last hour beginning
            if (dateString - oldDate > 60 * 60 * 1000) {
                yield this.setNewHour(oldDate);
            }
            yield chrome.storage.local.set({ hourlyTime: this.hourlyTime });
            return;
        });
    }
    setNewDay(isNewMonth) {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const dateString = new Date().toDateString();
            if (!isNewMonth) {
                let numberOfDays = (yield chrome.storage.local.get("numberOfDays")).numberOfDays || 0;
                yield chrome.storage.local.set({ numberOfDays: numberOfDays + 1 });
            }
            yield chrome.storage.local.set({ today: dateString });
            yield chrome.storage.local.set({ dailyTime: [] });
            yield chrome.storage.local.set({ yesterdayTime: this.dailyTime });
            this.dailyTime = [];
        });
    }
    setNewWeek() {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const day = new Date().getDay();
            yield chrome.storage.local.set({ numberOfDaysInWeek: 1 });
            yield chrome.storage.local.set({ dayToday: day });
            yield chrome.storage.local.set({ weeklyTime: [] });
            this.weeklyTime = [];
        });
    }
    setNewMonth() {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const month = new Date().getMonth();
            yield chrome.storage.local.set({ numberOfDays: 1 });
            yield chrome.storage.local.set({ monthToday: month });
            yield chrome.storage.local.set({ monthlyTime: [] });
            this.monthlyTime = [];
        });
    }
    setNewHour(oldDate) {
        return WebTime_awaiter(this, void 0, void 0, function* () {
            const time = new Date().getTime();
            yield chrome.storage.local.set({ hourBegin: time });
            hourlyRecap(yield getTaggedTime("hourlyTime"), oldDate);
            yield chrome.storage.local.set({ hourlyTime: [] });
            this.hourlyTime = [];
        });
    }
    checkIfURLVisited(url) {
        return new Promise((resolve) => {
            chrome.storage.local.get(["visitedURLs", "taggedURLs"], (data) => {
                const visitedURLs = data.visitedURLs || [];
                const taggedURLs = data.taggedURLs || [];
                resolve(visitedURLs.includes(url) ||
                    taggedURLs.some((website) => website.website === url));
            });
        });
    }
    setDisable(isDisabled) {
        this.isDisabled = isDisabled;
    }
}

;// ./src/utils/CONSTANTS/SessionConstants.ts
const ACTIVE_SESSION_STORAGE_KEY = 'activeSession';
const SESSION_ALARM_NAME = 'sessionTransitionAlarm';

;// ./src/utils/CONSTANTS/SessionTemplates.ts
const DEFAULT_SESSION_TEMPLATES = [
    { id: 'pomodoro_25_5', name: 'Pomodoro (25/5)', workMinutes: 25, breakMinutes: 5, cycles: 4, description: 'Classic 25 min focus, 5 min break.' },
    { id: 'deep_work_50_10', name: 'Deep Work (50/10)', workMinutes: 50, breakMinutes: 10, cycles: 2, description: '50 min intense focus, 10 min break.' },
    { id: 'quick_sprint_15_3', name: 'Quick Sprint (15/3)', workMinutes: 15, breakMinutes: 3, cycles: 6, description: 'Short burst of 15 min work, 3 min refresh.' },
];

;// ./src/background.ts
var background_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





let webTime;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var _a;
    if (request.redirect) {
        if (checkDisable()) {
            return;
        }
        chrome.tabs.update(sender.tab.id, { url: request.redirect + `?from=${(_a = sender.tab) === null || _a === void 0 ? void 0 : _a.url}` });
    }
    else if (request.summarize === "prevDay") {
        dailyRecap()
            .then(function (result) {
            sendResponse({ success: true, result });
        })
            .catch(function (error) {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Indicates that response will be sent asynchronously
    }
    else if (request.type === 'START_SESSION' && request.templateId) {
        startSession(request.templateId, request.template);
    }
    else if (request.type === 'PAUSE_SESSION') {
        pauseSession();
    }
    else if (request.type === 'RESUME_SESSION') {
        resumeSession();
    }
    else if (request.type === 'END_SESSION') {
        endSession();
    }
});
var isExtensionDisabled = false;
var isExtensionDisabledOnWeekend = true;
var isWeekend = [0, 6].includes(new Date().getDay());
function checkDisable() {
    return isExtensionDisabled || isExtensionDisabledOnWeekend;
}
function handleExtensionEnable() {
    return background_awaiter(this, void 0, void 0, function* () {
        isExtensionDisabledOnWeekend =
            ((yield chrome.storage.local.get("isDisabledOnWeekend"))
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
        chrome.storage.onChanged.addListener((changes) => background_awaiter(this, void 0, void 0, function* () {
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
        }));
    });
}
function tagWebsite() {
    return background_awaiter(this, void 0, void 0, function* () {
        if (checkDisable()) {
            return;
        }
        yield AITagging();
    });
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
function checkAlarm() {
    return background_awaiter(this, void 0, void 0, function* () {
        let alarm = yield chrome.alarms.get("tagWebsite");
        if (alarm) {
            yield chrome.alarms.clear("tagWebsite");
        }
        yield chrome.alarms.create("tagWebsite", { periodInMinutes: 0.75 });
        alarm = yield chrome.alarms.get("updateFocusMode");
        if (!alarm) {
            const scheduledTime = (yield chrome.storage.local.get("focusModeEndTime"))
                .focusModeEndTime;
            if (scheduledTime) {
                const time = scheduledTime - new Date().getTime();
                yield chrome.alarms.create("updateFocusMode", {
                    when: new Date().getTime() + time,
                });
            }
        }
    });
}
chrome.alarms.onAlarm.addListener((alarm) => background_awaiter(void 0, void 0, void 0, function* () {
    if (alarm.name === "tagWebsite") {
        tagWebsite();
    }
    if (alarm.name === "updateFocusMode") {
        yield chrome.storage.local.set({ enableSuperFocusMode: false });
        yield chrome.storage.local.remove("focusModeEndTime");
        yield chrome.storage.local.remove("focusModeDuration");
    }
    if (alarm.name === SESSION_ALARM_NAME) {
        yield transitionSessionPhase();
    }
}));
checkAlarm();
chrome.storage.local.get((res) => {
    const dailyTime = res.dailyTime || [];
    const weeklyTime = res.weeklyTime || [];
    const monthlyTime = res.monthlyTime || [];
    const hourlyTime = res.hourlyTime || [];
    webTime = new WebTime(dailyTime, weeklyTime, monthlyTime, hourlyTime, checkDisable());
});
chrome.runtime.onStartup.addListener(() => { });
chrome.action.setBadgeBackgroundColor({ color: [0, 255, 0, 0] });
loadData();
// Session management functions
function startSession(templateId, templateData) {
    return background_awaiter(this, void 0, void 0, function* () {
        let template = templateData;
        if (!template) {
            const data = yield chrome.storage.local.get('customSessionTemplates');
            const customTemplates = data.customSessionTemplates || [];
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
        const newState = {
            templateId,
            currentPhase: 'work',
            phaseKey: 'work-1',
            phaseEndTime,
            isPaused: false,
            currentCycle: 1,
            totalCycles: template.cycles || 1
        };
        yield chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
        yield chrome.storage.local.set({ enableSuperFocusMode: true });
        // Sync the focus mode timer with the session timer
        // Store the start time and end time for accurate display
        yield chrome.storage.local.set({
            focusModeEndTime: phaseEndTime,
            focusModeDuration: template.workMinutes,
            focusModeStartTime: now
        });
        yield chrome.alarms.create(SESSION_ALARM_NAME, { when: phaseEndTime });
        chrome.notifications.create(SESSION_ALARM_NAME + '_start', {
            type: 'basic',
            iconUrl: 'images/recenter_logo.png',
            title: `Started ${template.name}`,
            message: `Work session: ${template.workMinutes} minutes. (Cycle 1/${template.cycles || 1})`,
        });
        chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
    });
}
function transitionSessionPhase() {
    return background_awaiter(this, void 0, void 0, function* () {
        const storage = yield chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY);
        const state = storage[ACTIVE_SESSION_STORAGE_KEY];
        if (!state)
            return;
        let template = DEFAULT_SESSION_TEMPLATES.find(t => t.id === state.templateId);
        if (!template) {
            const data = yield chrome.storage.local.get('customSessionTemplates');
            const customTemplates = data.customSessionTemplates || [];
            template = customTemplates.find(t => t.id === state.templateId);
            if (!template) {
                console.error(`Template not found for session: ${state.templateId}`);
                return;
            }
        }
        const isLastPhaseOfCycle = state.currentPhase === 'break';
        const isLastCycle = state.currentCycle >= state.totalCycles;
        if (isLastPhaseOfCycle && isLastCycle) {
            yield endSession();
            return;
        }
        const nextPhase = state.currentPhase === 'work' ? 'break' : 'work';
        const nextCycle = isLastPhaseOfCycle ? state.currentCycle + 1 : state.currentCycle;
        const durationMinutes = nextPhase === 'work' ? template.workMinutes : template.breakMinutes;
        const nextPhaseKey = `${nextPhase}-${nextCycle}`;
        const now = Date.now();
        const phaseEndTime = now + durationMinutes * 60 * 1000;
        const newState = Object.assign(Object.assign({}, state), { currentPhase: nextPhase, currentCycle: nextCycle, phaseKey: nextPhaseKey, phaseEndTime, isPaused: false, pausedTimeRemainingMs: undefined });
        yield chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
        yield chrome.storage.local.set({ enableSuperFocusMode: nextPhase === 'work' });
        if (nextPhase === 'work') {
            // Only sync focus mode timer for work phases
            // Update start time to the current time for the new phase
            yield chrome.storage.local.set({
                focusModeEndTime: phaseEndTime,
                focusModeDuration: durationMinutes,
                focusModeStartTime: now
            });
        }
        else {
            // For break phases, clear the focus mode
            yield chrome.storage.local.remove("focusModeEndTime");
            yield chrome.storage.local.remove("focusModeDuration");
            yield chrome.storage.local.remove("focusModeStartTime");
        }
        yield chrome.alarms.create(SESSION_ALARM_NAME, { when: phaseEndTime });
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
    });
}
function pauseSession() {
    return background_awaiter(this, void 0, void 0, function* () {
        const storage = yield chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY);
        const state = storage[ACTIVE_SESSION_STORAGE_KEY];
        if (!state || state.isPaused) {
            return;
        }
        const remaining = state.phaseEndTime - Date.now();
        yield chrome.alarms.clear(SESSION_ALARM_NAME);
        const newState = Object.assign(Object.assign({}, state), { isPaused: true, pausedTimeRemainingMs: remaining });
        yield chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
        yield chrome.storage.local.set({ enableSuperFocusMode: false });
        // Clear the focus mode when session is paused
        yield chrome.storage.local.remove("focusModeEndTime");
        yield chrome.storage.local.remove("focusModeDuration");
        yield chrome.storage.local.remove("focusModeStartTime");
        chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
    });
}
function resumeSession() {
    return background_awaiter(this, void 0, void 0, function* () {
        const storage = yield chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY);
        const state = storage[ACTIVE_SESSION_STORAGE_KEY];
        if (!state || !state.isPaused || state.pausedTimeRemainingMs === undefined) {
            return;
        }
        const now = Date.now();
        const phaseEndTime = now + state.pausedTimeRemainingMs;
        yield chrome.alarms.create(SESSION_ALARM_NAME, { when: phaseEndTime });
        const newState = Object.assign(Object.assign({}, state), { isPaused: false, phaseEndTime, pausedTimeRemainingMs: undefined });
        yield chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: newState });
        yield chrome.storage.local.set({ enableSuperFocusMode: newState.currentPhase === 'work' });
        // Resync the focus mode timer when session is resumed
        if (newState.currentPhase === 'work') {
            yield chrome.storage.local.set({
                focusModeEndTime: phaseEndTime,
                focusModeDuration: Math.ceil(state.pausedTimeRemainingMs / (60 * 1000)),
                focusModeStartTime: now
            });
        }
        chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: newState });
    });
}
function endSession() {
    return background_awaiter(this, void 0, void 0, function* () {
        yield chrome.alarms.clear(SESSION_ALARM_NAME);
        yield chrome.storage.local.set({ enableSuperFocusMode: false });
        yield chrome.storage.local.remove(ACTIVE_SESSION_STORAGE_KEY);
        chrome.notifications.create(SESSION_ALARM_NAME + '_ended', {
            type: 'basic',
            iconUrl: 'images/recenter_logo.png',
            title: 'Session ended',
            message: 'Your session has been ended.',
        });
        chrome.runtime.sendMessage({ type: 'SESSION_ENDED' });
    });
}

/******/ })()
;