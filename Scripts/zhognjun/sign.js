/**
 * 中骏小程序签到脚本
 * 
 * 更新时间: 2025-09-26 15:21
 * 脚本兼容: QuantumultX、Loon、Surge
 * 使用 Peng-YM OpenAPI 实现跨平台兼容
 * 使用 BoxJs 管理隐私数据
 * https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI
 * 
 * 功能说明：
 * - 自动完成中骏小程序每日签到
 * - 自动捕获并保存token、customerId和shopCode
 * - 通过BoxJs管理隐私数据
 */

// 初始化 OpenAPI，启用BoxJs支持 - debug模式为true以启用详细日志输出
const $ = new API("ZhongJunSign", true);

// 配置信息
const API_HOST = "api.sce-icm.com";
const TOKEN_KEY = "token";
const url = `https://${API_HOST}/api/v1/dig-mall/customer/sign/signNow`;

// 获取当前时间戳
function getCurrentTimestamp() {
    const timestamp = Date.now().toString();
    $.log(`生成时间戳: ${timestamp}`);
    return timestamp;
}

// 获取x-http-token
async function getXHttpToken() {
    $.log("开始获取x-http-token");
    
    // 从 BoxJs 读取token
    let token = $.read(TOKEN_KEY);
    
    if (token) {
        $.log("从 BoxJs 获取到token");
        return token;
    }
    
    // 如果本地没有，提示用户配置
    $.error("BoxJs 中未找到token，请先配置");
    $.notify('中骏小程序', '配置错误', '请在 BoxJs 中添加 token 配置');
    throw new Error("未配置token");
}

// 执行签到流程
async function signIn() {
    try {
        $.log("开始执行签到流程");
        
        // 从 BoxJs 读取配置
        const customerId = $.read("customerId");
        const shopCode = $.read("shopCode");
        
        // 检查必要的配置是否存在
        if (!customerId || !shopCode) {
            $.notify('中骏小程序', '配置错误', '请在 BoxJs 中填写完整的 customerId 和 shopCode');
            $.error("配置不完整：缺少 customerId 或 shopCode");
            return;
        }
        
        // 获取token
        $.log("步骤1: 获取token");
        const token = await getXHttpToken();
        
        // 构建请求头和请求体
        const headers = {
            'Referer': 'https://servicewechat.com/wxb1a677503052e19d/206/page-frame.html',
            'app-id': 'wxb1a677503052e19d',
            'x-http-devicetype': 'WechatMiniProgram',
            'x-http-timestamp': getCurrentTimestamp(),
            'x-http-channel': '5',
            'Host': API_HOST,
            'Connection': 'keep-alive',
            'x-http-version': '1.3.108',
            'client-name': 'mini-program',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62(0x18003e36) NetType/WIFI Language/zh_CN',
            'content-type': 'application/json',
            'Accept-Encoding': 'gzip,compress,br,deflate',
            'x-http-token': token
        };
        
        const body = JSON.stringify({
            "customerId": customerId,
            "shopCode": shopCode
        });
        
        // 构建请求参数
        const options = {
            url: url,
            headers: headers,
            body: body
        };
        
        // 执行签到请求
        $.log("步骤3: 执行签到请求");
        const response = await $.post(options);
        
        if (response && response.body) {
            $.log(`签到请求成功，状态码: ${response.statusCode}`);
            const res = JSON.parse(response.body);
            
            if (res.code === 200) {
                if (res.data.isSuccess) {
                    let message = `+${res.data.signDailyPoint}，下次签到奖励：${res.data.nextAwardCount}，共签到：${res.data.totalSignCount}天`;
                    $.log(`签到成功: ${message}`);
                    $.notify('中骏小程序', '签到成功', message);
                } else {
                    const failReason = res.data.failReason || '签到未成功';
                    $.error(`签到未成功: ${failReason}`);
                    $.notify('中骏小程序', '签到未成功', failReason);
                }
            } else {
                const errorMsg = res.message || '未知错误';
                $.error(`签到失败: ${errorMsg}`);
                $.notify('中骏小程序', '签到失败', `错误：${errorMsg}`);
            }
        } else {
            throw new Error('响应体为空');
        }
    } catch (error) {
        $.error(`执行签到流程出错: ${error.message || error}`);
        $.notify('中骏小程序', '签到失败', `签到流程执行失败: ${error.message || '未知错误'}`);
    } finally {
        $.done();
    }
}

