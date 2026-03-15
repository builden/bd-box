"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionProtection = useSessionProtection;
var react_1 = require("react");
function useSessionProtection() {
    var _a = (0, react_1.useState)(new Set()), activeSessions = _a[0], setActiveSessions = _a[1];
    var _b = (0, react_1.useState)(new Set()), processingSessions = _b[0], setProcessingSessions = _b[1];
    var markSessionAsActive = (0, react_1.useCallback)(function (sessionId) {
        if (!sessionId) {
            return;
        }
        setActiveSessions(function (prev) { return new Set(__spreadArray(__spreadArray([], prev, true), [sessionId], false)); });
    }, []);
    var markSessionAsInactive = (0, react_1.useCallback)(function (sessionId) {
        if (!sessionId) {
            return;
        }
        setActiveSessions(function (prev) {
            var next = new Set(prev);
            next.delete(sessionId);
            return next;
        });
    }, []);
    var markSessionAsProcessing = (0, react_1.useCallback)(function (sessionId) {
        if (!sessionId) {
            return;
        }
        setProcessingSessions(function (prev) { return new Set(__spreadArray(__spreadArray([], prev, true), [sessionId], false)); });
    }, []);
    var markSessionAsNotProcessing = (0, react_1.useCallback)(function (sessionId) {
        if (!sessionId) {
            return;
        }
        setProcessingSessions(function (prev) {
            var next = new Set(prev);
            next.delete(sessionId);
            return next;
        });
    }, []);
    var replaceTemporarySession = (0, react_1.useCallback)(function (realSessionId) {
        if (!realSessionId) {
            return;
        }
        setActiveSessions(function (prev) {
            var next = new Set();
            for (var _i = 0, prev_1 = prev; _i < prev_1.length; _i++) {
                var sessionId = prev_1[_i];
                if (!sessionId.startsWith('new-session-')) {
                    next.add(sessionId);
                }
            }
            next.add(realSessionId);
            return next;
        });
    }, []);
    return {
        activeSessions: activeSessions,
        processingSessions: processingSessions,
        markSessionAsActive: markSessionAsActive,
        markSessionAsInactive: markSessionAsInactive,
        markSessionAsProcessing: markSessionAsProcessing,
        markSessionAsNotProcessing: markSessionAsNotProcessing,
        replaceTemporarySession: replaceTemporarySession,
    };
}
