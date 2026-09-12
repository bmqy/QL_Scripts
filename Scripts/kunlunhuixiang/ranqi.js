/**
 * 中国石油燃气余额查询（Quantumult X）
 *
 * 功能：
 * 1. 访问燃气小程序/H5 时，自动抓取 getDebt4Wsyyt 请求里的 Authorization、userCode、mdmCode；
 * 2. 请求参数写入 BoxJS 持久化存储；
 * 3. 定时任务从 BoxJS 读取参数查询余额。
 *
 * BoxJS：将同目录的 ranqi.boxjs.json 添加为订阅。
 * 请求捕获规则（建议监听整个站点，再由脚本筛选）：
 * ^https?:\\/\\/bol\\.grs\\.petrochina\\.com\\.cn\\/ url script-request-header ranqi.js
 */

const $ = new Env('燃气余额');
const API = 'https://bol.grs.petrochina.com.cn/retail/preservice/gasFeePay/getDebt4Wsyyt';
const KEY = {
  authorization: 'ranqi_authorization',
  userCode: 'ranqi_userCode',
  mdmCode: 'ranqi_mdmCode',
  notify: 'ranqi_notify'
};

(async () => {
  try {
    if (typeof $request !== 'undefined' && $request && $request.url) {
      await captureRequest();
    } else {
      await queryBalance();
    }
  } catch (e) {
    $.logErr(e);
    $.msg('燃气余额', '', `执行失败：${e.message || e}`);
  } finally {
    $done();
  }
})();

function header(headers, name) {
  if (!headers) return '';
  const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key] || '') : '';
}

function queryValue(url, name) {
  const m = String(url || '').match(new RegExp(`[?&]${name}=([^&#]*)`, 'i'));
  return m ? decodeURIComponent(m[1]) : '';
}

function maskUserCode(value) {
  const text = String(value || '');
  if (!text) return '--';
  if (text.length <= 2) return '*'.repeat(text.length);
  if (text.length <= 4) return `${text.slice(0, 1)}${'*'.repeat(text.length - 2)}${text.slice(-1)}`;
  return `${text.slice(0, 3)}${'*'.repeat(text.length - 5)}${text.slice(-2)}`;
}

function save(key, value) {
  if (value !== undefined && value !== null && String(value).trim()) {
    $.setdata(String(value).trim(), key);
  }
}

async function captureRequest() {
  const requestURL = String($request.url || '');
  if (!/bol\.grs\.petrochina\.com\.cn/i.test(requestURL)) return;

  // 新版 H5 接口：Authorization + URL 中的 userCode/mdmCode
  const isDebtRequest = /getDebt4Wsyyt/i.test(requestURL);
  // 兼容旧版接口，避免页面升级后规则看似触发但脚本无反应
  const isLegacyRequest = /getUserDebtByUserCode/i.test(requestURL);
  if (!isDebtRequest && !isLegacyRequest) return;

  const authorization = header($request.headers, 'Authorization');
  const userCode = queryValue(requestURL, 'userCode') || bodyValue($request.body, 'userCode');
  const mdmCode = queryValue(requestURL, 'mdmCode');

  if (!authorization || !userCode || !mdmCode) {
    $.log(`已触发燃气接口，但字段不完整：Authorization=${!!authorization}, userCode=${!!userCode}, mdmCode=${!!mdmCode}`);
    $.msg('燃气捕获提示', '', '已触发燃气接口，但缺少必要字段；请查看 Quantumult X 日志确认实际请求接口');
    return;
  }

  save(KEY.authorization, authorization);
  save(KEY.userCode, userCode);
  save(KEY.mdmCode, mdmCode);
  $.msg('燃气参数已更新', '', `户号：${maskUserCode(userCode)}\n表号：${mdmCode}`);
  $.log('已将燃气请求必要参数写入 BoxJS');
}

function bodyValue(body, name) {
  if (!body) return '';
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  try {
    const obj = JSON.parse(text);
    return obj && obj[name] !== undefined ? String(obj[name]) : '';
  } catch (_) {
    const m = text.match(new RegExp(`(?:["']?${name}["']?)\\s*[:=]\\s*["']?([^,}&"']+)`, 'i'));
    return m ? m[1] : '';
  }
}

async function queryBalance() {
  const authorization = $.getdata(KEY.authorization);
  const userCode = $.getdata(KEY.userCode);
  const mdmCode = $.getdata(KEY.mdmCode);
  const notify = String($.getdata(KEY.notify) || 'true') !== 'false';

  if (!authorization || !userCode || !mdmCode) {
    $.msg('燃气余额', '', '未找到参数，请先访问一次燃气小程序/H5，等待自动抓取请求参数');
    return;
  }

  const resp = await $task.fetch({
    url: `${API}?userCode=${encodeURIComponent(userCode)}&mdmCode=${encodeURIComponent(mdmCode)}`,
    method: 'GET',
    headers: {
      Authorization: authorization,
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://bol.grs.petrochina.com.cn/retail/h5/',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0'
    }
  });

  if (resp.statusCode !== 200) throw new Error(`HTTP ${resp.statusCode}`);
  const res = JSON.parse(resp.body || '{}');
  const data = res.data || {};
  const ok = res.code === 200 && data.respCode === '0000';

  if (!ok) {
    $.msg('燃气余额', '', `查询失败：${res.msg || data.respDesc || '未知错误'}\n如提示未授权，请重新访问小程序抓取参数`);
    return;
  }

  const title = `户号：${maskUserCode(userCode)}`;
  const detail = [
    `余额：${data.remoteMeterBalance ?? data.endBalance ?? '--'}`,
    `最近读数：${data.readingLastTime ?? '--'}`,
    `通讯时间：${data.remoteMeterLastCommunicationTime ?? '--'}`,
    data.oweAmount && data.oweAmount !== '0.00' ? `欠费：${data.oweAmount}` : ''
  ].filter(Boolean).join('\n');

  if (notify) $.notify('燃气信息', title, detail);
  $.log(detail);
}

function Env(name) {
  this.name = name;
  this.getdata = (key) => {
    if (typeof $prefs !== 'undefined') return $prefs.valueForKey(key);
    if (typeof $persistentStore !== 'undefined') return $persistentStore.read(key);
    return '';
  };
  this.setdata = (value, key) => {
    if (typeof $prefs !== 'undefined') return $prefs.setValueForKey(value, key);
    if (typeof $persistentStore !== 'undefined') return $persistentStore.write(value, key);
    return false;
  };
  this.notify = (title, subtitle, message) => {
    if (typeof $notify !== 'undefined') return $notify(title, subtitle, message);
    if (typeof $notification !== 'undefined') return $notification.post(title, subtitle, message);
  };
  this.msg = this.notify;
  this.log = (...args) => console.log(`[${name}]`, ...args);
  this.logErr = (e) => console.log(`[${name}]`, e && e.stack ? e.stack : e);
}
