const ui = {
  apiURL: document.querySelector("#api-url"),
  apiState: document.querySelector("#api-state"),
  apiVersion: document.querySelector("#api-version"),
  sessionState: document.querySelector("#session-state"),
  socketState: document.querySelector("#socket-state"),
  sessionID: document.querySelector("#session-id"),
  commandLine: document.querySelector("#command-line"),
  healthButton: document.querySelector("#health-btn"),
  connectButton: document.querySelector("#connect-btn"),
  newSessionButton: document.querySelector("#new-session-btn"),
  closeSessionButton: document.querySelector("#close-session-btn"),
  sendCommandButton: document.querySelector("#send-command-btn"),
  clearTerminalButton: document.querySelector("#clear-terminal-btn"),
  focusTerminalButton: document.querySelector("#focus-terminal-btn"),
  comFile: document.querySelector("#com-file"),
  uploadFileButton: document.querySelector("#upload-file-btn"),
  refreshFilesButton: document.querySelector("#refresh-files-btn"),
  refreshDashboardButton: document.querySelector("#refresh-dashboard-btn"),
  terminal: document.querySelector("#terminal"),
  scrollback: document.querySelector("#scrollback"),
  terminalTitle: document.querySelector("#terminal-title"),
  terminalMeta: document.querySelector("#terminal-meta"),
  log: document.querySelector("#log"),
  outputCount: document.querySelector("#output-count"),
  cursorPos: document.querySelector("#cursor-pos"),
  sessionCount: document.querySelector("#session-count"),
  sessionList: document.querySelector("#session-list"),
  fileCount: document.querySelector("#file-count"),
  fileList: document.querySelector("#file-list")
};

const state = {
  ws: null,
  sessionID: "",
  outputBytes: 0,
  rawText: "",
  scrollback: "",
  connected: false
};

init();

async function init() {
  bindEvents();
  setBadge(ui.apiState, "API", "muted");
  setBadge(ui.sessionState, "idle", "muted");
  setBadge(ui.socketState, "chiuso", "muted");
  try {
    const response = await fetch("/config.json", { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      if (config.default_api_url) {
        ui.apiURL.value = config.default_api_url;
      }
    }
  } catch (error) {
    logEvent(`config: ${error.message}`);
  }
  await checkAPI();
  await refreshDashboard();
}

function bindEvents() {
  ui.healthButton.addEventListener("click", checkAPI);
  ui.newSessionButton.addEventListener("click", createSession);
  ui.connectButton.addEventListener("click", connectExistingSession);
  ui.closeSessionButton.addEventListener("click", closeSession);
  ui.sendCommandButton.addEventListener("click", sendCommandLine);
  ui.clearTerminalButton.addEventListener("click", clearTerminal);
  ui.focusTerminalButton.addEventListener("click", () => ui.terminal.focus());
  ui.uploadFileButton.addEventListener("click", uploadCOM);
  ui.refreshFilesButton.addEventListener("click", refreshFiles);
  ui.refreshDashboardButton.addEventListener("click", refreshDashboard);
  ui.commandLine.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendCommandLine();
    }
  });
  ui.terminal.addEventListener("keydown", handleTerminalKey);
}

async function checkAPI() {
  try {
    const health = await apiFetch("/health");
    setBadge(ui.apiState, health.status === "ok" ? "API ok" : "API", health.status === "ok" ? "ok" : "warn");
    const version = await apiFetch("/version");
    ui.apiVersion.textContent = version.version || "-";
    logEvent("API raggiunta");
    await refreshDashboard();
  } catch (error) {
    setBadge(ui.apiState, "API errore", "error");
    ui.apiVersion.textContent = "-";
    logEvent(`API: ${error.message}`);
  }
}

async function createSession() {
  try {
    disconnectSocket();
    const session = await apiFetch("/sessions", { method: "POST" });
    state.sessionID = session.id;
    ui.sessionID.value = session.id;
    setSessionState(session.state || "idle", session.closed);
    logEvent(`sessione ${shortID(session.id)} creata`);
    await refreshDashboard();
    await refreshFiles();
    openSocket(session.id);
  } catch (error) {
    setBadge(ui.sessionState, "errore", "error");
    logEvent(`sessione: ${error.message}`);
  }
}

function connectExistingSession() {
  const id = ui.sessionID.value.trim();
  if (!id) {
    logEvent("sessione mancante");
    return;
  }
  state.sessionID = id;
  disconnectSocket();
  openSocket(id);
  refreshFiles();
}

async function closeSession() {
  const id = currentSessionID();
  if (!id) {
    return;
  }
  try {
    disconnectSocket();
    await apiFetch(`/sessions/${encodeURIComponent(id)}`, { method: "DELETE", empty: true });
    setSessionState("closed", true);
    logEvent(`sessione ${shortID(id)} chiusa`);
    await refreshDashboard();
    renderFiles([]);
  } catch (error) {
    logEvent(`chiusura: ${error.message}`);
  }
}

