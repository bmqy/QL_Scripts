/*
小鸡模拟器存档续期脚本

更新时间: 2024-09-24 16:08
脚本兼容: QuantumultX、Loon、Surge
使用 Peng-YM OpenAPI 实现跨平台兼容
使用 BoxJs 管理隐私数据
https://github.com/Peng-YM/QuanX/tree/master/Tools/OpenAPI

说明：
打开小鸡模拟器->管理->存档管理，如通知成功获取续期参数, 则可以使用此续期脚本.
获取续期参数后, 请将获取续期参数禁用并移除主机名，以免产生不必要的MITM.

脚本将在每月1号、15号7点执行。 您可以修改执行时间。
*/

// 初始化 OpenAPI
const $ = new API("XiaoJiMNQ", false);

const ScriptTitle = '小鸡模拟器存档续期';
const CookieKey = 'CookieXJMNQRenew';

const date = new Date();
if ($.env.isRequest) {
    GetRenewParameter();
} else {
    renew();
}

function renew() {
  // 读取配置
  const configStr = $.read(CookieKey);
  if (!configStr) {
    $.notify(ScriptTitle, "配置错误", "未找到续期参数，请先通过重写获取参数");
    $.log("未找到续期参数");
    $.done();
    return;
  }
  
  try {
    const data = parseJsonstr2FormData(configStr);
    
    const bonus = {
      url: 'http://client.xiaoji001.com/clientapi/',
      body: data,
      headers: {
        Cookie: 'think_language=zh-Hans-CN',
        'User-Agent': 'Chick/1.5.8beta (iPhone; iOS 13.4.1; Scale/3.00)',
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Accept-Language': 'zh-Hans-CN;q=1'
      }
    };
    
    $.post(bonus).then(res => {
      const data = JSON.parse(res.body);
      if (data && data.status) {
        $.notify(ScriptTitle, "", `${date.getMonth() + 1}月${date.getDate()}日, 成功 🎉`);
        $.log(`续期成功: ${JSON.stringify(data)}`);
      } else {
        $.notify(ScriptTitle, "", "脚本待更新 ‼️‼️");
        $.error(`续期失败: ${JSON.stringify(data)}`);
      }
    }).catch(error => {
      $.notify(ScriptTitle, "请求失败 ‼️‼️", error.message || error);
      $.error(`请求失败: ${error.message || error}`);
    }).finally(() => {
      $.done();
    });
  } catch (error) {
    $.notify(ScriptTitle, "执行错误", error.message || "未知错误");
    $.error(`执行错误: ${error.message || error}`);
    $.done();
  }
}


function GetRenewParameter() {
  try {
    if ($.request.body && $.request.url.match(/client\.xiaoji001\.com/)) {
      const data = parseFormData2Json($.request.body);
      
      if(data && data.ticket){
        const CookieValue = {
          action: 'archive_renew',
          'clientparams':'1.5.8beta|13.4.1|zh|iPhone9,2|414*736|ios1.1|webTB21',
          model: 'appstore',
          uid: data.uid,
          ticket: data.ticket,
        };
        
        const currentValue = $.read(CookieKey);
        if (currentValue) {
          if (currentValue !== JSON.stringify(CookieValue)) {
            const result = $.write(JSON.stringify(CookieValue), CookieKey);
            if (!result) {
              $.notify(ScriptTitle, "更新失败", "参数更新失败 ‼️");
              $.error(`参数更新失败: ${JSON.stringify(CookieValue)}`);
            } else {
              $.notify(ScriptTitle, "更新成功", "参数已更新 🎉");
              $.log(`参数已更新: ${JSON.stringify(CookieValue)}`);
            }
          } else {
            $.log("参数未变更，无需更新");
          }
        } else {
          const result = $.write(JSON.stringify(CookieValue), CookieKey);
          if (!result) {
            $.notify(ScriptTitle, "写入失败", "首次写入参数失败 ‼️");
            $.error(`首次写入参数失败: ${JSON.stringify(CookieValue)}`);
          } else {
            $.notify(ScriptTitle, "写入成功", "首次写入参数成功 🎉");
            $.log(`首次写入参数成功: ${JSON.stringify(CookieValue)}`);
          }
        }
      } else {
        $.log("未找到有效的ticket参数");
      }
    } else {
      $.notify(ScriptTitle, "写入参数失败", "请检查匹配URL或配置内脚本类型 ‼️");
      $.error(`请求不匹配: URL=${$.request.url}`);
    }
  } catch (error) {
    $.notify(ScriptTitle, "写入参数失败", `未知错误: ${error.message || error} ‼️`);
    $.error(`写入参数异常: ${error.message || error}`);
  } finally {
    $.done();
  }
}

