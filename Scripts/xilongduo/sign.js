
/**
 * 喜隆多小程序签到脚本
 * 
 * 更新时间: 2025-09-25 17:04
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
                const errorMsg = res.d.Msg || '未知错误';
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

// 参数获取函数 - 自动捕获并保存token和mallID（优化Loon环境兼容性，支持多存储路径）
function GetParameter() {
    try {
        // 强制使用console.log来确保在Loon环境中日志可见
        console.log("[喜隆多小程序] 进入参数获取模式 - Loon环境特殊处理");
        $.log("进入参数获取模式");
        let tokenFound = false;
        let mallIDFound = false;
        
        // 记录环境信息，便于调试
        console.log(`[喜隆多小程序] 环境信息 - Loon: ${typeof $loon !== 'undefined'}`);
        console.log(`[喜隆多小程序] 环境信息 - $request存在: ${typeof $request !== 'undefined'}`);
        console.log(`[喜隆多小程序] 环境信息 - $response存在: ${typeof $response !== 'undefined'}`);
        console.log(`[喜隆多小程序] 环境信息 - $done存在: ${typeof $done !== 'undefined'}`);
        
        $.log(`环境信息 - Loon: ${typeof $loon !== 'undefined'}`);
        $.log(`环境信息 - $request存在: ${typeof $request !== 'undefined'}`);
        $.log(`环境信息 - $response存在: ${typeof $response !== 'undefined'}`);
        
        // 安全地获取请求URL（防止在某些环境中未定义导致脚本崩溃）
        if (typeof $request !== 'undefined' && $request.url) {
            console.log(`[喜隆多小程序] 当前请求URL: ${$request.url}`);
            $.log(`当前请求URL: ${$request.url}`);
        } else {
            console.log("[喜隆多小程序] $request或$request.url未定义");
            $.log("$request或$request.url未定义");
        }
        
        // 1. 从请求体中获取token和mallID - 增强对Loon环境的兼容性
        if (typeof $request !== 'undefined' && $request.body) {
            try {
                console.log(`[喜隆多小程序] 请求体长度: ${$request.body.length} 字符`);
                const body = JSON.parse($request.body);
                console.log(`[喜隆多小程序] 请求体解析结果: ${JSON.stringify(body).substring(0, 200)}...`);
                $.log(`请求体解析结果: ${JSON.stringify(body).substring(0, 200)}...`);
                
                // 检查并保存token
                if (body.Header && body.Header.Token) {
                    const currentToken = $.read("token");
                    console.log(`[喜隆多小程序] 发现Header.Token，当前存储的token: ${currentToken ? '存在' : '不存在'}`);
                    if (currentToken !== body.Header.Token) {
                        // 同时保存到Loon和BoxJs
                        console.log(`[喜隆多小程序] 成功保存token(请求体-Header.Token): ${body.Header.Token.substring(0, 10)}...`);
                        $.log(`成功保存token(请求体-Header.Token): ${body.Header.Token.substring(0, 10)}...`);
                        $.write(body.Header.Token, "token");
                        // 使用BoxJs命名空间保存
                        $.setdata(body.Header.Token, "boxjs://xilongduo/token");
                        // 尝试使用两种方式发送通知，确保至少有一个能工作
                        try { $.notify('喜隆多小程序', '参数更新', '成功保存token'); } catch (e) {}
                        tokenFound = true;
                    } else {
                        console.log("[喜隆多小程序] token未变化，无需更新");
                        $.log("token未变化，无需更新");
                    }
                } else {
                    console.log("[喜隆多小程序] 请求体中未找到Header.Token");
                }
                
                // 检查并保存mallID
                if (body.MallID) {
                    const currentMallID = $.read("mallID");
                    console.log(`[喜隆多小程序] 发现MallID，当前存储的mallID: ${currentMallID ? '存在' : '不存在'}`);
                    if (currentMallID !== body.MallID.toString()) {
                        // 同时保存到Loon和BoxJs
                        console.log(`[喜隆多小程序] 成功保存mallID: ${body.MallID}`);
                        $.log(`成功保存mallID: ${body.MallID}`);
                        $.write(body.MallID.toString(), "mallID");
                        // 使用BoxJs命名空间保存
                        $.setdata(body.MallID.toString(), "boxjs://xilongduo/mallID");
                        // 尝试使用两种方式发送通知，确保至少有一个能工作
                        try { $.notify('喜隆多小程序', '参数更新', `成功保存mallID: ${body.MallID}`); } catch (e) {}
                        mallIDFound = true;
                    } else {
                        console.log("[喜隆多小程序] mallID未变化，无需更新");
                        $.log("mallID未变化，无需更新");
                    }
                } else {
                    console.log("[喜隆多小程序] 请求体中未找到MallID");
                }
                
                // 保存systemInfo用于签到请求
                if (body.Header && body.Header.systemInfo) {
                    $.write(JSON.stringify(body.Header.systemInfo), "systemInfo");
                    console.log("[喜隆多小程序] 成功保存systemInfo");
                    $.log("成功保存systemInfo");
                }
            } catch (e) {
                console.error(`[喜隆多小程序] 解析请求体失败: ${e}`);
                $.error(`解析请求体失败: ${e}`);
                // 在Loon中安全地记录请求体前100个字符
                try {
                    if ($request.body && $request.body.length > 0) {
                        const bodyPreview = $request.body.substring(0, 100);
                        console.log(`[喜隆多小程序] 请求体内容: ${bodyPreview}...`);
                        $.log(`请求体内容: ${bodyPreview}...`);
                    }
                } catch (logError) {
                    console.error(`[喜隆多小程序] 记录请求体失败: ${logError}`);
                    $.error(`记录请求体失败: ${logError}`);
                }
            }
        } else {
            console.log("[喜隆多小程序] $request或$request.body未定义，无法从请求体获取参数");
            $.log("$request或$request.body未定义，无法从请求体获取参数");
        }
        
        // 2. 从请求头中获取token（备用路径）- 优化Loon中的请求头处理
        if (!tokenFound && typeof $request !== 'undefined' && $request.headers) {
            const headers = $request.headers;
            console.log("[喜隆多小程序] 开始从请求头获取token");
            // 安全地记录请求头，避免过大
            try {
                const headersStr = JSON.stringify(headers);
                console.log(`[喜隆多小程序] 请求头: ${headersStr.substring(0, 200)}...`);
                $.log(`请求头: ${headersStr.substring(0, 200)}...`);
            } catch (logError) {
                console.error(`[喜隆多小程序] 记录请求头失败: ${logError}`);
                $.error(`记录请求头失败: ${logError}`);
            }
            
            // 检查常见的token头
            if (headers.Authorization) {
                const token = headers.Authorization.replace(/^Bearer\s+/i, '');
                console.log(`[喜隆多小程序] 发现Authorization头，长度: ${token.length} 字符`);
                if (token && $.read("token") !== token) {
                    // 同时保存到Loon和BoxJs
                    console.log(`[喜隆多小程序] 成功保存token(请求头-Authorization): ${token.substring(0, 10)}...`);
                    $.log(`成功保存token(请求头-Authorization): ${token.substring(0, 10)}...`);
                    $.write(token, "token");
                    // 使用BoxJs命名空间保存
                    $.setdata(token, "boxjs://xilongduo/token");
                    // 尝试使用两种方式发送通知，确保至少有一个能工作
                    try { $.notify('喜隆多小程序', '参数更新', '成功保存token'); } catch (e) {}
                    tokenFound = true;
                }
            } else if (headers.token) {
                console.log(`[喜隆多小程序] 发现token头，长度: ${headers.token.length} 字符`);
                if ($.read("token") !== headers.token) {
                    // 同时保存到Loon和BoxJs
                    console.log(`[喜隆多小程序] 成功保存token(请求头-token): ${headers.token.substring(0, 10)}...`);
                    $.log(`成功保存token(请求头-token): ${headers.token.substring(0, 10)}...`);
                    $.write(headers.token, "token");
                    // 使用BoxJs命名空间保存
                    $.setdata(headers.token, "boxjs://xilongduo/token");
                    // 尝试使用两种方式发送通知，确保至少有一个能工作
                    try { $.notify('喜隆多小程序', '参数更新', '成功保存token'); } catch (e) {}
                    tokenFound = true;
                }
            } else {
                console.log("[喜隆多小程序] 请求头中未找到Authorization或token字段");
            }
        }
        
        // 3. 从响应体中获取数据 - 优化Loon中的响应处理
        if (!tokenFound && typeof $response !== 'undefined' && $response && $response.body) {
            console.log("[喜隆多小程序] 开始从响应体获取数据");
            try {
                const resBody = JSON.parse($response.body);
                console.log(`[喜隆多小程序] 响应体解析结果: ${JSON.stringify(resBody).substring(0, 200)}...`);
                $.log(`响应体解析结果: ${JSON.stringify(resBody).substring(0, 200)}...`);
                
                // 检查响应中的token
                if (resBody.Header && resBody.Header.Token && $.read("token") !== resBody.Header.Token) {
                    console.log(`[喜隆多小程序] 发现响应体Header.Token，长度: ${resBody.Header.Token.length} 字符`);
                    // 同时保存到Loon和BoxJs
                    console.log(`[喜隆多小程序] 成功保存token(响应体-Header.Token): ${resBody.Header.Token.substring(0, 10)}...`);
                    $.log(`成功保存token(响应体-Header.Token): ${resBody.Header.Token.substring(0, 10)}...`);
                    $.write(resBody.Header.Token, "token");
                    // 使用BoxJs命名空间保存
                    $.setdata(resBody.Header.Token, "boxjs://xilongduo/token");
                    // 尝试使用两种方式发送通知，确保至少有一个能工作
                    try { $.notify('喜隆多小程序', '参数更新', '成功保存token'); } catch (e) {}
                    tokenFound = true;
                } else {
                    console.log("[喜隆多小程序] 响应体中未找到Header.Token或token未变化");
                }
                
                // 检查响应中的其他可能的token字段
                if (!tokenFound) {
                    const possibleTokenFields = ['token', 'Token', 'access_token', 'AccessToken'];
                    console.log(`[喜隆多小程序] 开始检查其他可能的token字段: ${possibleTokenFields.join(', ')}`);
                    for (const field of possibleTokenFields) {
                        if (resBody[field] && $.read("token") !== resBody[field]) {
                            console.log(`[喜隆多小程序] 在字段${field}中发现token，长度: ${resBody[field].length} 字符`);
                            // 同时保存到Loon和BoxJs
                            console.log(`[喜隆多小程序] 成功保存token(响应体-${field}): ${resBody[field].substring(0, 10)}...`);
                            $.log(`成功保存token(响应体-${field}): ${resBody[field].substring(0, 10)}...`);
                            $.write(resBody[field], "token");
                            // 使用BoxJs命名空间保存
                            $.setdata(resBody[field], "boxjs://xilongduo/token");
                            // 尝试使用两种方式发送通知，确保至少有一个能工作
                            try { $.notify('喜隆多小程序', '参数更新', '成功保存token'); } catch (e) {}
                            tokenFound = true;
                            break;
                        }
                    }
                }
                
                // 检查响应中的mallID
                if (!mallIDFound && resBody.MallID && $.read("mallID") !== resBody.MallID.toString()) {
                    console.log(`[喜隆多小程序] 发现响应体MallID: ${resBody.MallID}`);
                    // 同时保存到Loon和BoxJs
                    console.log(`[喜隆多小程序] 成功保存mallID(响应体): ${resBody.MallID}`);
                    $.log(`成功保存mallID(响应体): ${resBody.MallID}`);
                    $.write(resBody.MallID.toString(), "mallID");
                    // 使用BoxJs命名空间保存
                    $.setdata(resBody.MallID.toString(), "boxjs://xilongduo/mallID");
                    mallIDFound = true;
                }
            } catch (e) {
                console.error(`[喜隆多小程序] 解析响应体失败: ${e}`);
                $.error(`解析响应体失败: ${e}`);
                if ($response && $response.body) {
                    try {
                        const resPreview = $response.body.substring(0, 100);
                        console.log(`[喜隆多小程序] 响应体内容: ${resPreview}...`);
                        $.log(`响应体内容: ${resPreview}...`);
                    } catch (logError) {
                        console.error(`[喜隆多小程序] 记录响应体失败: ${logError}`);
                        $.error(`记录响应体失败: ${logError}`);
                    }
                }
            }
        }
        
        // 4. 额外的Loon特殊处理：尝试直接从请求对象的其他可能位置获取
        if (typeof $loon !== 'undefined' && !tokenFound) {
            console.log("[喜隆多小程序] Loon环境特殊处理：尝试从其他可能位置获取参数");
            // 检查是否有其他可能包含参数的对象
            try {
                // 尝试访问$request对象的其他属性
                const requestProps = Object.keys($request || {});
                console.log(`[喜隆多小程序] $request对象属性: ${requestProps.join(', ')}`);
                
                // 检查是否有其他可能包含token的字段
                if (typeof $request === 'object') {
                    for (const prop in $request) {
                        if (prop.toLowerCase().includes('token') && typeof $request[prop] === 'string' && $request[prop].length > 10) {
                            console.log(`[喜隆多小程序] 在$request.${prop}中发现可能的token，长度: ${$request[prop].length} 字符`);
                            if ($.read("token") !== $request[prop]) {
                                $.write($request[prop], "token");
                                $.setdata($request[prop], "boxjs://xilongduo/token");
                                try { $.notify('喜隆多小程序', '参数更新', `从$request.${prop}成功保存token`); } catch (e) {}
                                tokenFound = true;
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`[喜隆多小程序] Loon环境特殊处理失败: ${e}`);
            }
        }
        
        // 添加参数获取总结，帮助调试
        const existingToken = $.read("token");
        const existingMallID = $.read("mallID");
        console.log(`[喜隆多小程序] 参数获取总结 - token: ${tokenFound ? '已更新' : '未变化'}，mallID: ${mallIDFound ? '已更新' : '未变化'}`);
        console.log(`[喜隆多小程序] 当前存储的token: ${existingToken ? '存在(' + existingToken.length + '字符)' : '不存在'}`);
        console.log(`[喜隆多小程序] 当前存储的mallID: ${existingMallID ? '存在(' + existingMallID + ')' : '不存在'}`);
        
        if (tokenFound || mallIDFound) {
            $.log(`参数获取成功，token: ${tokenFound ? '已更新' : '未变化'}，mallID: ${mallIDFound ? '已更新' : '未变化'}`);
        } else {
            $.log("未在请求中找到可用的token或mallID需要更新");
            $.log(`当前存储的token: ${existingToken ? '存在' : '不存在'}`);
            $.log(`当前存储的mallID: ${existingMallID ? '存在' : '不存在'}`);
            
            // 如果没有获取到参数但已有存储的参数，发送通知确认
            if (existingToken || existingMallID) {
                try {
                    $.notify('喜隆多小程序', '参数状态', `token${existingToken ? '已存在' : '未设置'}，mallID${existingMallID ? '已存在' : '未设置'}`);
                } catch (e) {}
            }
        }
    } catch (error) {
        console.error(`[喜隆多小程序] 参数获取出错: ${error}`);
        console.error(`[喜隆多小程序] 错误栈: ${error.stack || '无'}`);
        $.error(`参数获取出错: ${error}`);
        // 在Loon中安全地处理全局异常
        try {
            $.notify('喜隆多小程序', '参数获取失败', `错误: ${error.message || error}`);
        } catch (notifyError) {
            console.error(`[喜隆多小程序] 发送通知失败: ${notifyError}`);
            $.error(`发送通知失败: ${notifyError}`);
        }
    } finally {
        // 根据Loon文档要求，确保在脚本结束时调用$.done()
        try {
            console.log("[喜隆多小程序] 即将调用$.done()结束参数获取脚本");
            if (typeof $done !== 'undefined') {
                $done();
            } else {
                console.log("[喜隆多小程序] $done未定义，使用替代方式结束脚本");
            }
        } catch (doneError) {
            // 避免在某些环境中$.done()未定义导致的崩溃
            console.error(`[喜隆多小程序] 调用$.done()失败: ${doneError}`);
        }
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

// 特殊处理Loon环境
if (typeof $loon !== 'undefined') {
    $.log("环境检测: 检测到Loon环境，尝试执行参数获取功能");
    try {
        // 即使在Loon中$request或$response未定义，也尝试获取参数
        GetParameter();
    } catch (loonError) {
        $.error(`Loon环境中执行参数获取失败: ${loonError}`);
        // 如果参数获取失败，尝试执行签到功能（这可能是由于脚本直接运行）
        if (typeof $httpClient !== 'undefined') {
            $.log("Loon环境中参数获取失败，尝试执行签到功能");
            signIn();
        }
    }
} 
// 标准环境判断逻辑
else if (typeof $request !== 'undefined' || typeof $response !== 'undefined') {
    $.log("环境检测: 进入请求拦截环境，执行参数获取功能");
    GetParameter();
} else {
    $.log("环境检测: 进入脚本执行环境，执行签到功能");
    signIn();
}

$.log(`环境检测: 当前环境状态日志结束`);

// OpenAPI 核心代码 - Peng-YM 压缩版
function ENV() { const e = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: "undefined" != typeof $task, isLoon: "undefined" != typeof $loon, isSurge: "undefined" != typeof $httpClient && "undefined" != typeof $utils, isBrowser: "undefined" != typeof document, isNode: "function" == typeof require && !e, isJSBox: e, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: o, isScriptable: n, isNode: i, isBrowser: r } = ENV(), u = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/; const a = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(h => a[h.toLowerCase()] = (a => (function (a, h) { h = "string" == typeof h ? { url: h } : h; const d = e.baseURL; d && !u.test(h.url || "") && (h.url = d ? d + h.url : h.url), h.body && h.headers && !h.headers["Content-Type"] && (h.headers["Content-Type"] = "application/x-www-form-urlencoded"); const l = (h = { ...e, ...h }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...h.events }; let f, p; if (c.onRequest(a, h), t) f = $task.fetch({ method: a, ...h }); else if (s || o || i) f = new Promise((e, t) => { (i ? require("request") : $httpClient)[a.toLowerCase()](h, (s, o, n) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: n }) }) }); else if (n) { const e = new Request(h.url); e.method = a, e.headers = h.headers, e.body = h.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } else r && (f = new Promise((e, t) => { fetch(h.url, { method: a, headers: h.headers, body: h.body }).then(e => e.json()).then(t => e({ statusCode: t.status, headers: t.headers, body: t.data })).catch(t) })); const y = l ? new Promise((e, t) => { p = setTimeout(() => (c.onTimeout(), t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)), l) }) : null; return (y ? Promise.race([y, f]).then(e => (clearTimeout(p), e)) : f).then(e => c.onResponse(e)) })(h, a))), a } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: o, isSurge: n, isNode: i, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (i) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (o || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), i) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (o || n) && $persistentStore.write(e, this.name), i && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || o) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); i && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || o ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : i ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || o) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); i && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", a = "", h = {}) { const d = h["open-url"], l = h["media-url"]; if (s && $notify(e, t, a, h), n && $notification.post(e, t, a + `${l ? "\n多媒体:" + l : ""}`, { url: d }), o) { let s = {}; d && (s.openUrl = d), l && (s.mediaUrl = l), "{}" === JSON.stringify(s) ? $notification.post(e, t, a) : $notification.post(e, t, a, s) } if (i || u) { const s = a + (d ? `\n点击跳转: ${d}` : "") + (l ? `\n多媒体: ${l}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || o || n ? $done(e) : i && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