async function refreshDashboard() {
  try {
    const result = await apiFetch("/sessions");
    const sessions = Array.isArray(result.sessions) ? result.sessions : [];
    ui.sessionCount.textContent = `${result.count || sessions.length} / ${result.limit || 0}`;
    renderSessionList(sessions);
  } catch (error) {
    ui.sessionCount.textContent = "-";
    ui.sessionList.textContent = "API non disponibile";
  }
}

async function refreshFiles() {
  const id = currentSessionID();
  if (!id) {
    renderFiles([]);
    return;
  }
  try {
    const result = await apiFetch(`/sessions/${encodeURIComponent(id)}/files`);
    renderFiles(Array.isArray(result.files) ? result.files : []);
  } catch (error) {
    ui.fileList.textContent = `errore: ${error.message}`;
    ui.fileCount.textContent = "-";
  }
}

async function uploadCOM() {
  const id = currentSessionID();
  if (!id) {
    logEvent("crea o collega una sessione prima dell'upload");
    return;
  }
  const file = ui.comFile.files && ui.comFile.files[0];
  if (!file) {
    logEvent("seleziona un file .COM");
    return;
  }
  if (!file.name.toUpperCase().endsWith(".COM")) {
    logEvent("sono ammessi solo file .COM");
    return;
  }
  const form = new FormData();
  form.append("file", file, file.name);
  try {
    const result = await apiFetch(`/sessions/${encodeURIComponent(id)}/files`, {
      method: "POST",
      form
    });
    logEvent(`upload ${result.name} (${result.size} byte)`);
    ui.comFile.value = "";
    await refreshFiles();
  } catch (error) {
    logEvent(`upload: ${error.message}`);
  }
}

function openSocket(id) {
  const url = websocketURL(id);
  const ws = new WebSocket(url);
  state.ws = ws;
  setBadge(ui.socketState, "apertura", "warn");
  ws.addEventListener("open", () => {
    state.connected = true;
    setBadge(ui.socketState, "aperto", "ok");
    ui.terminal.focus();
    logEvent(`websocket ${shortID(id)}`);
  });
  ws.addEventListener("message", (event) => handleSocketMessage(event.data));
  ws.addEventListener("close", () => {
    if (state.ws === ws) {
      state.connected = false;
      setBadge(ui.socketState, "chiuso", "muted");
    }
  });
  ws.addEventListener("error", () => {
    setBadge(ui.socketState, "errore", "error");
    logEvent("websocket errore");
  });
}

function handleSocketMessage(data) {
  let message;
  try {
    message = JSON.parse(data);
  } catch (error) {
    logEvent(`JSON: ${error.message}`);
    return;
  }
  if (message.type === "output" && message.data) {
    state.outputBytes += message.data.length;
    ui.outputCount.textContent = `${state.outputBytes} byte`;
    appendRaw(message.data);
  }
  if (message.type === "snapshot" && message.snapshot) {
    renderSnapshot(message.snapshot);
  }
  if (message.state || message.closed) {
    setSessionState(message.state || "idle", Boolean(message.closed));
  }
  if (message.type === "error" && message.error) {
    logEvent(`errore: ${message.error}`);
    setBadge(ui.sessionState, "errore", "error");
  }
}

function sendCommandLine() {
  const value = ui.commandLine.value.trim();
  if (!value) {
    return;
  }
  sendInput(`${value}\r`);
  ui.commandLine.value = "";
  ui.terminal.focus();
}

function handleTerminalKey(event) {
  if (!state.connected) {
    return;
  }
  let data = "";
  if (event.ctrlKey && !event.altKey && !event.metaKey) {
    const key = event.key.toLowerCase();
    if (key === "c") data = "\x03";
    if (key === "d") data = "\x04";
    if (key === "l") data = "\x0c";
    if (key === "q") data = "\x11";
  } else if (event.key === "Enter") {
    data = "\r";
  } else if (event.key === "Backspace") {
    data = "\x7f";
  } else if (event.key === "Tab") {
    data = "\t";
  } else if (event.key === "Escape") {
    data = "\x1b";
  } else if (event.key === "ArrowUp") {
    data = "\x1b[A";
  } else if (event.key === "ArrowDown") {
    data = "\x1b[B";
  } else if (event.key === "ArrowRight") {
    data = "\x1b[C";
  } else if (event.key === "ArrowLeft") {
    data = "\x1b[D";
  } else if (event.key === "Home") {
    data = "\x1b[H";
  } else if (event.key === "End") {
    data = "\x1b[F";
  } else if (event.key === "Delete") {
    data = "\x1b[3~";
  } else if (event.key.length === 1) {
    data = event.key;
  }
  if (data) {
    event.preventDefault();
    sendInput(data);
  }
}

function sendInput(data) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    logEvent("websocket non aperto");
    return;
  }
  state.ws.send(JSON.stringify({ type: "input", data }));
}

