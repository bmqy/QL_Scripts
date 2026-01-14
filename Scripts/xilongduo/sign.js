/**
 * 喜隆多小程序签到脚本
 * 
 * 更新时间: 2026-01-14
 * 脚本兼容: QuantumultX、Loon、Surge
 * 使用官方 Env.js 库实现跨平台兼容
 * 使用 BoxJs 管理隐私数据
 * https://github.com/chavyleung/scripts
 * 
 * 功能说明：
 * - 自动完成喜隆多小程序每日签到
 * - 自动捕获并保存token和mallID
 * - 通过BoxJs管理隐私数据
 */

// 初始化Env，启用BoxJs 支持
const $ = new Env("XiLongDuo");

// BoxJS 字段名称定义
const KEYS = {
    TOKEN: "#XiLongDuo.token",
    MALLID: "#XiLongDuo.mallID",
    SYSTEMINFO: "#XiLongDuo.systemInfo"
};

// 执行签到
async function signIn() {
    try {
        // 从BoxJs 读取配置
        const token = $.getdata(KEYS.TOKEN);
        const mallID = $.getdata(KEYS.MALLID);
        
        // 检查配置
        if (!token) {
            $.notify("喜隆多小程序", "配置错误", "请在 BoxJs 中添加 token 配置");
            $.logErr("未找到 token 配置");
            return;
        }
        
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
        
        const savedSystemInfo = $.getdata(KEYS.SYSTEMINFO);
        if (savedSystemInfo) {
            try {
                const parsedSystemInfo = JSON.parse(savedSystemInfo);
                // 确保解析后的对象有效
                if (typeof parsedSystemInfo === 'object' && parsedSystemInfo !== null) {
                    systemInfo = parsedSystemInfo;
                    $.log(`使用保存的systemInfo: ${JSON.stringify(systemInfo)}`);
                }
            } catch (e) {
                $.logErr(`解析保存的systemInfo失败: ${e}`);
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
                const message = `${res.d.Content || ''}。${res.d.Msg || ''}`.trim();
                $.log(`签到成功: ${message}`);
                $.notify('喜隆多小程序', '签到成功', message);
            } else {
                const errorMsg = res.e || '未知错误';
                $.logErr(`签到失败: ${errorMsg}`);
                $.notify('喜隆多小程序', '签到失败', `错误: ${errorMsg}`);
            }
        } else {
            throw new Error('响应体为空');
        }
    } catch (error) {
        $.logErr(`签到过程中出错: ${error.message || error}`);
        $.notify('喜隆多小程序', '签到失败', `网络错误: ${error.message || '未知错误'}`);
    } finally {
        $.done();
    }
}