// 参数获取函数 - 简化版，自动捕获并保存token、customerId和shopCode
function GetParameter() {
    try {
        $.log("[中骏] 进入参数获取模式");
        let tokenFound = false;
        let customerIdFound = false;
        let shopCodeFound = false;
        
        // 1. 从请求头中获取token
        if (typeof $request !== 'undefined' && $request.headers && $request.headers['x-http-token']) {
            const token = $request.headers['x-http-token'];
            if (token && $.read(TOKEN_KEY) !== token) {
                $.write(token, TOKEN_KEY);
                $.log(`[中骏] 成功保存token: ${token.substring(0, 10)}...`);
                try { $.notify('中骏小程序', '参数更新', '成功保存token'); } catch (e) {}
                tokenFound = true;
            }
        }
        
        // 2. 从请求体中获取customerId和shopCode
        if (typeof $request !== 'undefined' && $request.body) {
            try {
                const body = JSON.parse($request.body);
                
                // 检查并保存customerId
                if (body.customerId && $.read("customerId") !== body.customerId) {
                    $.write(body.customerId, "customerId");
                    $.log(`[中骏] 成功保存customerId: ${body.customerId}`);
                    try { $.notify('中骏小程序', '参数更新', `成功保存customerId: ${body.customerId}`); } catch (e) {}
                    customerIdFound = true;
                }
                
                // 检查并保存shopCode
                if (body.shopCode && $.read("shopCode") !== body.shopCode) {
                    $.write(body.shopCode, "shopCode");
                    $.log(`[中骏] 成功保存shopCode: ${body.shopCode}`);
                    try { $.notify('中骏小程序', '参数更新', `成功保存shopCode: ${body.shopCode}`); } catch (e) {}
                    shopCodeFound = true;
                }
                
                // 检查并保存token（从请求体）
                if (!tokenFound && body.token && $.read(TOKEN_KEY) !== body.token) {
                    $.write(body.token, TOKEN_KEY);
                    $.log(`[中骏] 从请求体成功保存token: ${body.token.substring(0, 10)}...`);
                    try { $.notify('中骏小程序', '参数更新', '成功保存token'); } catch (e) {}
                    tokenFound = true;
                }
            } catch (e) {
                $.error(`[中骏] 解析请求体失败: ${e}`);
            }
        }
        
        // 3. 从用户信息接口响应中获取数据
        if (!tokenFound && !customerIdFound && !shopCodeFound && typeof $response !== 'undefined' && $response && $response.body) {
            try {
                const resBody = JSON.parse($response.body);
                if (resBody && resBody.data) {
                    // 尝试从用户信息中提取数据
                    if (resBody.data.token && $.read(TOKEN_KEY) !== resBody.data.token) {
                        $.write(resBody.data.token, TOKEN_KEY);
                        $.log(`[中骏] 从响应体成功保存token: ${resBody.data.token.substring(0, 10)}...`);
                        try { $.notify('中骏小程序', '参数更新', '成功保存token'); } catch (e) {}
                        tokenFound = true;
                    }
                    
                    if (resBody.data.customerId && $.read("customerId") !== resBody.data.customerId) {
                        $.write(resBody.data.customerId, "customerId");
                        $.log(`[中骏] 从响应体成功保存customerId: ${resBody.data.customerId}`);
                        try { $.notify('中骏小程序', '参数更新', `成功保存customerId: ${resBody.data.customerId}`); } catch (e) {}
                        customerIdFound = true;
                    }
                    
                    if (resBody.data.shopCode && $.read("shopCode") !== resBody.data.shopCode) {
                        $.write(resBody.data.shopCode, "shopCode");
                        $.log(`[中骏] 从响应体成功保存shopCode: ${resBody.data.shopCode}`);
                        try { $.notify('中骏小程序', '参数更新', `成功保存shopCode: ${resBody.data.shopCode}`); } catch (e) {}
                        shopCodeFound = true;
                    }
                }
            } catch (e) {
                $.error(`[中骏] 解析响应体失败: ${e}`);
            }
        }
        
        // 简化的参数获取总结
        if (tokenFound || customerIdFound || shopCodeFound) {
            $.log(`[中骏] 参数获取成功，token${tokenFound ? '已更新' : '未变化'}，customerId${customerIdFound ? '已更新' : '未变化'}，shopCode${shopCodeFound ? '已更新' : '未变化'}`);
        } else {
            $.log("[中骏] 未找到需要更新的参数");
        }
    } catch (error) {
        $.error(`[中骏] 参数获取出错: ${error}`);
        try {
            $.notify('中骏小程序', '参数获取失败', `错误: ${error.message || error}`);
        } catch (e) {}
    } finally {
        // 确保在脚本结束时调用$.done()
        try {
            if (typeof $done !== 'undefined') {
                $done();
            }
        } catch (e) {}
    }
}

