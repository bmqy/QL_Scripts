
/**
 * 喜隆多小程序签到脚本
 * 
 * 更新时间: 2025-09-26 15:10
 * 脚本兼容: QuantumultX、Loon、Surge
 * 使用 Peng-YM OpenAPI 实现跨平台兼容
 * 使用 BoxJs 管理隐私数据
 * https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI
 * 
 * 功能说明：
 * - 自动完成喜隆多小程序每日签到
 * - 自动捕获并保存token和mallID
 * - 通过BoxJs管理隐私数据
 */

// 初始化 OpenAPI，启用BoxJs支持 - debug模式为true以启用详细日志输出
const $ = new API("XiLongDuo", true);

// 执行签到
async function signIn() {
    try {
        // 从 BoxJs 读取配置
        const token = $.read("token");
        const mallID = $.read("mallID");
        
        // 检查配置
        if (!token) {
            $.notify("喜隆多小程序", "配置错误", "请在 BoxJs 中添加 token 配置");
            $.error("未找到 token 配置");
            return;        }
        
        const url = "https://m.mallcoo.cn/api/user/User/CheckinV2";
        
        // 构建请求头
        const headers = {
            'Accept-Encoding': 'gzip,compress,br,deflate',
            'content-type': 'application/json',
            'Connection': 'keep-alive',
            'Referer': 'https://servicewechat.com/wx128a2b5acbdc754a/102/page-frame.html',
            'Host': 'm.mallcoo.cn',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63(0x18003c32) NetType/WIFI Language/zh_CN'
        };
        
        // 获取保存的systemInfo，如果没有则使用默认值
        let systemInfo = {
            "model": "iPhone 13 Pro<iPhone14,2>",
            "SDKVersion": "3.10.1",
            "system": "iOS 17.0",
            "version": "8.0.63",
            "miniVersion": "2.71.0.aipj1"
        };
        
        const savedSystemInfo = $.read("systemInfo");
        if (savedSystemInfo) {
            try {
                const parsedSystemInfo = JSON.parse(savedSystemInfo);
                // 确保解析后的对象有效
                if (typeof parsedSystemInfo === 'object' && parsedSystemInfo !== null) {
                    systemInfo = parsedSystemInfo;
                    $.log(`使用保存的systemInfo: ${JSON.stringify(systemInfo)}`);
                }
            } catch (e) {
                $.error(`解析保存的systemInfo失败: ${e}`);
            }
        }
        
        // 构建请求体
        const body = JSON.stringify({
            "MallID": parseInt(mallID),
            "Header": {
                "Token": token,
                "systemInfo": systemInfo
            }
        });
        
        // 构建请求参数
        const options = {
            url: url,
            headers: headers,
            body: body
        };
        
        $.log("开始发送签到请求");
        const response = await $.http.post(options);
        
        if (response && response.body) {
            $.log(`签到请求成功，状态码: ${response.statusCode}`);
            const res = JSON.parse(response.body);
            
            if (res.m === 1) {
                const message = `${res.d.Content || ''}，${res.d.Msg || ''}`.trim();
                $.log(`签到成功: ${message}`);
                $.notify('喜隆多小程序', '签到成功', message);
            } else {
                const errorMsg = res.e || '未知错误';
                $.error(`签到失败: ${errorMsg}`);
                $.notify('喜隆多小程序', '签到失败', `错误: ${errorMsg}`);
            }
        } else {
            throw new Error('响应体为空');
        }
    } catch (error) {
        $.error(`签到过程中出错: ${error.message || error}`);
        $.notify('喜隆多小程序', '签到失败', `网络错误: ${error.message || '未知错误'}`);
    } finally {
        $.done();
    }
    }

