
export default class NetTool {
    static get(url: string, data: any, handler: Function, failhandler: Function = null) {
        var xhr = new XMLHttpRequest();
        if (data) {
            var str = "?";
            for (var k in data) {
                if (str != "?") {
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            url += encodeURI(str);
        }
        console.log(url);
        xhr.open("GET", url, true);
        xhr.timeout = 10000;

        xhr.onload = () => {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                if (xhr.responseText == "" && !handler) return;//打点没有返回
                var ret = JSON.parse(xhr.responseText);

                if (handler) {
                    handler(ret);
                }
            } else {
                xhr.abort();
            }
        };

        xhr.ontimeout = (e) => {
            console.log("ontimeout", e);
            if (failhandler)
                failhandler();
        };

        xhr.onabort = (e) => {
            console.log("onabort", e);
            if (failhandler)
                failhandler();
        };

        xhr.onerror = (e) => {
            console.log("onerror", e);
            if (failhandler)
                failhandler();
        }
        xhr.send();
        return xhr;
    }

    static post(url: string, data: any, handler: Function, failhandler: Function = null) {
        var xhr = new XMLHttpRequest();

        xhr.open("POST", url);
        xhr.timeout = 30000;

        console.log("post", url, data)
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                var ret = JSON.parse(xhr.responseText);
                console.log(url, ret)
            
                if (handler) handler(ret);
            }
            else {
                console.log(xhr.status)
                xhr.abort();
            }
        };

        xhr.ontimeout = (e) => {
            let msg = "服务器无响应,请稍后再试-timeout"
            if (failhandler)
                failhandler(msg);
            else
                console.log(msg)
        };

        xhr.onabort = (e) => {


            let msg = "服务器无响应,请稍后再试-abort"
            console.log(e);
            if (failhandler)
                failhandler();
            else
                console.log(msg)
        };

        xhr.onerror = (e) => {
            let msg = "服务器无响应,请稍后再试-error"
            if (failhandler)
                failhandler(msg);
            else
                console.log(msg)
        }

        xhr.send(JSON.stringify(data));
        return xhr;
    }
}