// 根据环境决定是执行签到还是获取参数
// 增强环境检测日志，便于调试
$.log(`环境检测: 当前环境状态日志开始`);
$.log(`环境检测: $request存在=${typeof $request !== 'undefined'}`);
$.log(`环境检测: $response存在=${typeof $response !== 'undefined'}`);
$.log(`环境检测: $loon存在=${typeof $loon !== 'undefined'} (Loon环境)`);
$.log(`环境检测: $task存在=${typeof $task !== 'undefined'} (QuantumultX环境)`);
$.log(`环境检测: $httpClient存在=${typeof $httpClient !== 'undefined'} (Surge环境)`);
$.log(`环境检测: $done存在=${typeof $done !== 'undefined'}`);

// 先直接执行签到功能
$.log("脚本开始执行，直接运行签到功能");
signIn();

// 检查是否是请求事件并且请求体中含有必要参数，如果是则执行获取参数方法
function hasRequiredParamsInRequestBody() {
    try {
        if (typeof $request !== 'undefined' && $request.body) {
            const body = JSON.parse($request.body);
            return body.token || body.customerId || body.shopCode;
        }
        return false;
    } catch (e) {
        $.error(`解析请求体失败: ${e}`);
        return false;
    }
}

// 如果是请求事件且请求体中含有必要参数，执行参数获取方法
if (typeof $request !== 'undefined' && hasRequiredParamsInRequestBody()) {
    $.log("环境检测: 检测到请求事件且请求体包含必要参数，执行参数获取功能");
    GetParameter();
}

$.log(`环境检测: 当前环境状态日志结束`);

// OpenAPI 核心代码 - Peng-YM 压缩版
function ENV() { const e = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: "undefined" != typeof $task, isLoon: "undefined" != typeof $loon, isSurge: "undefined" != typeof $httpClient && "undefined" != typeof $utils, isBrowser: "undefined" != typeof document, isNode: "function" == typeof require && !e, isJSBox: e, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: o, isScriptable: n, isNode: i, isBrowser: r } = ENV(), u = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/; const a = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(h => a[h.toLowerCase()] = (a => (function (a, h) { h = "string" == typeof h ? { url: h } : h; const d = e.baseURL; d && !u.test(h.url || "") && (h.url = d ? d + h.url : h.url), h.body && h.headers && !h.headers["Content-Type"] && (h.headers["Content-Type"] = "application/x-www-form-urlencoded"); const l = (h = { ...e, ...h }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...h.events }; let f, p; if (c.onRequest(a, h), t) f = $task.fetch({ method: a, ...h }); else if (s || o || i) f = new Promise((e, t) => { (i ? require("request") : $httpClient)[a.toLowerCase()](h, (s, o, n) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: n }) }) }); else if (n) { const e = new Request(h.url); e.method = a, e.headers = h.headers, e.body = h.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } else r && (f = new Promise((e, t) => { fetch(h.url, { method: a, headers: h.headers, body: h.body }).then(e => e.json()).then(t => e({ statusCode: t.status, headers: t.headers, body: t.data })).catch(t) })); const y = l ? new Promise((e, t) => { p = setTimeout(() => (c.onTimeout(), t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)), l) }) : null; return (y ? Promise.race([y, f]).then(e => (clearTimeout(p), e)) : f).then(e => c.onResponse(e)) })(h, a))), a } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: o, isSurge: n, isNode: i, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (i) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (o || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), i) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (o || n) && $persistentStore.write(e, this.name), i && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || o) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); i && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || o ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : i ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || o) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); i && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", a = "", h = {}) { const d = h["open-url"], l = h["media-url"]; if (s && $notify(e, t, a, h), n && $notification.post(e, t, a + `${l ? "\n多媒体:" + l : ""}`, { url: d }), o) { let s = {}; d && (s.openUrl = d), l && (s.mediaUrl = l), "{}" === JSON.stringify(s) ? $notification.post(e, t, a) : $notification.post(e, t, a, s) } if (i || u) { const s = a + (d ? `\n点击跳转: ${d}` : "") + (l ? `\n多媒体: ${l}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || o || n ? $done(e) : i && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
