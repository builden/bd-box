"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AppContent;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var react_i18next_1 = require("react-i18next");
var lucide_react_1 = require("lucide-react");
var Sidebar_1 = require("@/features/projects/ui/pages/Sidebar");
var MainContent_1 = require("../main-content/view/MainContent");
var WebSocketContext_1 = require("../../contexts/WebSocketContext");
var useDeviceSettings_1 = require("../../hooks/useDeviceSettings");
var useSessionProtection_1 = require("../../hooks/useSessionProtection");
var MobileNav_1 = require("./MobileNav");
var store_1 = require("@/store");
function AppContent() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_router_dom_1.useParams)(); // Keep for router compatibility
    var t = (0, react_i18next_1.useTranslation)('common').t;
    var isMobile = (0, useDeviceSettings_1.useDeviceSettings)({ trackPWA: false }).isMobile;
    var _a = (0, WebSocketContext_1.useWebSocket)(), ws = _a.ws, sendMessage = _a.sendMessage, latestMessage = _a.latestMessage, isConnected = _a.isConnected;
    var wasConnectedRef = (0, react_1.useRef)(false);
    var _b = (0, useSessionProtection_1.useSessionProtection)(), processingSessions = _b.processingSessions, markSessionAsActive = _b.markSessionAsActive, markSessionAsInactive = _b.markSessionAsInactive, markSessionAsProcessing = _b.markSessionAsProcessing, markSessionAsNotProcessing = _b.markSessionAsNotProcessing, replaceTemporarySession = _b.replaceTemporarySession;
    var _c = (0, store_1.useProjects)(), selectedProject = _c.selectedProject, selectedSession = _c.selectedSession, activeTab = _c.activeTab, sidebarOpen = _c.sidebarOpen, isLoadingProjects = _c.isLoadingProjects, projectsError = _c.projectsError, isInputFocused = _c.isInputFocused, externalMessageUpdate = _c.externalMessageUpdate, showSettings = _c.showSettings, settingsInitialTab = _c.settingsInitialTab, setActiveTab = _c.setActiveTab, setSidebarOpen = _c.setSidebarOpen, setIsInputFocused = _c.setIsInputFocused, setShowSettings = _c.setShowSettings, openSettings = _c.openSettings, refreshProjectsSilently = _c.refreshProjectsSilently, projects = _c.projects, loadingProgress = _c.loadingProgress, onRefresh = _c.onRefresh, onProjectSelect = _c.onProjectSelect, onSessionSelect = _c.onSessionSelect, onNewSession = _c.onNewSession, onSessionDelete = _c.onSessionDelete, onProjectDelete = _c.onProjectDelete, onCloseSettings = _c.onCloseSettings;
    // 构建 sidebarSharedProps 兼容旧接口
    var sidebarSharedProps = {
        projects: projects,
        selectedProject: selectedProject,
        selectedSession: selectedSession,
        onProjectSelect: onProjectSelect,
        onSessionSelect: onSessionSelect,
        onNewSession: onNewSession,
        onSessionDelete: onSessionDelete,
        onProjectDelete: onProjectDelete,
        isLoading: isLoadingProjects,
        loadingProgress: loadingProgress,
        onRefresh: onRefresh,
        onShowSettings: openSettings,
        showSettings: showSettings,
        settingsInitialTab: settingsInitialTab,
        onCloseSettings: onCloseSettings,
        isMobile: isMobile,
    };
    (0, react_1.useEffect)(function () {
        // Expose a non-blocking refresh for chat/session flows.
        // Full loading refreshes are still available through direct fetchProjects calls.
        window.refreshProjects = refreshProjectsSilently;
        return function () {
            if (window.refreshProjects === refreshProjectsSilently) {
                delete window.refreshProjects;
            }
        };
    }, [refreshProjectsSilently]);
    (0, react_1.useEffect)(function () {
        window.openSettings = openSettings;
        return function () {
            if (window.openSettings === openSettings) {
                delete window.openSettings;
            }
        };
    }, [openSettings]);
    // Permission recovery: query pending permissions on WebSocket reconnect or session change
    (0, react_1.useEffect)(function () {
        var isReconnect = isConnected && !wasConnectedRef.current;
        if (isReconnect) {
            wasConnectedRef.current = true;
        }
        else if (!isConnected) {
            wasConnectedRef.current = false;
        }
        if (isConnected && (selectedSession === null || selectedSession === void 0 ? void 0 : selectedSession.id)) {
            sendMessage({
                type: 'get-pending-permissions',
                sessionId: selectedSession.id,
            });
        }
    }, [isConnected, selectedSession === null || selectedSession === void 0 ? void 0 : selectedSession.id, sendMessage]);
    return (<div className={"fixed inset-0 flex bg-background ".concat(projectsError ? 'pt-10' : '')}>
      {/* Error Banner */}
      {projectsError && (<div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          <div className="flex items-center gap-2">
            <lucide_react_1.AlertTriangle className="h-4 w-4"/>
            <span>Failed to load projects: {projectsError.message}</span>
          </div>
          <button onClick={function () { return refreshProjectsSilently(); }} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-red-100 dark:hover:bg-red-800/50">
            <lucide_react_1.RefreshCw className="h-3 w-3"/>
            Retry
          </button>
        </div>)}

      {!isMobile ? (<div className="h-full flex-shrink-0 border-r border-border/50">
          <Sidebar_1.default {...sidebarSharedProps}/>
        </div>) : (<div className={"fixed inset-0 z-50 flex transition-all duration-150 ease-out ".concat(sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0')}>
          <button className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-150 ease-out" onClick={function (event) {
                event.stopPropagation();
                setSidebarOpen(false);
            }} onTouchStart={function (event) {
                event.preventDefault();
                event.stopPropagation();
                setSidebarOpen(false);
            }} aria-label={t('versionUpdate.ariaLabels.closeSidebar')}/>
          <div className={"relative h-full w-[85vw] max-w-sm transform border-r border-border/40 bg-card transition-transform duration-150 ease-out sm:w-80 ".concat(sidebarOpen ? 'translate-x-0' : '-translate-x-full')} onClick={function (event) { return event.stopPropagation(); }} onTouchStart={function (event) { return event.stopPropagation(); }}>
            <Sidebar_1.default {...sidebarSharedProps}/>
          </div>
        </div>)}

      <div className={"flex min-w-0 flex-1 flex-col ".concat(isMobile ? 'pb-mobile-nav' : '')}>
        <MainContent_1.default selectedProject={selectedProject} selectedSession={selectedSession} activeTab={activeTab} setActiveTab={setActiveTab} ws={ws} sendMessage={sendMessage} latestMessage={latestMessage} isMobile={isMobile} onMenuClick={function () { return setSidebarOpen(true); }} isLoading={isLoadingProjects} onInputFocusChange={setIsInputFocused} onSessionActive={markSessionAsActive} onSessionInactive={markSessionAsInactive} onSessionProcessing={markSessionAsProcessing} onSessionNotProcessing={markSessionAsNotProcessing} processingSessions={processingSessions} onReplaceTemporarySession={replaceTemporarySession} onNavigateToSession={function (targetSessionId) { return navigate("/session/".concat(targetSessionId)); }} onShowSettings={function () { return setShowSettings(true); }} externalMessageUpdate={externalMessageUpdate}/>
      </div>

      {isMobile && <MobileNav_1.default activeTab={activeTab} setActiveTab={setActiveTab} isInputFocused={isInputFocused}/>}
    </div>);
}
