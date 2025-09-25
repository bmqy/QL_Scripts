/**
 * @fileoverview Template to compose HTTP reqeuest.
 * OpenAPI
 * https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI
 */
const $ = API("SMMOHelper", true);

$request.body && setPlayerToken();
checkPlayerInfo()

// 更新cookie
function setPlayerToken(){
    if($request.url.indexOf('/bio/submit')>-1){
        let body = $request.body;
        let headers = $request.headers
        let cookies = headers['Cookie']
        if(cookies != $.read('cookies')){
            $.write(cookies, 'cookies')
            $.log(`${$.name}: cookies已更新`);
        }
        let xcsrfToken = getParamString(body, '_token')
        if(xcsrfToken != $.read('xcsrfToken')){
            $.write(xcsrfToken, 'xcsrfToken')
            $.notify(`${$.name}`, ``, `xcsrfToken已更新`);
        }
    }
    if($request.url.indexOf('/api/main')>-1){
        let $body = JSON.parse($request.body)
        let apiToken = $body['api_token'];
        if(apiToken != $.read('apiToken')){
            $.write(apiToken, 'apiToken')
            $.notify(`${$.name}`, ``, `apiToken已更新`);
        }
    }
    $.done();
}

// 获取玩家信息
async function checkPlayerInfo(){
    if(!$.read('cookies') || $.read('xcsrfToken')){
        $.notify(`${$.name}`, ``, `请更新Token`);
        $.done();
        return false;
    }
    const url = 'https://api.simple-mmo.com/api/main';
    const headers = {
        'Cookie' : `${$.read('cookies')}`,
        'Accept' : `application/json`,
        'Connection' : `keep-alive`,
        'Content-Type' : `application/json`,
        'Accept-Encoding' : `br;q=1.0, gzip;q=0.9, deflate;q=0.8`,
        'Host' : `api.simple-mmo.com`,
        'User-Agent' : `SimpleMMO/1.1.2 (dawsn.SimpleMMO; build:10; iOS 15.6.0) Alamofire/5.5.0`,
        'Accept-Language' : `zh-Hans-CN;q=1.0`
    };
    const body = `{"api_token":"${$.read('apiToken')}"}`;
    const options = {
        url: url,
        headers: headers,
        body: body
    };

    let playerResponse = await $.http.post(options);
    let playerInfoBody = JSON.parse(playerResponse.body);
    let oldBio = await getPlayerBio(playerInfoBody);
    let levelStep = $.read('levelStep') || 100;
    if(playerInfoBody.level%levelStep === 0){
        updatePlayerBio(playerInfoBody, getNewBio(playerInfoBody, oldBio));
        $.read('level')!=playerInfoBody.level && $.notify(`${$.name}`, `玩家：${playerInfoBody.username}`, `${formatPlayerData(playerInfoBody)}\nBio：已更新，请查看日志`, { "media-url": `https://simple-mmo.com${playerInfoBody.avatar}` });
    }
    $.write(playerInfoBody.level, 'level')
    $.done();
}
// 格式化玩家数据
function formatPlayerData(data){
    let map = {
        level: '等级',
        guild: '公会',
        steps: '步数',
        'current_location': '位置',
    }
    let arr = [];
    for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
            let txt = '';
            if(map[key]){
                if(key === 'guild'){
                    txt = data[key]['name'];
                } else if(key === 'current_location'){
                    txt = data[key]['name'];
                } else {
                    txt = data[key];
                }
                arr.push(`${map[key]}：${txt}`);
            }
        }
    }
    return arr.join('\n');
}

// 更新玩家bio信息
async function updatePlayerBio(data, bio){
    const url = `https://simple-mmo.com/user/character/${data.id}/bio/submit`;
    const headers = {
        'Accept' : `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
        'Origin' : `https://simple-mmo.com`,
        'Accept-Encoding' : `gzip, deflate, br`,
        'Cookie' : `${$.read('cookies')}`,
        'Content-Type' : `application/x-www-form-urlencoded`,
        'Host' : `simple-mmo.com`,
        'Connection' : `keep-alive`,
        'User-Agent' : `Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`,
        'Referer' : `https://simple-mmo.com/user/view/${data.id}/bio?new_page_refresh=true`,
        'Accept-Language' : `zh-CN,zh-Hans;q=0.9`
    };
    const body = `_token=${$.read('xcsrfToken')}&content=${bio}`;
    const options = {
        url: url,
        headers: headers,
        body: body
    };

    let response = await $.http.post(options);
    $.log(response)
}