async function apiFetch(path, options = {}) {
  const base = ui.apiURL.value.trim().replace(/\/+$/, "");
  const response = await fetch(`${base}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.form || (options.body ? JSON.stringify(options.body) : undefined)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (options.empty || response.status === 204) {
    return null;
  }
  return response.json();
}

function websocketURL(id) {
  const base = new URL(ui.apiURL.value.trim());
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = `${base.pathname.replace(/\/+$/, "")}/sessions/${encodeURIComponent(id)}/ws`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

function renderSnapshot(snapshot) {
  if (!Array.isArray(snapshot.rows)) {
    return;
  }
  ui.terminal.textContent = "";
  const cursorRow = snapshot.cursor_row || 0;
  const cursorCol = snapshot.cursor_col || 0;
  snapshot.rows.forEach((row, index) => {
    if (index > 0) {
      ui.terminal.append(document.createTextNode("\n"));
    }
    if (index !== cursorRow) {
      ui.terminal.append(document.createTextNode(row));
      return;
    }
    const col = Math.max(0, Math.min(cursorCol, row.length));
    ui.terminal.append(document.createTextNode(row.slice(0, col)));
    const cursor = document.createElement("span");
    cursor.className = "terminal-cursor";
    cursor.textContent = row[col] || " ";
    ui.terminal.append(cursor);
    ui.terminal.append(document.createTextNode(row.slice(col + 1)));
  });
  ui.terminalMeta.textContent = `${snapshot.width || 0} x ${snapshot.height || 0}`;
  ui.cursorPos.textContent = `${snapshot.cursor_row || 0},${snapshot.cursor_col || 0}`;
  ui.terminal.scrollTop = ui.terminal.scrollHeight;
}

function appendRaw(data) {
  state.scrollback += data.replace(/\r/g, "");
  if (state.scrollback.length > 24000) {
    state.scrollback = state.scrollback.slice(-24000);
  }
  ui.scrollback.textContent = state.scrollback;
  ui.scrollback.scrollTop = ui.scrollback.scrollHeight;
  state.rawText += data.replace(/\r/g, "");
  if (state.rawText.length > 12000) {
    state.rawText = state.rawText.slice(-12000);
  }
  if (!ui.terminal.textContent) {
    ui.terminal.textContent = state.rawText;
  }
  ui.terminal.scrollTop = ui.terminal.scrollHeight;
}

function clearTerminal() {
  state.rawText = "";
  state.scrollback = "";
  state.outputBytes = 0;
  ui.terminal.textContent = "";
  ui.scrollback.textContent = "";
  ui.outputCount.textContent = "0 byte";
}

function disconnectSocket() {
  if (state.ws) {
    state.ws.close();
  }
  state.ws = null;
  state.connected = false;
  setBadge(ui.socketState, "chiuso", "muted");
}

function setSessionState(value, closed) {
  const text = closed ? "closed" : value || "idle";
  const tone = closed ? "muted" : text === "running" ? "warn" : text === "error" ? "error" : "ok";
  setBadge(ui.sessionState, text, tone);
  ui.terminalTitle.textContent = currentSessionID() ? `A: ${shortID(currentSessionID())}` : "A:";
}

function setBadge(element, text, tone) {
  element.textContent = text;
  element.className = `badge badge-${tone}`;
}

function logEvent(text) {
  const row = document.createElement("div");
  row.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  ui.log.append(row);
  while (ui.log.children.length > 80) {
    ui.log.firstChild.remove();
  }
  ui.log.scrollTop = ui.log.scrollHeight;
}

function renderSessionList(sessions) {
  ui.sessionList.textContent = "";
  if (sessions.length === 0) {
    ui.sessionList.textContent = "-";
    return;
  }
  for (const session of sessions) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "mini-list-row";
    row.innerHTML = `<span>${escapeHTML(shortID(session.id))}</span><span>${escapeHTML(session.state || "idle")}</span>`;
    row.addEventListener("click", () => {
      ui.sessionID.value = session.id;
      state.sessionID = session.id;
      disconnectSocket();
      openSocket(session.id);
      refreshFiles();
    });
    ui.sessionList.append(row);
  }
}

function renderFiles(files) {
  ui.fileList.textContent = "";
  ui.fileCount.textContent = String(files.length);
  if (files.length === 0) {
    ui.fileList.textContent = "-";
    return;
  }
  for (const file of files) {
    const row = document.createElement("div");
    row.className = "mini-list-row";
    const name = file.name || "";
    row.innerHTML = `<span>${escapeHTML(name)}</span><span>${formatBytes(file.size || 0)}</span>`;
    row.addEventListener("dblclick", () => {
      if (name.toUpperCase().endsWith(".COM")) {
        ui.commandLine.value = `RUN ${name.replace(/\.COM$/i, "")}`;
        sendCommandLine();
      }
    });
    ui.fileList.append(row);
  }
}

function formatBytes(value) {
  return `${value} B`;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function currentSessionID() {
  return state.sessionID || ui.sessionID.value.trim();
}

function shortID(id) {
  return id ? id.slice(0, 8) : "-";
}
