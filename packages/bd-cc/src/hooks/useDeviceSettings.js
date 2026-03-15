"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDeviceSettings = useDeviceSettings;
var react_1 = require("react");
var getIsMobile = function (mobileBreakpoint) {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.innerWidth < mobileBreakpoint;
};
var getIsPWA = function () {
    if (typeof window === 'undefined') {
        return false;
    }
    var navigatorWithStandalone = window.navigator;
    return (window.matchMedia('(display-mode: standalone)').matches ||
        Boolean(navigatorWithStandalone.standalone) ||
        document.referrer.includes('android-app://'));
};
function useDeviceSettings(options) {
    if (options === void 0) { options = {}; }
    var _a = options.mobileBreakpoint, mobileBreakpoint = _a === void 0 ? 768 : _a, _b = options.trackMobile, trackMobile = _b === void 0 ? true : _b, _c = options.trackPWA, trackPWA = _c === void 0 ? true : _c;
    var _d = (0, react_1.useState)(function () { return (trackMobile ? getIsMobile(mobileBreakpoint) : false); }), isMobile = _d[0], setIsMobile = _d[1];
    var _e = (0, react_1.useState)(function () { return (trackPWA ? getIsPWA() : false); }), isPWA = _e[0], setIsPWA = _e[1];
    (0, react_1.useEffect)(function () {
        if (!trackMobile || typeof window === 'undefined') {
            return;
        }
        var checkMobile = function () {
            setIsMobile(getIsMobile(mobileBreakpoint));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return function () {
            window.removeEventListener('resize', checkMobile);
        };
    }, [mobileBreakpoint, trackMobile]);
    (0, react_1.useEffect)(function () {
        if (!trackPWA || typeof window === 'undefined') {
            return;
        }
        var mediaQuery = window.matchMedia('(display-mode: standalone)');
        var checkPWA = function () {
            setIsPWA(getIsPWA());
        };
        checkPWA();
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', checkPWA);
            return function () {
                mediaQuery.removeEventListener('change', checkPWA);
            };
        }
        mediaQuery.addListener(checkPWA);
        return function () {
            mediaQuery.removeListener(checkPWA);
        };
    }, [trackPWA]);
    return { isMobile: isMobile, isPWA: isPWA };
}