function parseFormData2Json(str){
  var d = str.split('&');
  var o = {};
  d.forEach((e,i)=>{
    let a = e.split('=');
    o[a[0]] = a[1];
  });
  return o;
}

function parseJsonstr2FormData(str){
  var j = JSON.parse(str);
  var d = '';
  for(let k in j){
    if(d == ''){
      d += k +'='+ j[k];
    } else {
      d += '&'+ k +'='+ j[k];
    }
  }  
  return d;
}

// OpenAPI 核心代码 - Peng-YM 压缩版
function ENV() { const e = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: "undefined" != typeof $task, isLoon: "undefined" != typeof $loon, isSurge: "undefined" != typeof $httpClient && "undefined" != typeof $utils, isBrowser: "undefined" != typeof document, isNode: "function" == typeof require && !e, isJSBox: e, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: o, isScriptable: n, isNode: i, isBrowser: r } = ENV(), u = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/; const a = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(h => a[h.toLowerCase()] = (a => (function (a, h) { h = "string" == typeof h ? { url: h } : h; const d = e.baseURL; d && !u.test(h.url || "") && (h.url = d ? d + h.url : h.url), h.body && h.headers && !h.headers["Content-Type"] && (h.headers["Content-Type"] = "application/x-www-form-urlencoded"); const l = (h = { ...e, ...h }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...h.events }; let f, p; if (c.onRequest(a, h), t) f = $task.fetch({ method: a, ...h }); else if (s || o || i) f = new Promise((e, t) => { (i ? require("request") : $httpClient)[a.toLowerCase()](h, (s, o, n) => { s ? t(s) : e({ statusCode: o.status || o.statusCode, headers: o.headers, body: n }) }) }); else if (n) { const e = new Request(h.url); e.method = a, e.headers = h.headers, e.body = h.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } else r && (f = new Promise((e, t) => { fetch(h.url, { method: a, headers: h.headers, body: h.body }).then(e => e.json()).then(t => e({ statusCode: t.status, headers: t.headers, body: t.data })).catch(t) })); const y = l ? new Promise((e, t) => { p = setTimeout(() => (c.onTimeout(), t(`${a} URL: ${h.url} exceeds the timeout ${l} ms`)), l) }) : null; return (y ? Promise.race([y, f]).then(e => (clearTimeout(p), e)) : f).then(e => c.onResponse(e)) })(h, a))), a } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: o, isSurge: n, isNode: i, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (i) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (o || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), i) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (o || n) && $persistentStore.write(e, this.name), i && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || o) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); i && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || o ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : i ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || o) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); i && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", a = "", h = {}) { const d = h["open-url"], l = h["media-url"]; if (s && $notify(e, t, a, h), n && $notification.post(e, t, a + `${l ? "\n多媒体:" + l : ""}`, { url: d }), o) { let s = {}; d && (s.openUrl = d), l && (s.mediaUrl = l), "{}" === JSON.stringify(s) ? $notification.post(e, t, a) : $notification.post(e, t, a, s) } if (i || u) { const s = a + (d ? `\n点击跳转: ${d}` : "") + (l ? `\n多媒体: ${l}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || o || n ? $done(e) : i && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }
