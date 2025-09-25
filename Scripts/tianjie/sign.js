/*
天街微信小程序签到脚本

更新时间: 2024-09-24 11:57:44
脚本兼容: QuantumultX、Loon、Surge
使用 Peng-YM OpenAPI 实现跨平台兼容
使用 BoxJs 管理隐私数据
https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI

说明：
打开天街微信小程序->签到积分，如通知成功获取token, 则可以使用此续期脚本.
获取token后, 请将获取token禁用并移除主机名，以免产生不必要的MITM.

脚本将在每天10:11执行。 您可以修改执行时间。
*/

// 初始化 OpenAPI
const $ = new API("TianJieSign", false);

const ScriptTitle = '天街微信小程序签到';
const ScriptParamPrefix = 'tianjieSign';
const ScriptHeaderParam = {
    'X-Longfor-StoreId': 'StoreId',
    'token': 'token',
    'userkey': 'userkey',
    'X-Gaia-Api-Key': 'ApiKey',
};
const ScriptBodyParam = {
    'projectId': 'projectId'
};

const date = new Date();
if ($.env.isRequest) {
  GetParameter();
} else {
  sign();
}

function sign() {
  // 读取配置
  const StoreId = $.read(ScriptHeaderParam['X-Longfor-StoreId']);
  const userkey = $.read(ScriptHeaderParam['userkey']);
  const ApiKey = $.read(ScriptHeaderParam['X-Gaia-Api-Key']);
  const token = $.read(ScriptHeaderParam['token']);
  const projectId = $.read(ScriptBodyParam["projectId"]);
  
  // 检查必要的配置是否存在
  if (!StoreId || !token || !userkey || !ApiKey || !projectId) {
    $.notify(ScriptTitle, '配置错误', '请在BoxJs中填写完整的配置信息');
    $.done();
    return;
  }
  
  const options = {
    url: 'https://c2-openapi.longfor.com/riyuehu-miniapp-service-prod/ryh/sign/submit',
    headers: {
      'Content-Type' : "application/json",
      'X-Longfor-StoreId' : StoreId,
      'userkey': userkey,
      'User-Agent': "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/7.0.18(0x17001231) NetType/WIFI Language/zh_CN",
      'X-Gaia-Api-Key' : ApiKey,
      'token': token,
    },
    body: `{"data":{"projectId":"${projectId}"}}`
  };
  
  $.log("开始发送签到请求");
  $.http.post(options).then(response => {
    const data = JSON.parse(response.body);
    
    if (data && data.code) {
      if(data.code == 10000){
        $.notify(ScriptTitle, "", date.getMonth() + 1 + "月" + date.getDate() + "日, 获得："+ data.data.rewardBonusTotal +" 积分 🎉")
      } else if(data.code == 30020){
        $.notify(ScriptTitle, "", data.msg +" ‼️")
      } else {
        $.notify(ScriptTitle, "", "签到失败："+ data.msg +" ‼️‼️")
      }
    } else {
      $.notify(ScriptTitle, "", "脚本待更新 ‼️‼️")
    }
  }).catch(error => {
    $.error(`签到请求失败: ${error}`);
    $.notify(ScriptTitle, "请求失败 ‼️‼️", error.message || '未知错误');
  }).finally(() => {
    $.done();
  });
}


