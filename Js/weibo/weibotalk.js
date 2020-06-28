/**********

  🐬主要作者：Evilbutcher （签到、cookie等主体逻辑编写）
  📕地址：https://github.com/evilbutcher

  🐬次要作者: toulanboy （细节完善，支持多平台）
  📕地址：https://github.com/toulanboy/scripts

  🐬 另，感谢@Seafun、@jaychou、@MEOW帮忙测试及提供建议。

  @evilbutcher:非专业人士制作，头一次写签到脚本，感谢@柠檬精帮忙调试代码、感谢@Seafun、@jaychou、@MEOW帮忙测试及提供建议，感谢@chavyleung模版。
  
  📌不定期更新各种签到、有趣的脚本，欢迎star🌟

  *************************
  【配置步骤，请认真阅读】
  *************************
  1. 根据你当前的软件，配置好srcipt。 Tips:由于是远程文件，记得顺便更新文件。
  2. 打开微博APP，"我的"， "超话社区"， "底部栏--我的"， "关注"， 弹出通知，提示获取已关注超话链接成功。
  3. 点进一个超话页面，手动签到一次，弹出通知，提示获取超话签到链接成功。 若之前所有已经签到，请关注一个新超话进行签到。
  4.点开底部栏"关注"，上面切换到"关注"，下拉，提示获取超话签到状态成功。
  5. 回到quanx等软件，关掉获取cookie的rewrite。（loon是关掉获取cookie的脚本）
  提示：如果超话过多提示频繁，可间隔一个小时再执行一次。

  *************************
  【Surge 4.2+ 脚本配置】
  *************************
  微博超话cookie获取 = type=http-request,pattern=^https:\/\/api\.weibo\.cn\/2\/(cardlist|page\/button|page),script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.cookie.js,requires-body=false
  微博超话 = type=cron,cronexp="5 0  * * *",script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.js,wake-system=true,timeout=600

  [MITM]
  hostname = api.weibo.cn

  *************************
  【Loon 2.1+ 脚本配置】
  *************************
  [script]
  cron "5 0 * * *" script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.js, timeout=600, tag=微博超话
  http-request ^https:\/\/api\.weibo\.cn\/2\/(cardlist|page\/button|page) script-path=https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.cookie.js,requires-body=false, tag=微博超话cookie获取
  
  [MITM]
  hostname = api.weibo.cn

  *************************
  【 QX 1.0.10+ 脚本配置 】 
  *************************
  [rewrite_local]
  ^https:\/\/api\.weibo\.cn\/2\/(cardlist|page\/button|page) url script-request-header https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.cookie.js

  [task]
  5 0 * * * https://raw.githubusercontent.com/toulanboy/scripts/master/weibo/weibotalk.js, tag=微博超话

  [MITM]
  hostname = api.weibo.cn

*********/

const $ = new Env("微博超话");
const deletecookie = false; //如果需要清楚Cookie请改为true，清除后改为false
const debugurl = false;
const debugstatus = false;
const debugcheckin = false;
const tokenurl = "evil_tokenurl";
const tokencheckinurl = "evil_tokencheckinurl";
const tokenheaders = "evil_tokenheaders";
const tokensinceurl = "evil_tokensinceurl";
const tokensinceheaders = "evil_tokensinceheaders";
const tokencheckinheaders = "evil_tokencheckinheaders";

var wait = 1000; //签到间隔默认1s
var allnumber;
var pagenumber;
var listurl = $.getdata(tokenurl);
var listheaders = $.getdata(tokenheaders);
var checkinurl = $.getdata(tokencheckinurl);
var checkinheaders = $.getdata(tokencheckinheaders);
var sinceurl = $.getdata(tokensinceurl);
var sinceheaders = $.getdata(tokensinceheaders);
$.message = [];
$.name_list = [];
$.id_list = [];
$.sign_status = [];
$.sinceinserturl = [];
$.msg_max_num = 30;
$.successNum = 0;
$.failNum = 0;

!(async () => {
  if (deletecookie) {
    $.setdata("", tokenurl);
    $.setdata("", tokenheaders);
    $.setdata("", tokencheckinurl);
    $.setdata("", tokencheckinheaders);
    $.setdata("", tokensinceurl);
    $.setdata("", tokensinceheaders);
    $.msg("微博超话", "", "Cookie清除成功✅");
    return;
  }
  if (
    listurl == undefined ||
    listheaders == undefined ||
    checkinurl == undefined ||
    checkinheaders == undefined ||
    sinceurl == undefined ||
    sinceheaders == undefined ||
    listurl == "" ||
    listheaders == "" ||
    checkinurl == "" ||
    checkinheaders == "" ||
    sinceurl == "" ||
    sinceheaders == ""
  ) {
    $.msg(
      `微博超话`,
      "",
      `🚫检测到没有cookie或者cookie不完整。\n🚫请认真阅读配置流程，并重新获取cookie。`
    );
    return;
  }
  await getnumber();
  var firsturl = sinceurl.replace(
    new RegExp("&since_id=.*?&moduleID"),
    "&moduleID"
  );
  $.sinceinserturl.push(firsturl);
  for (var i = 0; i <= pagenumber - 2; i++) {
    await geturl(i);
  }
  for (i = 0; i < pagenumber; i++) {
    await getSignStatus(i);
  }
  for (i in $.name_list) {
    await checkin($.id_list[i], $.name_list[i], $.sign_status[i]);
    $.wait(wait);
  }
  output();
})()
  .catch(e => {
    $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
  })
  .finally(() => {
    $.done();
  });

function output() {
  $.this_msg = ``;
  for (var i = 0; i < $.message.length; ++i) {
    if (i && i % $.msg_max_num == 0) {
      $.msg(
        `${$.name}: 成功${$.successNum}个，失败${$.failNum}个`,
        `当前第${parseInt(i / $.msg_max_num)}页，共${parseInt(
          $.message.length / $.msg_max_num
        ) + 1}页`,
        $.this_msg
      );
      $.this_msg = "";
    }
    $.this_msg += `${$.message[i]}\n`;
  }
  if ($.message.length % $.msg_max_num != 0) {
    $.msg(
      `${$.name}: 成功${$.successNum}个，失败${$.failNum}个`,
      `当前第${parseInt(i / $.msg_max_num) + 1}页，共${parseInt(
        $.message.length / $.msg_max_num
      ) + 1}页`,
      $.this_msg
    );
  }
}

function getnumber() {
  console.log("正在刷新链接");
  return new Promise(resolve => {
    var idrequest = {
      url: listurl,
      header: listheaders
    };
    $.get(idrequest, (error, response, data) => {
      var body = response.body;
      var obj = JSON.parse(body);
      if (debugurl) console.log(obj);
      allnumber = obj.cardlistInfo.total;
      console.log(
        "当前已关注超话" +
          allnumber +
          "个(数量存在延迟，仅参考，以签到执行为准)"
      );
      pagenumber = Math.ceil(allnumber / 20);
      resolve();
    });
  });
}

function geturl(i) {
  var j = i + 2;
  var getlisturl = listurl.replace(
    new RegExp("&page=.*?&"),
    "&page=" + j + "&"
  );
  if (debugurl) console.log(getlisturl);
  var idrequest = {
    url: getlisturl,
    header: listheaders
  };
  $.get(idrequest, (error, response, data) => {
    var body = response.body;
    var obj = JSON.parse(body);
    var group = obj.cards[0]["card_group"];
    var insertid = group[0].scheme.slice(33, 71);
    if (debugurl) console.log(insertid);
    var inserturl = sinceurl
      .replace(
        new RegExp("follow%22%3A%221022%3A.*?%22"),
        "follow%22%3A%221022%3A" + insertid + "%22"
      )
      .replace(new RegExp("page%22%3A.*?%7D"), "page%22%3A" + j + "%7D");
    $.sinceinserturl.push(inserturl);
    if (debugurl) console.log($.sinceinserturl);
  });
}

function getSignStatus(i) {
  if (debugstatus) console.log("第" + i + "个 " + $.sinceinserturl[i]);
  var sincerequest = {
    url: $.sinceinserturl[i],
    header: sinceheaders
  };
  return new Promise(resolve => {
    $.get(sincerequest, (error, response, data) => {
      if (response.statusCode == 418) {
        $.message.push(`太频繁啦，获取第${i}页超话及签到状态失败`);
      } else {
        var body = response.body;
        var obj = JSON.parse(body);
        var group = obj.cards[0]["card_group"];
        for (var j = 0; j < group.length; j++) {
          var name = group[j]["title_sub"];
          if (name == undefined) {
            continue;
          }
          $.name_list.push(name);
          var status = group[j].buttons[0].name;
          if (status == "签到") {
            console.log(`${name} 未签到`);
            $.sign_status.push(false);
          } else {
            console.log(`${name} 已签到`);
            $.sign_status.push(true);
          }
          var id = group[j].scheme.slice(33, 71);
          $.id_list.push(id);
        }
        if (debugstatus) {
          console.log($.name_list);
          console.log($.sign_status);
          console.log($.id_list);
        }
      }
      resolve();
    });
  });
}

