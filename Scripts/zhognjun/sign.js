/**
 * 中骏小程序签到脚本
 * 
 * 更新时间: 2026-01-14
 * 脚本兼容: QuantumultX、Loon、Surge
 * 使用官方 Env.js 库实现跨平台兼容
 * 使用 BoxJs 管理隐私数据
 * https://github.com/chavyleung/scripts
 * 
 * 功能说明：
 * - 自动完成中骏小程序每日签到
 * - 自动捕获并保存token、customerId和shopCode
 * - 通过BoxJs管理隐私数据
 */

// 初始化Env，启用BoxJs 支持
const $ = new Env("ZhongJunSign");

// 存储键名 - 使用统一的数据存储
const CONFIG_KEY = "zhognjun";

// 从存储中读取配置
function getConfig() {
    return $.toObj($.getdata(CONFIG_KEY)) || { token: "", customerId: "", shopCode: "" };
}

// 保存配置到存储
function saveConfig(config) {
    return $.setjson(config, CONFIG_KEY);
}

// 配置信息
const API_HOST = "api.sce-icm.com";
const url = `https://${API_HOST}/api/v1/dig-mall/customer/sign/signNow`;

// 获取当前时间戳
function getCurrentTimestamp() {
    const timestamp = Date.now().toString();
    $.log(`获取时间戳：${timestamp}`);
    return timestamp;
}

// 获取x-http-token
async function getXHttpToken() {
    $.log("开始获取x-http-token");
    
    // 从存储中读取token
    const config = getConfig();
    if (config.token) {
        $.log("从存储获取到token");
        return config.token;
    }
    
    // 如果本地没有，提示用户配置
    $.logErr("存储中未找到token，请先配置");
    $.msg('中骏小程序', '配置错误', '请在 BoxJs 中配置 token 参数');
    throw new Error("未配置token");
}

// 执行签到流程
async function signIn() {
    try {
        $.log("开始执行签到流程");
        
        // 从存储读取配置
        const config = getConfig();
        const customerId = config.customerId;
        const shopCode = config.shopCode;
        
        // 检查必要的配置是否存在
        if (!customerId || !shopCode) {
            $.msg('中骏小程序', '配置错误', '请在 BoxJs 中完整配置 customerId 和 shopCode');
            $.logErr("配置不完整：缺少 customerId 或 shopCode");
            return;
        }
        
        // 获取token
        $.log("步骤1：获取token");
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
        $.log("步骤3：执行签到请求");
        const response = await $.http.post(options);
        
        if (response && response.body) {
            $.log(`签到请求成功，状态码：${response.statusCode}`);
            const res = JSON.parse(response.body);
            
            if (res.code === 200) {
                if (res.data.isSuccess) {
                    let message = `+${res.data.signDailyPoint}。下次签到奖励：${res.data.nextAwardCount}。连续签到：${res.data.totalSignCount}天`;
                    $.log(`签到成功：${message}`);
                    $.notify('中骏小程序', '签到成功', message);
                } else {
                    const failReason = res.data.failReason || '签到未成功';
                    $.logErr(`签到未成功：${failReason}`);
                    $.notify('中骏小程序', '签到未成功', failReason);
                }
            } else {
                const errorMsg = res.message || '未知错误';
                $.logErr(`签到失败：${errorMsg}`);
                $.notify('中骏小程序', '签到失败', `错误：${errorMsg}`);
            }
        } else {
            throw new Error('响应体为空');
        }
    } catch (error) {
        $.logErr(`执行签到流程出错：${error.message || error}`);
        $.notify('中骏小程序', '签到失败', `签到流程执行失败：${error.message || '未知错误'}`);
    } finally {
        $.done();
    }
}

// 参数获取函数
function GetParameter() {
    try {
        $.log("[中骏] 进入参数获取模式");
        let config = getConfig();
        let updated = false;
        
        // 1. 从请求头中获取token
        if (typeof $request !== 'undefined' && $request.headers && $request.headers['x-http-token']) {
            const token = $request.headers['x-http-token'];
            if (token && config.token !== token) {
                config.token = token;
                $.log(`[中骏] 成功更新token：${token.substring(0, 10)}...`);
                updated = true;
            }
        }
        // 2. 从请求体中获取customerId和shopCode
        if (typeof $request !== 'undefined' && $request.body) {
            try {
                const body = JSON.parse($request.body);
                $.log(`[中骏] 请求体内容：${JSON.stringify(body).substring(0, 200)}...`);
                
                if (body.customerId && config.customerId !== body.customerId) {
                    config.customerId = body.customerId;
                    $.log(`[中骏] 成功更新customerId：${body.customerId}`);
                    updated = true;
                }
                
                if (body.shopCode && config.shopCode !== body.shopCode) {
                    config.shopCode = body.shopCode;
                    $.log(`[中骏] 成功更新shopCode：${body.shopCode}`);
                    updated = true;
                }
                
                if (body.token && config.token !== body.token) {
                    config.token = body.token;
                    $.log(`[中骏] 从请求体成功更新token：${body.token.substring(0, 10)}...`);
                    updated = true;
                }
            } catch (e) {
                $.logErr(`[中骏] 解析请求体失败：${e}`);
            }
        }
        
        // 3. 保存配置
        if (updated) {
            saveConfig(config);
            $.log(`[中骏] 参数已保存`);
            $.log(`[中骏] 当前保存的token：${config.token ? config.token.substring(0, 10) + '...' : '无'}`);
            $.log(`[中骏] 当前保存的customerId：${config.customerId || '无'}`);
            $.log(`[中骏] 当前保存的shopCode：${config.shopCode || '无'}`);
            $.msg('中骏小程序', '参数获取成功', '已保存token、customerId和shopCode');
        } else {
            $.log("[中骏] 未找到需要更新的参数");
            $.log("[中骏] 请确保在正确的接口上执行参数获取");
        }
    } catch (error) {
        $.logErr(`[中骏] 参数获取出错：${error}`);
        $.msg('中骏小程序', '参数获取失败', `错误：${error.message || error}`);
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

// 检查是否是签到请求
function isSignRequest() {
    try {
        if (typeof $request !== 'undefined' && $request.url) {
            return $request.url.includes('/customer/sign/signNow');
        }
        return false;
    } catch (e) {
        $.logErr(`检查请求失败：${e}`);
        return false;
    }
}

// 检查请求体中是否包含签到需要的参数
function hasSignParamsInRequest() {
    try {
        if (typeof $request !== 'undefined' && $request.body) {
            const body = JSON.parse($request.body);
            return body.customerId && body.shopCode;
        }
        return false;
    } catch (e) {
        $.logErr(`解析请求体失败：${e}`);
        return false;
    }
}

// 如果检测到签到请求，则获取参数，否则执行签到
if (isSignRequest()) {
    $.log("环境检测：检测到签到请求，自动获取签到参数");
    if (hasSignParamsInRequest()) {
        GetParameter();
    } else {
        $.log("环境检测：签到请求中未找到必要参数");
        $done();
    }
} else {
    // 定时任务或主动运行时，执行签到功能
    $.log("脚本开始执行，运行签到功能");
    signIn();
}

$.log(`环境检测：当前环境状态日志结束`);

// Env.min.js 核心代码 - Chavy 官方版本
function Env(e,t){class s{constructor(e){this.env=e}send(e,t="GET"){e="string"==typeof e?{url:e}:e;let s=this.get;"POST"===t&&(s=this.post);const i=new Promise(((t,i)=>{s.call(this,e,((e,s,o)=>{e?i(e):t(s)}))}));return e.timeout?((e,t=1e3)=>Promise.race([e,new Promise(((e,s)=>{setTimeout((()=>{s(new Error("请求超时"))}),t)}))]))(i,e.timeout):i}get(e){return this.send.call(this.env,e)}post(e){return this.send.call(this.env,e,"POST")}}return new class{constructor(e,t){this.logLevels={debug:0,info:1,warn:2,error:3},this.logLevelPrefixs={debug:"[DEBUG] ",info:"[INFO] ",warn:"[WARN] ",error:"[ERROR] "},this.logLevel="info",this.name=e,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,t),this.log("",`${this.name}, 开始`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(e,t=null){try{return JSON.parse(e)}catch{return t}}toStr(e,t=null,...s){try{return JSON.stringify(e,...s)}catch{return t}}getjson(e,t){let s=t;if(this.getdata(e))try{s=JSON.parse(this.getdata(e))}catch{}return s}setjson(e,t){try{return this.setdata(JSON.stringify(e),t)}catch{return!1}}getdata(e){let t=this.getval(e);if(/^@/.test(e)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(e),o=s?this.getval(s):"";if(o)try{const e=JSON.parse(o);t=e?this.lodash_get(e,i,""):t}catch(e){t=""}}return t}setdata(e,t){let s=!1;if(/^@/.test(t)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(t),r=this.getval(i),a=i?"null"===r?null:r||"{}":"{}";try{const t=JSON.parse(a);this.lodash_set(t,o,e),s=this.setval(JSON.stringify(t),i)}catch(t){const r={};this.lodash_set(r,o,e),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(e,t);return s}getval(e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(e);case"Quantumult X":return $prefs.valueForKey(e);case"Node.js":return this.data=this.loaddata(),this.data[e];default:return this.data&&this.data[e]||null}}setval(e,t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(e,t);case"Quantumult X":return $prefs.setValueForKey(e,t);case"Node.js":return this.data=this.loaddata(),this.data[t]=e,this.writedata(),!0;default:return this.data&&this.data[t]||null}}lodash_get(e,t,s){const i=t.replace(/\[(\d+)\]/g,".$1").split(".");let o=e;for(const e of i)if(o=Object(o)[e],void 0===o)return s;return o}lodash_set(e,t,s){return Object(e)!==e||(Array.isArray(t)||(t=t.toString().match(/[^.[\]]+/g)||[]),t.slice(0,-1).reduce(((e,s,i)=>Object(e[s])===e[s]?e[s]:e[s]=Math.abs(t[i+1])>>0==+t[i+1]?[]:{}),e)[t[t.length-1]]=s),e}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const e=this.path.resolve(this.dataFile),t=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(e),i=!s&&this.fs.existsSync(t);if(!s&&!i)return{};{const i=s?e:t;try{return JSON.parse(this.fs.readFileSync(i))}catch(e){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const e=this.path.resolve(this.dataFile),t=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(e),i=!s&&this.fs.existsSync(t),o=JSON.stringify(this.data);s?this.fs.writeFileSync(e,o):i?this.fs.writeFileSync(t,o):this.fs.writeFileSync(e,o)}}msg(t=e,s="",i="",o={}){const r=e=>{const{$open:t,$copy:s,$media:i,$mediaMime:o}=e;switch(typeof e){case void 0:return;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:e};case"Loon":case"Shadowrocket":return e;case"Quantumult X":return{"open-url":e};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{const r={};let a=e.openUrl||e.url||e["open-url"]||t;a&&Object.assign(r,{action:"open-url",url:a});let n=e["update-pasteboard"]||e.updatePasteboard||s;n&&Object.assign(r,{action:"clipboard",text:n});let h=e.mediaUrl||e["media-url"]||i;if(h){let e,t;if(h.startsWith("http"));else if(h.startsWith("data:")){const[s]=h.split(";"),[,i]=h.split(",");e=i,t=s.replace("data:","")}else{e=h,t=(e=>{const t={JVBERi0:"application/pdf",R0lGODdh:"image/gif",R0lGODlh:"image/gif",iVBORw0KGgo:"image/png","/9j/":"image/jpg"};for(var s in t)if(0===e.indexOf(s))return t[s];return null})(h)}Object.assign(r,{"media-url":h,"media-base64":e,"media-base64-mime":o??t})}return Object.assign(r,{"auto-dismiss":e["auto-dismiss"],sound:e.sound}),r}case"Loon":{const s={};let o=e.openUrl||e.url||e["open-url"]||t;o&&Object.assign(s,{openUrl:o});let r=e.mediaUrl||e["media-url"]||i;return r&&Object.assign(s,{mediaUrl:r}),console.log(JSON.stringify(s)),s}case"Quantumult X":{const o={};let r=e["open-url"]||e.url||e.openUrl||t;r&&Object.assign(o,{"open-url":r});let a=e.mediaUrl||e["media-url"]||i;a&&Object.assign(o,{"media-url":a});let n=e["update-pasteboard"]||e.updatePasteboard||s;return n&&Object.assign(o,{"update-pasteboard":n}),console.log(JSON.stringify(o)),o}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(t,s,i,r(o));break;case"Quantumult X":$notify(t,s,i,r(o));break;case"Node.js":break}if(!this.isMuteLog){let e=["","==============系统通知=============="];e.push(t),s&&e.push(s),i&&e.push(i),console.log(e.join("\n")),this.logs=this.logs.concat(e)}}debug(...e){this.logLevels[this.logLevel]<=this.logLevels.debug&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.debug}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}info(...e){this.logLevels[this.logLevel]<=this.logLevels.info&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.info}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}warn(...e){this.logLevels[this.logLevel]<=this.logLevels.warn&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.warn}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}error(...e){this.logLevels[this.logLevel]<=this.logLevels.error&&(e.length>0&&(this.logs=[...this.logs,...e]),console.log(`${this.logLevelPrefixs.error}${e.map((e=>e??String(e))).join(this.logSeparator)}`))}log(...e){e.length>0&&(this.logs=[...this.logs,...e]),console.log(e.map((e=>e??String(e))).join(this.logSeparator))}logErr(e,t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`${this.name}, 错误!`,t,e);break;case"Node.js":this.log("",`${this.name}, 错误!`,t,void 0!==e.message?e.message:e,e.stack);break}}wait(e){return new Promise((t=>setTimeout(t,e)))}done(e={}){const t=((new Date).getTime()-this.startTime)/1e3;switch(this.log("",`${this.name}, 结束!  ${t} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(e);break;case"Node.js":process.exit(1)}}}(e,t)}