// 参数获取函数
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
                    const currentToken = $.getdata(KEYS.TOKEN);
                    if (currentToken !== body.Header.Token) {
                        $.setdata(body.Header.Token, KEYS.TOKEN);
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
                    const currentMallID = $.getdata(KEYS.MALLID);
                    if (currentMallID !== mallIdValue.toString()) {
                        $.setdata(mallIdValue.toString(), KEYS.MALLID);
                        $.log(`[喜隆多] 成功更新mallID: ${mallIdValue}`);
                        mallIDUpdated = true;
                    } else {
                        $.log(`[喜隆多] mallID已存在且未变化: ${mallIdValue}`);
                    }
                }
                
                // 保存systemInfo
                if (body.Header && body.Header.systemInfo) {
                    $.setdata(JSON.stringify(body.Header.systemInfo), KEYS.SYSTEMINFO);
                    $.log("[喜隆多] 成功保存systemInfo");
                }
            } catch (e) {
                $.logErr(`[喜隆多] 解析请求体失败: ${e}`);
            }
        }
        
        // 2. 从请求头中获取token（备用路径）
        if (!tokenFound && typeof $request !== 'undefined' && $request.headers) {
            const headers = $request.headers;
            let token = null;
            
            // 检查常见的token字段
            if (headers.Authorization) {
                token = headers.Authorization.replace(/^Bearer\s+/i, '');
            } else if (headers.token) {
                token = headers.token;
            }
            
            if (token) {
                tokenFound = true;
                if ($.getdata(KEYS.TOKEN) !== token) {
                    $.setdata(token, KEYS.TOKEN);
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
                    if ($.getdata(KEYS.TOKEN) !== token) {
                        $.setdata(token, KEYS.TOKEN);
                        $.log(`[喜隆多] 从响应体成功更新token: ${token.substring(0, 10)}...`);
                        tokenUpdated = true;
                    } else {
                        $.log(`[喜隆多] 从响应体读取token，但已存在且未变化`);
                    }
                }
                
                // 检查mallID
                if (resBody.MallID) {
                    mallIDFound = true;
                    if ($.getdata(KEYS.MALLID) !== resBody.MallID.toString()) {
                        $.setdata(resBody.MallID.toString(), KEYS.MALLID);
                        $.log(`[喜隆多] 从响应体成功更新mallID: ${resBody.MallID}`);
                        mallIDUpdated = true;
                    } else {
                        $.log(`[喜隆多] 从响应体读取mallID，但已存在且未变化`);
                    }
                }
            } catch (e) {
                $.logErr(`[喜隆多] 解析响应体失败: ${e}`);
            }
        }
        
        // 简化的参数获取总结
        const existingToken = $.getdata(KEYS.TOKEN);
        const existingMallID = $.getdata(KEYS.MALLID);
        
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
                    $.logErr(`[喜隆多] 发送通知失败: ${e}`);
                }
            }
        } else {
            $.log("[喜隆多] 未找到需要更新的参数");
            $.log("[喜隆多] 请确保在正确的接口上执行参数获取");
        }
    } catch (error) {
        $.logErr(`[喜隆多] 参数获取出错: ${error}`);
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
$.log(`环境检测：当前环境状态日志开始`);
$.log(`环境检测：$request存在=${typeof $request !== 'undefined'}`);
$.log(`环境检测：$response存在=${typeof $response !== 'undefined'}`);
$.log(`环境检测：$loon存在=${typeof $loon !== 'undefined'} (Loon环境)`);
$.log(`环境检测：$task存在=${typeof $task !== 'undefined'} (QuantumultX环境)`);
$.log(`环境检测：$httpClient存在=${typeof $httpClient !== 'undefined'} (Surge环境)`);
$.log(`环境检测：$done存在=${typeof $done !== 'undefined'}`);

// 检查是否是请求事件并且请求体中含有token和mallID
function hasTokenAndMallIDInRequestBody() {
    try {
        if (typeof $request !== 'undefined' && $request.body) {
            const body = JSON.parse($request.body);
            return body.Header && body.Header.Token && (body.MallID || body.MallId);
        }
        return false;
    } catch (e) {
        $.logErr(`解析请求体失败: ${e}`);
        return false;
    }
}

// 判断运行模式：如果是请求事件且请求体中含有token和mallID，执行参数获取方法；否则执行签到
if (typeof $request !== 'undefined' && hasTokenAndMallIDInRequestBody()) {
    $.log("环境检测：检测到请求事件且请求体包含token和mallID，执行参数获取功能");
    GetParameter();
} else {
    $.log("脚本开始执行，运行签到功能");
    signIn();
}

$.log(`环境检测：当前环境状态日志结束`);

// Env.min.js 核心代码 - Chavy 官方版本
function Env(e,t){class s{constructor(e){this.env=e}send(e,t="GET"){e="string"==typeof e?{url:e}:e;let s=this.get;"POST"===t&&(s=this.post);const i=new Promise(((t,i)=>{s.call(this,e,((e,s,o)=>{e?i(e):t(s)}))}));return e.timeout?((e,t=1e3)=>Promise.race([e,new Promise(((e,s)=>{setTimeout((()=>{s(new Error("请求超时"))}),t)}))]))(i,e.timeout):i}get(e){return this.send.call(this.env,e)}post(e){return this.send.call(this.env,e,"POST")}}return new class{constructor(e,t){this.logLevels={debug:0,info:1,warn:2,error:3},this.logLevelPrefixs={debug:"[DEBUG] ",info:"[INFO] ",warn:"[WARN] ",error:"[ERROR] "},this.logLevel="info",this.name=e,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,t),this.log("",`${this.name}, 开始`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(e,t=null){try{return JSON.parse(e)}catch{return t}}toStr(e,t=null,...s){try{return JSON.stringify(e,...s)}catch{return t}}getjson(e,t){let s=t;if(this.getdata(e))try{s=JSON.parse(this.getdata(e))}catch{}return s}setjson(e,t){try{return this.setdata(JSON.stringify(e),t)}catch{return!1}}getdata(e){let t=this.getval(e);if(/^@/.test(e)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(e),o=s?this.getval(s):"";if(o)try{const e=JSON.parse(o);t=e?this.lodash_get(e,i,""):t}catch(e){t=""}}return t}setdata(e,t){let s=!1;if(/^@/.test(t)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(t),r=this.getval(i),a=i?"null"===r?null:r||"{}":"{}";try{const t=JSON.parse(a);this.lodash_set(t,o,e),s=this.setval(JSON.stringify(t),i)}catch(t){const r={};this.lodash_set(r,o,e),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(e,t);return s}getval(e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(e);case"Quantumult X":return $prefs.valueForKey(e);case"Node.js":return this.data=this.loaddata(),this.data[e];default:return this.data&&this.data[e]||null}}setval(e,t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(e,t);case"Quantumult X":return $prefs.setValueForKey(e,t);case"Node.js":return this.data=this.loaddata(),this.data[t]=e,this.writedata(),!0;default:return this.data&&this.data[t]||null}}lodash_get(e,t,s){const i=t.replace(/\[(\d+)\]/g,".$1").split(".");let o=e;for(const e of i)if(o=Object(o)[e],void 0===o)return s;return o}lodash_set(e,t,s){return Object(e)!==e||(Array.isArray(t)||(t=t.toString().match(/[^.[\]]+/g)||[]),t.slice(0,-1).reduce(((e,s,i)=>Object(e[s])===e[s]?e[s]:e[s]=Math.abs(t[i+1])>>0==+t[i+1]?[]:{}),e)[t[t.length-1]]=s),e}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const e=this.path.resolve(this.dataFile),t=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(e),i=!s&&this.fs.existsSync(t);if(!s&&!i)return{};{const i=s?e:t;try{return JSON.parse(this.fs.readFileSync(i))}catch(e){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const e=this.path.resolve(this.dataFile),t=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(e),i=!s&&this.fs.existsSync(t),o=JSON.stringify(this.data);s?this.fs.writeFileSync(e,o):i?this.fs.writeFileSync(t,o):this.fs.writeFileSync(e,o)}}msg(t=e,s="",i="",o={}){const r=e=>{const{$open:t,$copy:s,$media:i,$mediaMime:o}=e;switch(typeof e){case void 0:return;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:e};case"Loon":case"Shadowrocket":return e;case"Quantumult X":return{"open-url":e};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{const r={};let a=e.openUrl||e.url||e["open-url"]||t;a&&Object.assign(r,{action:"open-url",url:a});let n=e["update-pasteboard"]||e.updatePasteboard||s;n&&Object.assign(r,{action:"clipboard",text:n});let h=e.mediaUrl||e["media-url"]||i;if(h){let e,t;if(h.startsWith("http"));else if(h.startsWith("data:")){const[s]=h.split(";"),[,i]=h.split(",");e=i,t=s.replace("data:","")}else{e=h,t=(e=>{const t={JVBERi0:"application/pdf",R0lGODdh:"image/gif",R0lGODlh:"image/gif",iVBORw0KGgo:"image/png","/9j/":"image/jpg"};for(var s in t)if(0===e.indexOf(s))return t[s];return null})(h)}Object.assign(r,{"media-url":h,"media-base64":e,"media-base64-mime":o??t})}return Object.assign(r,{"auto-dismiss":e["auto-dismiss"],sound:e.sound}),r}case"Loon":{const s={};let o=e.openUrl||e.url||e["open-url"]||t;o&&Object.assign(s,{openUrl:o});let r=e.mediaUrl||e["media-url"]||i;return r&&Object.assign(s,{mediaUrl:r}),console.log(JSON.stringify(s)),s}case"Quantumult X":{const o={};let r=e["open-url"]||e.url||e.openUrl||t;r&&Object.assign(o,{"open-url":r});let a=e.mediaUrl||e["media-url"]||i;a&&Object.assign(o,{"media-url":a});let n=e["update-pasteboard"]||e.updatePasteboard||s;return n&&Object.assign(o,{"update-pasteboard":n}),console.log(JSON.stringify(o)),o}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(t,s,i,r(o));break;case"Quantumult X":$notify(t,s,i,r(o));break;case"Node.js":break}if(!this.isMuteLog){let e=["","==============系统通知=============="];e.push(t),s&&e.push(s),i&&e.push(i),console.log(e.join("\n")),this.logs=this.logs.concat(e)}}debug(...e){this.logLevels[this.logLevel]<=this.logLevels.debug&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.debug}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}info(...e){this.logLevels[this.logLevel]<=this.logLevels.info&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.info}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}warn(...e){this.logLevels[this.logLevel]<=this.logLevels.warn&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.warn}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}error(...e){this.logLevels[this.logLevel]<=this.logLevels.error&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.error}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}log(...e){e.length>0&&(this.logs=[...this.logs,...e]),console.log(e.map((e=>e??String(e))).join(this.logSeparator))}logErr(e,t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`${this.name}, 错误!`,t,e);break;case"Node.js":this.log("",`${this.name}, 错误!`,t,void 0!==e.message?e.message:e,e.stack);break}}wait(e){return new Promise((t=>setTimeout(t,e)))}done(e={}){const t=((new Date).getTime()-this.startTime)/1e3;switch(this.log("",`${this.name}, 结束!  ${t} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(e);break;case"Node.js":process.exit(1)}}}(e,t)}