//签到
function checkin(id, name, isSign = false) {
  var idname = name.replace(/超话/, "");
  if (isSign == true) {
    $.successNum += 1;
    $.message.push(`【${idname}】：✨今天已签到`);
    console.log(`【${idname}】执行签到：跳过`);
    return;
  }
  var sendcheckinurl = checkinurl
    .replace(new RegExp("&fid=.*?&"), "&fid=" + id + "&")
    .replace(new RegExp("pageid%3D.*?%26"), "pageid%3D" + id + "%26");
  var checkinrequest = {
    url: sendcheckinurl,
    header: checkinheaders
  };
  return new Promise(resolve => {
    $.get(checkinrequest, (error, response, data) => {
      if (debugcheckin) console.log(response);
      if (response.statusCode == 418) {
        $.failNum += 1;
        $.message.push(`【${idname}】：太频繁啦，请稍后再试`);
        console.log(`【${idname}】执行签到：太频繁啦，请稍后再试`);
      } else {
        var body = response.body;
        var obj = JSON.parse(body);
        if (debugcheckin) console.log(obj);
        var result = obj.result;
        if (debugcheckin) console.log(result);
        if (result == 1 || result == 382004) {
          $.successNum += 1;
        } else {
          $.failNum += 1;
        }
        if (result == 1) {
          $.message.push(`【${idname}】：✅${obj.button.name}`);
          console.log(`【${idname}】执行签到：${obj.button.name}`);
        } else if (result == 382004) {
          $.message.push(`【${idname}】：✨今天已签到`);
          console.log(`【${idname}】执行签到：${obj.error_msg}`);
        } else if (result == 388000) {
          $.message.push(`【${idname}】：需要拼图验证⚠️`);
          console.log(`【${idname}】执行签到：需要拼图验证⚠️`);
          if (debugcheckin) console.log(response);
        } else if (result == 382010) {
          $.message.push(`【${idname}】：超话不存在⚠️`);
          console.log(`【${idname}】执行签到：超话不存在⚠️`);
          if (debugcheckin) console.log(response);
        } else if (obj["errno"] == -100) {
          $.message.push(`【${idname}】：签到失败，请重新签到获取Cookie⚠️`);
          console.log(
            `【${idname}】执行签到：签到失败，请重新签到获取Cookie⚠️`
          );
          if (debugcheckin) console.log(response);
        } else {
          $.message.push(`【${idname}】：未知错误⚠️`);
          console.log(`【${idname}】执行签到：未知错误⚠️`);
          console.log(response);
        }
      }
      resolve();
    });
  });
}

//chavyleung
function Env(s) {
  (this.name = s),
    (this.data = null),
    (this.logs = []),
    (this.isSurge = () => "undefined" != typeof $httpClient),
    (this.isQuanX = () => "undefined" != typeof $task),
    (this.isNode = () => "undefined" != typeof module && !!module.exports),
    (this.log = (...s) => {
      (this.logs = [...this.logs, ...s]),
        s ? console.log(s.join("\n")) : console.log(this.logs.join("\n"));
    }),
    (this.msg = (s = this.name, t = "", i = "") => {
      this.isSurge() && $notification.post(s, t, i),
        this.isQuanX() && $notify(s, t, i);
      const e = [
        "",
        "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="
      ];
      s && e.push(s), t && e.push(t), i && e.push(i), console.log(e.join("\n"));
    }),
    (this.getdata = s => {
      if (this.isSurge()) return $persistentStore.read(s);
      if (this.isQuanX()) return $prefs.valueForKey(s);
      if (this.isNode()) {
        const t = "box.dat";
        return (
          (this.fs = this.fs ? this.fs : require("fs")),
          this.fs.existsSync(t)
            ? ((this.data = JSON.parse(this.fs.readFileSync(t))), this.data[s])
            : null
        );
      }
    }),
    (this.setdata = (s, t) => {
      if (this.isSurge()) return $persistentStore.write(s, t);
      if (this.isQuanX()) return $prefs.setValueForKey(s, t);
      if (this.isNode()) {
        const i = "box.dat";
        return (
          (this.fs = this.fs ? this.fs : require("fs")),
          !!this.fs.existsSync(i) &&
            ((this.data = JSON.parse(this.fs.readFileSync(i))),
            (this.data[t] = s),
            this.fs.writeFileSync(i, JSON.stringify(this.data)),
            !0)
        );
      }
    }),
    (this.wait = (s, t = s) => i =>
      setTimeout(() => i(), Math.floor(Math.random() * (t - s + 1) + s))),
    (this.get = (s, t) => this.send(s, "GET", t)),
    (this.post = (s, t) => this.send(s, "POST", t)),
    (this.send = (s, t, i) => {
      if (this.isSurge()) {
        const e = "POST" == t ? $httpClient.post : $httpClient.get;
        e(s, (s, t, e) => {
          t && ((t.body = e), (t.statusCode = t.status)), i(s, t, e);
        });
      }
      this.isQuanX() &&
        ((s.method = t),
        $task.fetch(s).then(
          s => {
            (s.status = s.statusCode), i(null, s, s.body);
          },
          s => i(s.error, s, s)
        )),
        this.isNode() &&
          ((this.request = this.request ? this.request : require("request")),
          (s.method = t),
          (s.gzip = !0),
          this.request(s, (s, t, e) => {
            t && (t.status = t.statusCode), i(null, t, e);
          }));
    }),
    (this.done = (s = {}) => (this.isNode() ? null : $done(s)));
}
