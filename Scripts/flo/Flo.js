/*
项目名称：女性日记Flo 9.38
下载地址：https://apps.apple.com/cn/app/%E5%A5%B3%E6%80%A7%E6%97%A5%E8%AE%B0flo/id1038369065
脚本作者：@ios151
使用声明：⚠️仅供参考，🈲转载与售卖！
使用说明：开脚本进软件
**************************************
[rewrite_local]
^https:\/\/api\.owhealth\.com\/subscriptions\/v1\/apple url script-response-body Scripts/Flo.js
[mitm]
hostname = api.owhealth.com
*/
var responseData = {
  "status": "active",
  "transaction_id": 190001670857044,
  "service_level": 2,
  "expiration_date": "5201-03-14T23:59:59Z",
  "auto_renew_status": true,
  "features": [],
  "subscription_manager": "https://t.me/ios151"
};

$done({
  body: JSON.stringify(responseData)
});
