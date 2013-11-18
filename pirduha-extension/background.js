(function () {

    var token_request_uri = "https://oauth.vk.com/authorize?client_id=3335137&scope=wall,friends,offline,notes,photos&" + 
                            "redirect_uri=http%3A%2F%2Foauth.vk.com%2Fblank.html&response_type=token";
    var PIRDUHA = 937;

    // XHR

    var ajax = function (url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                callback(xhr.responseText);
            }
        }
        xhr.send();
    }

    // VK API

    var api = function (method, params, callback) {
        var url = "https://api.vk.com/method/" + method + "?access_token=" + access_token;
        for (var k in params) {
            url += "&" + k + "=" + params[k];
        }
        ajax(url, function (text) {
            try {
                var json = JSON.parse(text);
                if (json && json.response) {
                    callback(json.response);
                }
            } catch (e) {
                console.log(e);
            }
        });
    };


    // Pirduha API

    var upload = function (src, tab_id) {
        var img_src = encodeURIComponent(src);

        api("photos.getAlbums", {"gid": PIRDUHA}, function (response) {
            var albumId = 0;
            for (var i = 0; i < response.length; ++i) {
                albumId = Math.max(albumId, response[i].aid);
            }
            if (albumId <= 0) {
                console.log("Error: could not find last album");
                return;
            }

            api("photos.getUploadServer", {"gid": PIRDUHA, "aid": albumId}, function (response) {
                var upload_url = encodeURIComponent(response.upload_url);

                ajax("http://pirduha.grigoriev.me/upload2.php?img_src=" + img_src + "&upload_url=" + upload_url, function (text) {
                    try {
                        var json = JSON.parse(text);

                        api("photos.save", 
                            {
                                "gid": PIRDUHA, 
                                "aid": albumId, 
                                "caption": "via http://pirduha.grigoriev.me", 
                                "server": json.server,
                                "photos_list": json.photos_list,
                                "hash": json.hash
                            },
                            function (response) {
                                chrome.tabs.create({
                                    url: "https://vk.com/photo" + response[0].owner_id + "_" + response[0].pid
                                });
                            }
                        );
                    } catch (e) {
                        console.log(e);
                    }                    
                });
            });
        });
    };


    // Context menu initialization

    var enable = function () {
        chrome.contextMenus.create({
            "title": "Post to Pir Duha",
            "contexts": ["image"],
            "onclick": function (info, tab) {
                if (info.srcUrl) {
                    upload(info.srcUrl, tab.id);
                }
            }
        });
    };

    var access_token = window.localStorage.getItem("access_token");
    if (!access_token) {
        chrome.tabs.create(
            {
                url: token_request_uri
            }, 
            function (tab) {
                var intervalId = window.setInterval(function () {
                    chrome.tabs.get(tab.id, function (tab) {
                        if (tab.url.match(/oauth\.vk\.com\/blank\.html/)) {
                            window.clearInterval(intervalId);
                            var splitted1 = tab.url.split('#access_token=');
                            var splitted2 = splitted1[1].split('&');
                            window.localStorage.setItem("access_token", splitted2[0]);
                            access_token = splitted2[0];
                            console.log(access_token);
                            chrome.tabs.remove(tab.id);
                            enable();
                        }
                    });
                }, 1000);
            }
        );
    } else {
        enable();
    }

})();