function GetParameter() {
  try {
    if ($request.headers && $request.url.match(/sign\/calendar/)) {
      const aParam = [];
      let reWrite = false;
      for(let k in ScriptHeaderParam){
        const reqHeaderParam = $request.headers[k];
        const ScriptHeaderParamKey = `${ScriptParamPrefix}-${ScriptHeaderParam[k]}`;
        if (reqHeaderParam && $.read(ScriptHeaderParamKey) != reqHeaderParam) {
          reWrite = true;
          $.log(`更新${ScriptHeaderParamKey}`);
          const writeResult = $.write(reqHeaderParam, ScriptHeaderParamKey);
          if (!writeResult) {
            aParam.push(ScriptHeaderParamKey);
          }
        }
      }
      
      if(reWrite){
        if(aParam.length == 0){
          $.notify("", "", "写入" + ScriptTitle + "token成功 🎉");
        } else {
          $.notify("", "", "写入" + ScriptTitle + "token失败："+ aParam.join('、') +" ‼️");
        }
      }
    }  
  } catch (eor) {
    $.error(`获取token失败: ${eor}`);
    $.notify(ScriptTitle + "写入token失败", "", "错误"+ JSON.stringify(eor) +" ‼️")
  }

  try {
    if ($request.body && $request.url.match(/sign\/today\/info\/query/)) {
      const reqBody = JSON.parse($request.body);
      if (reqBody && reqBody.data) {
        const projectId = reqBody.data.projectId;
        const projectKey = `${ScriptParamPrefix}-${ScriptBodyParam['projectId']}`;        
        if (projectId && $.read(projectKey) != projectId) {
          const writeResult = $.write(projectId, projectKey);
          if (!writeResult) {
            $.notify("", "", "写入" + ScriptTitle + "项目参数失败 ‼️");
          } else {
            $.notify("", "", "写入" + ScriptTitle + "项目参数成功 🎉");
          }
        }
      }
    }  
  } catch (eor) {
    $.error(`获取项目参数失败: ${eor}`);
    $.notify(ScriptTitle + "写入项目参数失败", "", "错误"+ JSON.stringify(eor) +" ‼️")
  }
  $.done();
}

// OpenAPI 核心代码 - Peng-YM 压缩版
function ENV() { const e = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: "undefined" != typeof $task, isLoon: "undefined" != typeof $loon, isSurge: "undefined" != typeof $httpClient && "undefined" != typeof $utils, isBrowser: "undefined" != typeof document, isNode: "function" == typeof require && !e, isJSBox: e, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: o, isScriptable: n, isNode: i, isBrowser: r } = ENV(), u = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/; const a = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(h => a[h.toLowerCase()] = (a => (function (a, h) { h = "string" == typeof h ? { url: h } : h; const d = e.baseURL; d && !u.test(h.url || "") && (h.url = d ? d + h.url : h.url), h.body && h.headers && !h.headers["Content-Type"] && (h.headers["Content-Type"] = "application/x-www-form-urlencoded"); const l = (h = { ...e, ...h }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...h.events }; let f, p; if (c.onRequest(a, h), t) f = $task.fetch({ method: a, ...h }); else if (s || o || i) f = new Promise((e, t) => { (i ? require("request") : $httpClient)[a.toLowerCase()](h, (s, o, n) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: n }) }) }); else if (n) { const e = new Request(h.url); e.method = a, e.headers = h.headers, e.body = h.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } else r && (f = new Promise((e, t) => { fetch(h.url, { method: a, headers: h.headers, body: h.body }).then(e => e.json()).then(t => e({ statusCode: t.status, headers: t.headers, body: t.data })).catch(t) })); const y = l ? new Promise((e, t) => { p = setTimeout(() => (c.onTimeout(), t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)), l) }) : null; return (y ? Promise.race([y, f]).then(e => (clearTimeout(p), e)) : f).then(e => c.onResponse(e)) })(h, a))), a } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: o, isSurge: n, isNode: i, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (i) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (o || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), i) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (o || n) && $persistentStore.write(e, this.name), i && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || o) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); i && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || o ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : i ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || o) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); i && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", a = "", h = {}) { const d = h["open-url"], l = h["media-url"]; if (s && $notify(e, t, a, h), n && $notification.post(e, t, a + `${l ? "\n多媒体:" + l : ""}`, { url: d }), o) { let s = {}; d && (s.openUrl = d), l && (s.mediaUrl = l), "{}" === JSON.stringify(s) ? $notification.post(e, t, a) : $notification.post(e, t, a, s) } if (i || u) { const s = a + (d ? `\n点击跳转: ${d}` : "") + (l ? `\n多媒体: ${l}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || o || n ? $done(e) : i && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
