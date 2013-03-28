$(document).ready(function() {

    // ----------------------------- Variables -----------------------------
    var editorMapper = ace.edit("editorMapper");
    var editorReducer = ace.edit("editorReducer");
    var roomCount = 0;
    var lobbyendpoint = "http://localhost:3000/";
    var server = io.connect(lobbyendpoint);
    var roomId = GetURLParameter('room');
    var lang = GetURLParameter('lang');
    var pos = GetURLParameter('pos');
    var room = {};
    room.roomId = roomId;
    var username = $.now();
    // ----------------------------- Setup files -----------------------------
    setupEditor();
    checkRoomFull();
    enterRoom();


    function setupEditor() {
        // editor.setValue("function test(){ console.log('hello world!')}");
        editorMapper.setTheme("ace/theme/eclipse");
        if (lang === "javascript") {
            editorMapper.getSession().setMode("ace/mode/javascript");
        } else if (lang === "python") {
            editorMapper.getSession().setMode("ace/mode/python");
        }
        editorMapper.setShowPrintMargin(false);
        editorMapper.setHighlightActiveLine(true);
        editorMapper.resize();
        editorMapper.setBehavioursEnabled(true);
        editorMapper.getSession().setUseWrapMode(true);
        document.getElementById('editorMapper').style.fontSize = '14px';

        editorReducer.setTheme("ace/theme/eclipse");
        if (lang === "javascript") {
            editorReducer.getSession().setMode("ace/mode/javascript");
        } else if (lang === "python") {
            editorReducer.getSession().setMode("ace/mode/python");
        }
        editorReducer.setShowPrintMargin(false);
        editorReducer.setHighlightActiveLine(true);
        editorReducer.resize();
        editorReducer.setBehavioursEnabled(true);
        editorReducer.getSession().setUseWrapMode(true);
        document.getElementById('editorReducer').style.fontSize = '14px';

        if(pos==='reducer'){
            editorMapper.setReadOnly(true);
        }else if(pos==='mapper'){
            editorReducer.setReadOnly(true);
        }
    }


    // ----------------------------- Click Listeners -----------------------------



    // ----------------------------- Methods -----------------------------

    function checkRoomFull() {
        server.on('enterRoom' + roomId, function(room) {
            roomCount++;
            // roomCount = room.roomCount;
            // roomCount++;
            // room.roomCount = roomCount;
            // server.emit('connectRoom', room);
            if (roomCount == 2) {
                room.roomCount = roomCount;
                server.emit('closeRoom', room);
            }
            console.log(roomCount);
        });

    }

    function enterRoom() {
        console.log('Enter Room');
        if (roomCount == 0) {
            room.leader = username;
            // room.roomCount = roomCount;
        } else if (roomCount == 1) {
            room.member = username;
            // room.roomCount = roomCount;
        }
        server.emit('connectRoom', room);

    }

    // ----------------------------- Utility -----------------------------

    function GetURLParameter(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }

    function updateURLParameter(url, param, paramVal) {
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";
        if (additionalURL) {
            tempArray = additionalURL.split("&");
            for (i = 0; i < tempArray.length; i++) {
                if (tempArray[i].split('=')[0] != param) {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }

        var rows_txt = temp + "" + param + "=" + paramVal;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    }


});