// 参数获取函数 - 简化版，自动捕获并保存token和mallID
function GetParameter() {
    try {
        $.log("[喜隆多] 进入参数获取模式");
        let tokenFound = false;
        let mallIDFound = false;
        let tokenUpdated = false;
        let mallIDUpdated = false;
        
        // 1. 从请求体中获取token和mallID
        if (typeof $request !== 'undefined' && $request.body) {
            try {
                const body = JSON.parse($request.body);
                $.log(`[喜隆多] 请求体内容: ${JSON.stringify(body).substring(0, 200)}...`);
                
                // 保存token
                if (body.Header && body.Header.Token) {
                    tokenFound = true;
                    const currentToken = $.read("token");
                    if (currentToken !== body.Header.Token) {
                        $.write(body.Header.Token, "token");
                        $.log(`[喜隆多] 成功更新token: ${body.Header.Token.substring(0, 10)}...`);
                        tokenUpdated = true;
                    } else {
                        $.log(`[喜隆多] token已存在且未变化: ${body.Header.Token.substring(0, 10)}...`);
                    }
                }
                
                // 保存mallID
                let mallIdValue = body.MallID || body.MallId;
                if (mallIdValue !== undefined) {
                    mallIDFound = true;
                    const currentMallID = $.read("mallID");
                    if (currentMallID !== mallIdValue.toString()) {
                        $.write(mallIdValue.toString(), "mallID");
                        $.log(`[喜隆多] 成功更新mallID: ${mallIdValue}`);
                        mallIDUpdated = true;
                    } else {
                        $.log(`[喜隆多] mallID已存在且未变化: ${mallIdValue}`);
                    }
                }
                
                // 保存systemInfo
                if (body.Header && body.Header.systemInfo) {
                    $.write(JSON.stringify(body.Header.systemInfo), "systemInfo");
                    $.log("[喜隆多] 成功保存systemInfo");
                }
            } catch (e) {
                $.error(`[喜隆多] 解析请求体失败: ${e}`);
            }
        }
        
        // 2. 从请求头中获取token（备用路径）
        if (!tokenFound && typeof $request !== 'undefined' && $request.headers) {
            const headers = $request.headers;
            let token = null;
            
            // 检查常见的token头
            if (headers.Authorization) {
                token = headers.Authorization.replace(/^Bearer\s+/i, '');
            } else if (headers.token) {
                token = headers.token;
            }
            
            if (token) {
                tokenFound = true;
                if ($.read("token") !== token) {
                    $.write(token, "token");
                    $.log(`[喜隆多] 从请求头成功更新token: ${token.substring(0, 10)}...`);
                    tokenUpdated = true;
                } else {
                    $.log(`[喜隆多] 从请求头读取token，但已存在且未变化`);
                }
            }
        }
        
        // 3. 从响应体中获取数据（备用路径）
        if (!tokenFound && !mallIDFound && typeof $response !== 'undefined' && $response && $response.body) {
            try {
                const resBody = JSON.parse($response.body);
                
                // 检查token
                let token = null;
                if (resBody.Header && resBody.Header.Token) {
                    token = resBody.Header.Token;
                } else {
                    // 检查其他可能的token字段
                    const possibleTokenFields = ['token', 'Token', 'access_token', 'AccessToken'];
                    for (const field of possibleTokenFields) {
                        if (resBody[field]) {
                            token = resBody[field];
                            break;
                        }
                    }
                }
                
                if (token) {
                    tokenFound = true;
                    if ($.read("token") !== token) {
                        $.write(token, "token");
                        $.log(`[喜隆多] 从响应体成功更新token: ${token.substring(0, 10)}...`);
                        tokenUpdated = true;
                    } else {
                        $.log(`[喜隆多] 从响应体读取token，但已存在且未变化`);
                    }
                }
                
                // 检查mallID
                if (resBody.MallID) {
                    mallIDFound = true;
                    if ($.read("mallID") !== resBody.MallID.toString()) {
                        $.write(resBody.MallID.toString(), "mallID");
                        $.log(`[喜隆多] 从响应体成功更新mallID: ${resBody.MallID}`);
                        mallIDUpdated = true;
                    } else {
                        $.log(`[喜隆多] 从响应体读取mallID，但已存在且未变化`);
                    }
                }
            } catch (e) {
                $.error(`[喜隆多] 解析响应体失败: ${e}`);
            }
        }
        
        // 简化的参数获取总结
        const existingToken = $.read("token");
        const existingMallID = $.read("mallID");
        
        // 判断是否找到参数
        if (tokenFound || mallIDFound) {
            let message = '';
            if (tokenFound && mallIDFound) {
                message = `Token和MallID均已获取${tokenUpdated || mallIDUpdated ? '并更新' : ''}`;
            } else if (tokenFound) {
                message = `Token已获取${tokenUpdated ? '并更新' : ''}`;
            } else if (mallIDFound) {
                message = `MallID已获取${mallIDUpdated ? '并更新' : ''}`;
            }
            
            $.log(`[喜隆多] ${message}`);
            $.log(`[喜隆多] 当前保存的token: ${existingToken ? existingToken.substring(0, 10) + '...' : '无'}`);
            $.log(`[喜隆多] 当前保存的mallID: ${existingMallID || '无'}`);
            
            // 发送通知
            if (tokenUpdated || mallIDUpdated) {
                try { 
                    $.notify('喜隆多小程序', '参数获取成功', message); 
                } catch (e) {
                    $.error(`[喜隆多] 发送通知失败: ${e}`);
                }
            }
        } else {
            $.log("[喜隆多] 未找到需要更新的参数");
            $.log("[喜隆多] 请确保在正确的接口上执行参数获取");
        }
    } catch (error) {
        $.error(`[喜隆多] 参数获取出错: ${error}`);
        try {
            $.notify('喜隆多小程序', '参数获取失败', `错误: ${error.message || error}`);
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

// 检查是否是请求事件并且请求体中含有token和mallID
function hasTokenAndMallIDInRequestBody() {
    try {
        if (typeof $request !== 'undefined' && $request.body) {
            const body = JSON.parse($request.body);
            return body.Header && body.Header.Token && (body.MallID || body.MallId);
        }
        return false;
    } catch (e) {
        $.error(`解析请求体失败: ${e}`);
        return false;
    }
}

// 判断运行模式：如果是请求事件且请求体中含有token和mallID，执行参数获取方法；否则执行签到
if (typeof $request !== 'undefined' && hasTokenAndMallIDInRequestBody()) {
    $.log("环境检测: 检测到请求事件且请求体包含token和mallID，执行参数获取功能");
    GetParameter();
} else {
    $.log("脚本开始执行，运行签到功能");
    signIn();
}

$.log(`环境检测: 当前环境状态日志结束`);

// OpenAPI 核心代码 - Peng-YM 压缩版
function ENV() { const e = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: "undefined" != typeof $task, isLoon: "undefined" != typeof $loon, isSurge: "undefined" != typeof $httpClient && "undefined" != typeof $utils, isBrowser: "undefined" != typeof document, isNode: "function" == typeof require && !e, isJSBox: e, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: o, isScriptable: n, isNode: i, isBrowser: r } = ENV(), u = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/; const a = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(h => a[h.toLowerCase()] = (a => (function (a, h) { h = "string" == typeof h ? { url: h } : h; const d = e.baseURL; d && !u.test(h.url || "") && (h.url = d ? d + h.url : h.url), h.body && h.headers && !h.headers["Content-Type"] && (h.headers["Content-Type"] = "application/x-www-form-urlencoded"); const l = (h = { ...e, ...h }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...h.events }; let f, p; if (c.onRequest(a, h), t) f = $task.fetch({ method: a, ...h }); else if (s || o || i) f = new Promise((e, t) => { (i ? require("request") : $httpClient)[a.toLowerCase()](h, (s, o, n) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: n }) }) }); else if (n) { const e = new Request(h.url); e.method = a, e.headers = h.headers, e.body = h.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } else r && (f = new Promise((e, t) => { fetch(h.url, { method: a, headers: h.headers, body: h.body }).then(e => e.json()).then(t => e({ statusCode: t.status, headers: t.headers, body: t.data })).catch(t) })); const y = l ? new Promise((e, t) => { p = setTimeout(() => (c.onTimeout(), t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)), l) }) : null; return (y ? Promise.race([y, f]).then(e => (clearTimeout(p), e)) : f).then(e => c.onResponse(e)) })(h, a))), a } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: o, isSurge: n, isNode: i, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (i) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (o || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), i) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (o || n) && $persistentStore.write(e, this.name), i && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || o) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); i && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || o ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : i ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || o) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); i && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", a = "", h = {}) { const d = h["open-url"], l = h["media-url"]; if (s && $notify(e, t, a, h), n && $notification.post(e, t, a + `${l ? "\n多媒体:" + l : ""}`, { url: d }), o) { let s = {}; d && (s.openUrl = d), l && (s.mediaUrl = l), "{}" === JSON.stringify(s) ? $notification.post(e, t, a) : $notification.post(e, t, a, s) } if (i || u) { const s = a + (d ? `\n点击跳转: ${d}` : "") + (l ? `\n多媒体: ${l}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || o || n ? $done(e) : i && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