async function getPlayerBio(data){
    const url = `https://www.simple-mmo.com/user/view/${data.id}/bio?new_page_refresh=true`;
    const headers = {
        'Accept' : `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
        'Accept-Encoding' : `gzip, deflate, br`,
        'Connection' : `keep-alive`,
        'User-Agent' : `Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`,
        'Accept-Language' : `zh-CN,zh-Hans;q=0.9`,
        'X-Requested-With': 'dawsn.simplemmo'
    };

    const options = {
        url: url,
        headers: headers,
    };
    let response = await $.http.get(options);
    let domPaser = new DOMParser();
    let dom = domPaser.parseFromString(response.body, 'text/html');
    return dom.querySelector('textarea.app-input').innerHTML;
}

function getNewBio(data, old){
    let news = '';
    let oldArr = [];
    if(old.indexOf('===== LEVEL UP =====') === -1){
        news = `${old}\n===== LEVEL UP =====\n${getDate()} LV${data.level}\n===== UPDATE =====`
    } else {
        let oldStr = /\=\=\=\=\= LEVEL UP \=\=\=\=\=\n([a-zA-Z0-9 \-\r\n:]+)\n(?=\=\=\=\=\= UPDATE \=\=\=\=\=)/ig.exec(old)[1];
        oldArr = oldStr.split(/\n/);
        let newLine = `${getDate()} LV${data.level}`;
        if(oldArr.indexOf(newLine) === -1){
            oldArr.push(newLine)
        }
        news = old.replace(/(\=\=\=\=\= LEVEL UP \=\=\=\=\=\n)([a-zA-Z0-9 \-\r\n:]+)(\n\=\=\=\=\= UPDATE \=\=\=\=\=)/ig, `$1${oldArr.join('\n')}$3`);
    }
    return news;
}

function getDate(){
    let now = new Date();
    let y = now.getFullYear();
    let m = ('0'+ (now.getMonth()+1)).slice(-2);
    let d = ('0'+ now.getDate()).slice(-2)
    return `${y}-${m}-${d}`;
}

function getParamString(params, key){
    let data = new URLSearchParams(params);
    for (const [k, val] of data) {
        if(k === key) return val;
    }
    return ''
}

function ENV() { const e = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: "undefined" != typeof $task, isLoon: "undefined" != typeof $loon, isSurge: "undefined" != typeof $httpClient && "undefined" != typeof $utils, isBrowser: "undefined" != typeof document, isNode: "function" == typeof require && !e, isJSBox: e, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: o, isScriptable: n, isNode: i, isBrowser: r } = ENV(), u = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/; const a = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(h => a[h.toLowerCase()] = (a => (function (a, h) { h = "string" == typeof h ? { url: h } : h; const d = e.baseURL; d && !u.test(h.url || "") && (h.url = d ? d + h.url : h.url), h.body && h.headers && !h.headers["Content-Type"] && (h.headers["Content-Type"] = "application/x-www-form-urlencoded"); const l = (h = { ...e, ...h }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...h.events }; let f, p; if (c.onRequest(a, h), t) f = $task.fetch({ method: a, ...h }); else if (s || o || i) f = new Promise((e, t) => { (i ? require("request") : $httpClient)[a.toLowerCase()](h, (s, o, n) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: n }) }) }); else if (n) { const e = new Request(h.url); e.method = a, e.headers = h.headers, e.body = h.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } else r && (f = new Promise((e, t) => { fetch(h.url, { method: a, headers: h.headers, body: h.body }).then(e => e.json()).then(t => e({ statusCode: t.status, headers: t.headers, body: t.data })).catch(t) })); const y = l ? new Promise((e, t) => { p = setTimeout(() => (c.onTimeout(), t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)), l) }) : null; return (y ? Promise.race([y, f]).then(e => (clearTimeout(p), e)) : f).then(e => c.onResponse(e)) })(h, a))), a } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: o, isSurge: n, isNode: i, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (i) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (o || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), i) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (o || n) && $persistentStore.write(e, this.name), i && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || o) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); i && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || o ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : i ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || o) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); i && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", a = "", h = {}) { const d = h["open-url"], l = h["media-url"]; if (s && $notify(e, t, a, h), n && $notification.post(e, t, a + `${l ? "\n多媒体:" + l : ""}`, { url: d }), o) { let s = {}; d && (s.openUrl = d), l && (s.mediaUrl = l), "{}" === JSON.stringify(s) ? $notification.post(e, t, a) : $notification.post(e, t, a, s) } if (i || u) { const s = a + (d ? `\n点击跳转: ${d}` : "") + (l ? `\n多媒体: ${l}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || o || n ? $done(e) : i && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
